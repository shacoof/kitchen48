import { File, Directory } from 'expo-file-system';
import { parse as parseYaml } from 'yaml';
import {
  createRecipe,
  updateRecipe,
  createStep,
  updateStep,
  createIngredient,
  setDietaryTags,
} from '../db/recipes-db';
import { ensureRecipeDir } from './media-storage';
import { createLogger } from '../lib/logger';
import { recipeYamlSchema, type RecipeYaml } from './recipe-yaml-schema';

const logger = createLogger('RecipeImport');

export interface ImportResult {
  recipeId: string;
  title: string;
  mediaDownloaded: number;
  mediaSkipped: number;
}

export class ImportError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ImportError';
  }
}

function isAbsoluteUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

/**
 * Transform common share URLs into direct-download form so `fetch` returns the
 * raw file bytes instead of a viewer HTML page.
 */
function normalizeUrl(url: string): string {
  // Google Drive: https://drive.google.com/file/d/{ID}/view?usp=sharing
  const driveFile = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//i);
  if (driveFile) {
    return `https://drive.google.com/uc?id=${driveFile[1]}&export=download`;
  }
  // Google Drive: https://drive.google.com/open?id={ID}
  const driveOpen = url.match(/^https?:\/\/drive\.google\.com\/open\?id=([^&]+)/i);
  if (driveOpen) {
    return `https://drive.google.com/uc?id=${driveOpen[1]}&export=download`;
  }
  // Dropbox: change dl=0 to dl=1 (or append dl=1) for direct download
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(url)) {
    if (/[?&]dl=0\b/.test(url)) return url.replace(/([?&])dl=0\b/, '$1dl=1');
    if (!/[?&]dl=1\b/.test(url)) return url + (url.includes('?') ? '&' : '?') + 'dl=1';
  }
  // GitHub blob view → raw
  const ghBlob = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
  if (ghBlob) {
    return `https://raw.githubusercontent.com/${ghBlob[1]}/${ghBlob[2]}/${ghBlob[3]}`;
  }
  return url;
}

function resolveMediaUrl(ref: string, yamlUrl: string): string {
  if (isAbsoluteUrl(ref)) return normalizeUrl(ref);
  const lastSlash = yamlUrl.lastIndexOf('/');
  if (lastSlash < 0) throw new ImportError(`Cannot resolve relative path "${ref}" against yaml URL "${yamlUrl}"`);
  const base = yamlUrl.substring(0, lastSlash + 1);
  return base + ref.replace(/^\.?\//, '');
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 200).toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

function filenameFromRef(ref: string): string {
  if (isAbsoluteUrl(ref)) {
    try {
      const url = new URL(ref);
      const last = url.pathname.split('/').pop() ?? '';
      if (last && last.includes('.')) return last;
    } catch {
      // fall through
    }
    return `media-${Date.now()}`;
  }
  return ref.split('/').pop() ?? ref;
}

async function downloadMedia(
  url: string,
  destDir: Directory,
  filename: string
): Promise<string | null> {
  try {
    const dest = new File(destDir, filename);
    if (dest.exists) dest.delete();
    await File.downloadFileAsync(url, dest);
    return dest.uri;
  } catch (err) {
    logger.warning(`Failed to download media: ${url} — ${String(err)}`);
    return null;
  }
}

async function fetchYaml(yamlUrl: string): Promise<RecipeYaml> {
  let res: Response;
  try {
    res = await fetch(yamlUrl);
  } catch (err) {
    throw new ImportError(`Network error fetching YAML: ${String(err)}`, err);
  }
  if (!res.ok) {
    throw new ImportError(`Failed to fetch YAML (HTTP ${res.status}): ${yamlUrl}`);
  }
  const text = await res.text();

  if (looksLikeHtml(text)) {
    throw new ImportError(
      'The URL returned an HTML page, not a YAML file. ' +
      'For Google Drive, open the file, click Share → "Anyone with the link", then use the direct-download URL: ' +
      'https://drive.google.com/uc?id=FILE_ID (replace FILE_ID with the ID from the share link). ' +
      'For GitHub, use the "Raw" link (raw.githubusercontent.com/...). ' +
      'For Dropbox, use the ?dl=1 link.'
    );
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(text);
  } catch (err) {
    throw new ImportError(`Invalid YAML syntax: ${String(err)}`, err);
  }

  const result = recipeYamlSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ImportError(`YAML validation failed: ${issues}`);
  }
  return result.data;
}

