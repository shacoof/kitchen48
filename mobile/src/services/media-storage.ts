import { Paths, File, Directory } from 'expo-file-system';
import { createLogger } from '../lib/logger';

const logger = createLogger('MediaStorage');

function getRecipesBaseDir(): Directory {
  return new Directory(Paths.document, 'recipes');
}

export async function ensureRecipeDir(recipeId: string): Promise<Directory> {
  const recipesDir = getRecipesBaseDir();
  if (!recipesDir.exists) {
    recipesDir.create();
  }
  const recipeDir = new Directory(recipesDir, recipeId);
  if (!recipeDir.exists) {
    recipeDir.create();
  }
  return recipeDir;
}

export async function saveMedia(
  recipeId: string,
  sourceUri: string,
  filename: string
): Promise<string> {
  const dir = await ensureRecipeDir(recipeId);
  const dest = new File(dir, filename);
  const source = new File(sourceUri);
  source.copy(dest);
  logger.debug(`Saved media: ${filename} for recipe ${recipeId}`);
  return dest.uri;
}

export async function deleteMedia(filePath: string): Promise<void> {
  const file = new File(filePath);
  if (file.exists) {
    file.delete();
    logger.debug(`Deleted media: ${filePath}`);
  }
}

export async function deleteRecipeMedia(recipeId: string): Promise<void> {
  const recipesDir = getRecipesBaseDir();
  const recipeDir = new Directory(recipesDir, recipeId);
  if (recipeDir.exists) {
    recipeDir.delete();
    logger.debug(`Deleted all media for recipe ${recipeId}`);
  }
}

export async function getRecipeMediaDir(recipeId: string): Promise<string> {
  const dir = await ensureRecipeDir(recipeId);
  return dir.uri;
}

export function getMediaUri(filePath: string | null | undefined): string | undefined {
  if (!filePath) return undefined;
  return filePath;
}
