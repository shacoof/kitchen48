import { Paths, File, Directory } from 'expo-file-system';
import { stringify as stringifyYaml } from 'yaml';
import { getRecipeById, type RecipeWithSteps } from '../db/recipes-db';
import { createLogger } from '../lib/logger';
import { YAML_SCHEMA_VERSION, type RecipeYaml } from './recipe-yaml-schema';

const logger = createLogger('RecipeExport');

export interface ExportResult {
  folderUri: string;
  yamlFilename: string;
  mediaFilenames: string[];
  folderName: string;
}

function getExportsBaseDir(): Directory {
  return new Directory(Paths.document, 'exports');
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    || 'recipe';
}

function extractExtension(path: string): string {
  const last = path.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  if (dot < 0 || dot === last.length - 1) return 'bin';
  return last.substring(dot + 1).toLowerCase();
}

function copyMedia(srcPath: string, destDir: Directory, filename: string): string {
  const src = new File(srcPath);
  if (!src.exists) {
    logger.warning(`Source media missing, skipping: ${srcPath}`);
    return '';
  }
  const dest = new File(destDir, filename);
  if (dest.exists) dest.delete();
  src.copy(dest);
  return filename;
}

function buildYaml(recipe: RecipeWithSteps, mediaMap: Map<string, string>): RecipeYaml {
  return {
    version: YAML_SCHEMA_VERSION,
    title: recipe.title,
    description: recipe.description ?? null,
    servings: recipe.servings ?? null,
    measurementSystem: recipe.measurementSystem,
    difficulty: recipe.difficulty ?? null,
    cuisine: recipe.cuisine ?? null,
    mealType: recipe.mealType ?? null,
    dietaryTags: recipe.dietaryTags,
    heroImage: recipe.heroImagePath ? mediaMap.get(recipe.heroImagePath) ?? null : null,
    introVideo: recipe.introVideoPath ? mediaMap.get(recipe.introVideoPath) ?? null : null,
    steps: recipe.steps.map((s) => ({
      order: s.sortOrder,
      title: s.title ?? null,
      instruction: s.instruction ?? null,
      prepTime: s.prepTime ?? null,
      prepTimeUnit: s.prepTime != null ? s.prepTimeUnit : null,
      waitTime: s.waitTime ?? null,
      waitTimeUnit: s.waitTime != null ? s.waitTimeUnit : null,
      image: s.imagePath ? mediaMap.get(s.imagePath) ?? null : null,
      video: s.videoPath ? mediaMap.get(s.videoPath) ?? null : null,
      ingredients: s.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity ?? null,
        unit: i.unit ?? null,
      })),
    })),
  };
}

export async function exportRecipe(recipeId: string): Promise<ExportResult> {
  const start = Date.now();
  const recipe = await getRecipeById(recipeId);
  if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

  const exportsDir = getExportsBaseDir();
  if (!exportsDir.exists) exportsDir.create();

  const folderName = slugify(recipe.title) + '-' + recipeId.substring(0, 8);
  const recipeDir = new Directory(exportsDir, folderName);
  if (recipeDir.exists) recipeDir.delete();
  recipeDir.create();

  const mediaMap = new Map<string, string>();
  const mediaFilenames: string[] = [];

  if (recipe.heroImagePath) {
    const name = `hero.${extractExtension(recipe.heroImagePath)}`;
    const copied = copyMedia(recipe.heroImagePath, recipeDir, name);
    if (copied) {
      mediaMap.set(recipe.heroImagePath, copied);
      mediaFilenames.push(copied);
    }
  }
  if (recipe.introVideoPath) {
    const name = `intro.${extractExtension(recipe.introVideoPath)}`;
    const copied = copyMedia(recipe.introVideoPath, recipeDir, name);
    if (copied) {
      mediaMap.set(recipe.introVideoPath, copied);
      mediaFilenames.push(copied);
    }
  }
  for (const step of recipe.steps) {
    if (step.imagePath) {
      const name = `step-${step.sortOrder}.${extractExtension(step.imagePath)}`;
      const copied = copyMedia(step.imagePath, recipeDir, name);
      if (copied) {
        mediaMap.set(step.imagePath, copied);
        mediaFilenames.push(copied);
      }
    }
    if (step.videoPath) {
      const name = `step-${step.sortOrder}-video.${extractExtension(step.videoPath)}`;
      const copied = copyMedia(step.videoPath, recipeDir, name);
      if (copied) {
        mediaMap.set(step.videoPath, copied);
        mediaFilenames.push(copied);
      }
    }
  }

  const yamlData = buildYaml(recipe, mediaMap);
  const yamlString = stringifyYaml(yamlData, { indent: 2, lineWidth: 0 });
  const yamlFilename = 'kitchen48-recipe.yaml';
  const yamlFile = new File(recipeDir, yamlFilename);
  if (yamlFile.exists) yamlFile.delete();
  yamlFile.create();
  yamlFile.write(yamlString);

  logger.timing(`Exported recipe "${recipe.title}" to ${recipeDir.uri}`, start);

  return {
    folderUri: recipeDir.uri,
    folderName,
    yamlFilename,
    mediaFilenames,
  };
}

export async function copyExportToPickedFolder(result: ExportResult): Promise<string> {
  const picked = await Directory.pickDirectoryAsync();

  const src = new Directory(result.folderUri);
  const destRoot = new Directory(picked.uri, result.folderName);
  if (destRoot.exists) destRoot.delete();
  destRoot.create();

  const yamlSrc = new File(src, result.yamlFilename);
  yamlSrc.copy(new File(destRoot, result.yamlFilename));

  for (const name of result.mediaFilenames) {
    const mediaSrc = new File(src, name);
    if (mediaSrc.exists) {
      mediaSrc.copy(new File(destRoot, name));
    }
  }

  logger.debug(`Copied export to picked folder: ${destRoot.uri}`);
  return destRoot.uri;
}
