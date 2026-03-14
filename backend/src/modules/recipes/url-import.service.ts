/**
 * URL Import Service
 * Fetches recipe from a URL and extracts data using Claude API.
 * The extraction prompt is loaded at runtime from docs/recipe-scraping.md —
 * editing that file changes behavior without code changes.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { smartUploadService } from './smart-upload.service.js';
import type { ExtractedRecipe, SmartUploadResult } from './smart-upload.types.js';

const logger = createLogger('UrlImportService');

class UrlImportService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  /**
   * Load the scraping instructions from docs/recipe-scraping.md at runtime
   */
  private async loadScrapingDoc(): Promise<string> {
    // Resolve relative to project root (backend runs from backend/ or project root)
    const candidates = [
      resolve(process.cwd(), 'docs/recipe-scraping.md'),
      resolve(process.cwd(), '../docs/recipe-scraping.md'),
    ];

    for (const path of candidates) {
      try {
        const content = await readFile(path, 'utf-8');
        logger.debug(`Loaded scraping doc from ${path}`);
        return content;
      } catch {
        // Try next candidate
      }
    }

    throw new Error('Could not find docs/recipe-scraping.md');
  }

  /**
   * Extract the URL slug from a recipe URL for WordPress REST API lookup
   */
  private extractSlug(url: string): string {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname);
    // Remove trailing slash and get last segment
    const segments = pathname.replace(/\/$/, '').split('/');
    return segments[segments.length - 1] || '';
  }

  /**
   * Try to fetch recipe content via WordPress REST API
   * Returns the post HTML content if successful, null otherwise
   */
  private async tryWordPressApi(url: string): Promise<string | null> {
    try {
      const parsed = new URL(url);
      const slug = this.extractSlug(url);
      if (!slug) return null;

      const wpUrl = `${parsed.origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`;
      logger.debug(`Trying WordPress REST API: ${wpUrl}`);

      const response = await fetch(wpUrl, {
        headers: { 'User-Agent': 'Kitchen48/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return null;

      const posts = await response.json();
      if (!Array.isArray(posts) || posts.length === 0) return null;

      const content = posts[0]?.content?.rendered;
      if (!content || typeof content !== 'string') return null;

      logger.debug(`WordPress API returned content (${content.length} chars)`);
      return content;
    } catch (error) {
      logger.debug(`WordPress API failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Fetch page content directly via HTTP GET
   */
  private async fetchDirectly(url: string): Promise<string> {
    logger.debug(`Fetching URL directly: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Kitchen48/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    logger.debug(`Direct fetch returned ${html.length} chars`);
    return html;
  }

  /**
   * Fetch page content using the strategy from the scraping doc:
   * 1. Try WordPress REST API first
   * 2. Fall back to direct fetch
   */
  async fetchPageContent(url: string): Promise<string> {
    // Strategy step 1: Try WordPress REST API
    const wpContent = await this.tryWordPressApi(url);
    if (wpContent) {
      return wpContent;
    }

    // Strategy step 2: Direct fetch
    return this.fetchDirectly(url);
  }

  /**
   * Extract recipe data from page content using Claude API
   * The extraction prompt comes from docs/recipe-scraping.md
   */
  async extractFromUrl(url: string): Promise<ExtractedRecipe> {
    const client = this.getClient();
    const startTime = Date.now();

    // Load the scraping document at runtime
    const scrapingDoc = await this.loadScrapingDoc();

    // Fetch page content
    const pageContent = await this.fetchPageContent(url);

    if (!pageContent || pageContent.trim().length < 100) {
      throw new Error('Page content is too short or empty — the URL may not contain a recipe');
    }

    // Truncate very long pages to avoid token limits
    const maxContentLength = 50000;
    const truncatedContent = pageContent.length > maxContentLength
      ? pageContent.substring(0, maxContentLength) + '\n\n[Content truncated]'
      : pageContent;

    logger.debug(`Sending page content (${truncatedContent.length} chars) to Claude API for extraction`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${scrapingDoc}\n\n---\n\nExtract the recipe from the following web page content. The source URL is: ${url}\n\n---\n\n${truncatedContent}`,
        },
      ],
    });

    const textBlock = response.content.find((block: { type: string }) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    logger.timing('Claude API URL extraction', startTime);

    // Parse JSON response — strip markdown code blocks if present
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let extracted: ExtractedRecipe;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      logger.error(`Failed to parse Claude API response as JSON: ${jsonStr.substring(0, 200)}`);
      throw new Error('Failed to parse recipe extraction result');
    }

    // Ensure required arrays exist
    if (!extracted.warnings) {
      extracted.warnings = [];
    }
    if (!extracted.steps || !Array.isArray(extracted.steps)) {
      extracted.steps = [];
      extracted.warnings.push('No steps could be extracted from the page');
    }

    logger.debug(`Extracted recipe: "${extracted.title}" with ${extracted.steps.length} steps`);
    return extracted;
  }

  /**
   * Full URL import flow: fetch page → extract recipe → create in DB
   */
  async processUrlImport(authorId: string, url: string): Promise<SmartUploadResult> {
    const extracted = await this.extractFromUrl(url);
    return smartUploadService.createFromExtraction(authorId, extracted);
  }
}

export const urlImportService = new UrlImportService();