export async function importRecipeFromUrl(yamlUrl: string): Promise<ImportResult> {
  const start = Date.now();
  const trimmedUrl = yamlUrl.trim();
  if (!isAbsoluteUrl(trimmedUrl)) {
    throw new ImportError('URL must start with http:// or https://');
  }

  const normalizedUrl = normalizeUrl(trimmedUrl);
  logger.debug(`Fetching YAML from: ${normalizedUrl}`);
  const data = await fetchYaml(normalizedUrl);
  logger.debug(`YAML parsed: title="${data.title}", steps=${data.steps.length}, tags=${data.dietaryTags?.length ?? 0}`);

  let recipeId: string;
  try {
    recipeId = await createRecipe({
      title: data.title,
      description: data.description ?? undefined,
      servings: data.servings ?? undefined,
      measurementSystem: data.measurementSystem,
      difficulty: data.difficulty ?? undefined,
      cuisine: data.cuisine ?? undefined,
      mealType: data.mealType ?? undefined,
    });
    logger.debug(`Recipe row created: ${recipeId}`);
  } catch (err) {
    throw new ImportError(`Failed at createRecipe: ${String(err)}`, err);
  }

  if (data.dietaryTags && data.dietaryTags.length > 0) {
    try {
      await setDietaryTags(recipeId, data.dietaryTags);
      logger.debug(`Dietary tags set: ${data.dietaryTags.length}`);
    } catch (err) {
      throw new ImportError(`Failed at setDietaryTags: ${String(err)}`, err);
    }
  }

  const mediaDir = await ensureRecipeDir(recipeId);
  let downloaded = 0;
  let skipped = 0;

  let heroPath: string | null = null;
  let introPath: string | null = null;

  if (data.heroImage) {
    const mediaUrl = resolveMediaUrl(data.heroImage, normalizedUrl);
    const filename = `hero-${Date.now()}-${filenameFromRef(data.heroImage)}`;
    heroPath = await downloadMedia(mediaUrl, mediaDir, filename);
    heroPath ? downloaded++ : skipped++;
  }
  if (data.introVideo) {
    const mediaUrl = resolveMediaUrl(data.introVideo, normalizedUrl);
    const filename = `intro-${Date.now()}-${filenameFromRef(data.introVideo)}`;
    introPath = await downloadMedia(mediaUrl, mediaDir, filename);
    introPath ? downloaded++ : skipped++;
  }

  if (heroPath || introPath) {
    await updateRecipe(recipeId, {
      heroImagePath: heroPath,
      introVideoPath: introPath,
    });
  }

  const sortedSteps = [...data.steps].sort((a, b) => a.order - b.order);
  for (const step of sortedSteps) {
    let stepId: string;
    try {
      stepId = await createStep({
        recipeId,
        title: step.title ?? undefined,
        instruction: step.instruction ?? undefined,
        sortOrder: step.order,
        prepTime: step.prepTime ?? undefined,
        prepTimeUnit: step.prepTimeUnit ?? undefined,
        waitTime: step.waitTime ?? undefined,
        waitTimeUnit: step.waitTimeUnit ?? undefined,
      });
      logger.debug(`Step created: order=${step.order}, id=${stepId}`);
    } catch (err) {
      throw new ImportError(`Failed at createStep (order=${step.order}): ${String(err)}`, err);
    }

    let stepImagePath: string | null = null;
    let stepVideoPath: string | null = null;

    if (step.image) {
      const mediaUrl = resolveMediaUrl(step.image, normalizedUrl);
      const filename = `step-${step.order}-img-${Date.now()}-${filenameFromRef(step.image)}`;
      stepImagePath = await downloadMedia(mediaUrl, mediaDir, filename);
      stepImagePath ? downloaded++ : skipped++;
    }
    if (step.video) {
      const mediaUrl = resolveMediaUrl(step.video, normalizedUrl);
      const filename = `step-${step.order}-vid-${Date.now()}-${filenameFromRef(step.video)}`;
      stepVideoPath = await downloadMedia(mediaUrl, mediaDir, filename);
      stepVideoPath ? downloaded++ : skipped++;
    }

    if (stepImagePath || stepVideoPath) {
      await updateStep(stepId, {
        imagePath: stepImagePath,
        videoPath: stepVideoPath,
      });
    }

    if (step.ingredients && step.ingredients.length > 0) {
      for (let i = 0; i < step.ingredients.length; i++) {
        const ing = step.ingredients[i];
        try {
          await createIngredient({
            stepId,
            name: ing.name,
            quantity: ing.quantity ?? undefined,
            unit: ing.unit ?? undefined,
            sortOrder: i,
          });
        } catch (err) {
          throw new ImportError(
            `Failed at createIngredient (step order=${step.order}, ing ${i}, name="${ing.name}"): ${String(err)}`,
            err
          );
        }
      }
    }
  }

  logger.timing(`Imported recipe "${data.title}" (${downloaded} media, ${skipped} skipped)`, start);

  return {
    recipeId,
    title: data.title,
    mediaDownloaded: downloaded,
    mediaSkipped: skipped,
  };
}
