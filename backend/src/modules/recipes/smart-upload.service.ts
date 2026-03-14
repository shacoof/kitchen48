/**
 * Smart Upload Service
 * Uses Claude Vision API to extract recipe data from photos
 */

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { recipeService } from './recipe.service.js';
import type { CreateRecipeInput } from './recipe.types.js';
import type { ExtractedRecipe, SmartUploadResult } from './smart-upload.types.js';

const logger = createLogger('SmartUploadService');

const EXTRACTION_PROMPT = `You are a recipe extraction assistant. Analyze the provided recipe photo(s) and extract all recipe information into structured JSON.

IMPORTANT RULES:
- Extract as much information as possible from the images
- If something is unclear or partially visible, make your best guess and prefix the value with "[REVIEW] "
- For ingredients, identify: name, quantity (as a number), and unit (use standard codes: g, kg, ml, l, cups, tbsp, tsp, pieces, pinch, cloves, slices, whole, bunch, oz, lb, fl_oz)
- For steps, break down the recipe into clear individual steps
- If you can identify timing information (prep time, wait time), include it in minutes
- Determine the measurement system used: "metric" or "imperial"
- Try to identify: difficulty (easy/medium/hard), cuisine type, meal type, dietary tags

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "title": "Recipe Title",
  "description": "Brief description of the dish",
  "servings": 4,
  "measurementSystem": "metric",
  "difficulty": "easy",
  "cuisine": "italian",
  "mealType": "dinner",
  "dietaryTags": ["vegetarian"],
  "steps": [
    {
      "instruction": "Step instruction text",
      "prepTime": 10,
      "prepTimeUnit": "MINUTES",
      "waitTime": null,
      "waitTimeUnit": null,
      "ingredients": [
        { "name": "flour", "quantity": 200, "unit": "g" },
        { "name": "salt", "quantity": 1, "unit": "tsp" }
      ]
    }
  ],
  "warnings": ["List any items that were unclear or guessed"]
}`;

class SmartUploadService {
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
   * Extract recipe data from uploaded images using Claude Vision API
   */
  async extractFromImages(imageBuffers: Array<{ buffer: Buffer; mimeType: string }>): Promise<ExtractedRecipe> {
    const client = this.getClient();
    const startTime = Date.now();

    // Build image content blocks
    const imageBlocks: Anthropic.Messages.ImageBlockParam[] = imageBuffers.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.buffer.toString('base64'),
      },
    }));

    logger.debug(`Sending ${imageBlocks.length} image(s) to Claude API for extraction`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block: { type: string }) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    logger.timing('Claude API extraction', startTime);

    // Parse JSON response — strip markdown code blocks if present
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let extracted: ExtractedRecipe;
    try {
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      logger.error(`Failed to parse Claude API response as JSON: ${jsonStr.substring(0, 200)}`);
      throw new Error('Failed to parse recipe extraction result');
    }

    // Ensure warnings array exists
    if (!extracted.warnings) {
      extracted.warnings = [];
    }

    // Ensure steps array exists
    if (!extracted.steps || !Array.isArray(extracted.steps)) {
      extracted.steps = [];
      extracted.warnings.push('No steps could be extracted from the images');
    }

    logger.debug(`Extracted recipe: "${extracted.title}" with ${extracted.steps.length} steps`);
    return extracted;
  }

  /**
   * Create a recipe from extracted data
   */
  async createFromExtraction(authorId: string, extracted: ExtractedRecipe): Promise<SmartUploadResult> {
    // Generate slug from title
    const slug = extracted.title
      .toLowerCase()
      .replace(/\[review\]\s*/gi, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80) || 'untitled-recipe';

    // Build CreateRecipeInput from extracted data
    const recipeInput: CreateRecipeInput = {
      title: extracted.title || 'Untitled Recipe',
      slug,
      description: extracted.description || null,
      servings: extracted.servings || null,
      measurementSystem: extracted.measurementSystem || null,
      difficulty: extracted.difficulty || null,
      cuisine: extracted.cuisine || null,
      mealType: extracted.mealType || null,
      dietaryTags: extracted.dietaryTags || [],
      isPublished: false,
      imageUrl: null,
      videoUrl: null,
      heroImageId: null,
      introVideoId: null,
      prepTime: null,
      cookTime: null,
      steps: extracted.steps.map((step, index) => ({
        instruction: step.instruction,
        order: index,
        prepTime: step.prepTime || null,
        prepTimeUnit: step.prepTimeUnit as 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS' | null || null,
        waitTime: step.waitTime || null,
        waitTimeUnit: step.waitTimeUnit as 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS' | null || null,
        slug: null,
        title: null,
        duration: null,
        videoUrl: null,
        imageId: null,
        videoId: null,
        ingredients: step.ingredients.map((ing, ingIndex) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit || null,
          order: ingIndex,
          masterIngredientId: null,
        })),
      })),
    };

    // Create recipe using existing service
    const recipe = await recipeService.create(authorId, recipeInput);

    logger.debug(`Smart upload created recipe: ${recipe.id} ("${recipe.title}")`);

    return {
      recipe: {
        id: recipe.id,
        slug: recipe.slug,
      },
      warnings: extracted.warnings,
    };
  }

  /**
   * Full smart upload flow: extract from images + create recipe
   */
  async processUpload(
    authorId: string,
    imageBuffers: Array<{ buffer: Buffer; mimeType: string }>
  ): Promise<SmartUploadResult> {
    const extracted = await this.extractFromImages(imageBuffers);
    return this.createFromExtraction(authorId, extracted);
  }
}

export const smartUploadService = new SmartUploadService();
