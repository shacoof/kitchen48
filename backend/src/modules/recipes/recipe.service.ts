/**
 * Recipe Service
 * Business logic for recipes, steps, and step ingredients
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../core/database/prisma.js';
import { createLogger } from '../../lib/logger.js';
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateStepInput,
  UpdateStepInput,
  Recipe,
  RecipeListItem,
  RecipeQueryInput,
  ReorderStepsInput,
  AggregatedIngredient,
} from './recipe.types.js';

const logger = createLogger('RecipeService');

/** Select clause for media asset references */
const mediaAssetSelect = {
  id: true,
  type: true,
  url: true,
  thumbnailUrl: true,
  status: true,
  durationSeconds: true,
};

/** Include clause for full recipe with steps + ingredients + dietary tags + media */
const recipeFullInclude = {
  author: {
    select: {
      id: true,
      nickname: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
    },
  },
  heroImage: { select: mediaAssetSelect },
  introVideo: { select: mediaAssetSelect },
  steps: {
    orderBy: { order: 'asc' as const },
    include: {
      ingredients: {
        orderBy: { order: 'asc' as const },
      },
      image: { select: mediaAssetSelect },
      video: { select: mediaAssetSelect },
    },
  },
  dietaryTags: true,
};

class RecipeService {
  /**
   * Generate a URL-friendly slug from a title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  }

  /**
   * Get recipes with pagination and filtering
   */
  async getAll(query: RecipeQueryInput): Promise<{ recipes: RecipeListItem[]; total: number }> {
    const { page, limit, authorId, isPublished, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(authorId && { authorId }),
      ...(isPublished !== undefined && { isPublished }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          imageUrl: true,
          isPublished: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              nickname: true,
              firstName: true,
              lastName: true,
            },
          },
          heroImage: { select: mediaAssetSelect },
          introVideo: { select: mediaAssetSelect },
          _count: {
            select: { steps: true },
          },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    return { recipes, total };
  }

  /**
   * Get recipe by ID with all relations
   */
  async getById(id: string): Promise<Recipe | null> {
    logger.debug(`Fetching recipe by ID: ${id}`);
    return prisma.recipe.findUnique({
      where: { id },
      include: recipeFullInclude,
    }) as Promise<Recipe | null>;
  }

  /**
   * Get recipe by author nickname and recipe slug (semantic URL)
   */
  async getBySemanticUrl(nickname: string, recipeSlug: string): Promise<Recipe | null> {
    logger.debug(`Fetching recipe by semantic URL: ${nickname}/${recipeSlug}`);

    const user = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return prisma.recipe.findFirst({
      where: {
        authorId: user.id,
        slug: recipeSlug,
      },
      include: recipeFullInclude,
    }) as Promise<Recipe | null>;
  }

  /**
   * Get recipes by user nickname
   */
  async getByNickname(
    nickname: string,
    includeUnpublished = false
  ): Promise<RecipeListItem[]> {
    logger.debug(`Fetching recipes for user: ${nickname}`);

    const user = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    return prisma.recipe.findMany({
      where: {
        authorId: user.id,
        ...(includeUnpublished ? {} : { isPublished: true }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imageUrl: true,
        isPublished: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            lastName: true,
          },
        },
        heroImage: { select: mediaAssetSelect },
        introVideo: { select: mediaAssetSelect },
        _count: {
          select: { steps: true },
        },
      },
    });
  }

  /**
   * Create a new recipe with optional steps
   */
  async create(authorId: string, data: CreateRecipeInput): Promise<Recipe> {
    // Check for duplicate slug for this author
    const existing = await prisma.recipe.findFirst({
      where: { authorId, slug: data.slug },
    });

    if (existing) {
      throw new Error('You already have a recipe with this URL slug');
    }

    logger.debug(`Creating recipe: ${data.title} for author ${authorId}`);

    const recipe = await prisma.recipe.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        heroImageId: data.heroImageId,
        introVideoId: data.introVideoId,
        isPublished: data.isPublished,
        measurementSystem: data.measurementSystem,
        difficulty: data.difficulty,
        cuisine: data.cuisine,
        mealType: data.mealType,
        authorId,
        steps: {
          create: data.steps?.map((step, index) => ({
            slug: step.slug || `step${index + 1}`,
            title: step.title,
            instruction: step.instruction,
            order: step.order ?? index,
            duration: step.duration,
            videoUrl: step.videoUrl,
            imageId: step.imageId,
            videoId: step.videoId,
            prepTime: step.prepTime,
            prepTimeUnit: step.prepTimeUnit,
            waitTime: step.waitTime,
            waitTimeUnit: step.waitTimeUnit,
            ingredients: {
              create: step.ingredients?.map((ing, ingIndex) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                order: ing.order ?? ingIndex,
                masterIngredientId: ing.masterIngredientId,
              })),
            },
          })),
        },
        dietaryTags: {
          create: data.dietaryTags?.map((tag) => ({ tag })),
        },
      },
      include: recipeFullInclude,
    });

    return recipe as Recipe;
  }

  /**
   * Update a recipe
   */
  async update(id: string, authorId: string, data: UpdateRecipeInput): Promise<Recipe> {
    // Check if recipe exists and belongs to author
    const existing = await prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true, slug: true },
    });

    if (!existing) {
      throw new Error('Recipe not found');
    }

    if (existing.authorId !== authorId) {
      throw new Error('You can only edit your own recipes');
    }

    // If slug is changing, check for duplicates
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.recipe.findFirst({
        where: { authorId, slug: data.slug, id: { not: id } },
      });

      if (duplicate) {
        throw new Error('You already have a recipe with this URL slug');
      }
    }

    logger.debug(`Updating recipe: ${id}`);

    // Handle dietary tags: delete existing and recreate
    if (data.dietaryTags) {
      await prisma.recipeDietaryTag.deleteMany({ where: { recipeId: id } });
    }

    // Handle steps: delete existing and recreate (cascade deletes ingredients)
    if (data.steps) {
      await prisma.recipeStep.deleteMany({ where: { recipeId: id } });
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        heroImageId: data.heroImageId,
        introVideoId: data.introVideoId,
        isPublished: data.isPublished,
        measurementSystem: data.measurementSystem,
        difficulty: data.difficulty,
        cuisine: data.cuisine,
        mealType: data.mealType,
        ...(data.dietaryTags && {
          dietaryTags: {
            create: data.dietaryTags.map((tag) => ({ tag })),
          },
        }),
        ...(data.steps && {
          steps: {
            create: data.steps.map((step, index) => ({
              slug: step.slug || `step${index + 1}`,
              title: step.title,
              instruction: step.instruction,
              order: step.order ?? index,
              duration: step.duration,
              videoUrl: step.videoUrl,
              imageId: step.imageId,
              videoId: step.videoId,
              prepTime: step.prepTime,
              prepTimeUnit: step.prepTimeUnit,
              waitTime: step.waitTime,
              waitTimeUnit: step.waitTimeUnit,
              ingredients: {
                create: step.ingredients?.map((ing, ingIndex) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit,
                  order: ing.order ?? ingIndex,
                  masterIngredientId: ing.masterIngredientId,
                })),
              },
            })),
          },
        }),
      },
      include: recipeFullInclude,
    });

    return recipe as Recipe;
  }

  /**
   * Delete a recipe
   */
  async delete(id: string, authorId: string): Promise<void> {
    const existing = await prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      throw new Error('Recipe not found');
    }

    if (existing.authorId !== authorId) {
      throw new Error('You can only delete your own recipes');
    }

    logger.debug(`Deleting recipe: ${id}`);
    await prisma.recipe.delete({ where: { id } });
  }

  /**
   * Add a step to a recipe
   */
  async addStep(recipeId: string, authorId: string, data: CreateStepInput): Promise<Recipe> {
    // Verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
      throw new Error('You can only edit your own recipes');
    }

    // Check for duplicate step slug
    if (data.slug) {
      const existing = await prisma.recipeStep.findFirst({
        where: { recipeId, slug: data.slug },
      });

      if (existing) {
        throw new Error('A step with this slug already exists in this recipe');
      }
    }

    logger.debug(`Adding step to recipe: ${recipeId}`);

    await prisma.recipeStep.create({
      data: {
        recipeId,
        slug: data.slug,
        title: data.title,
        instruction: data.instruction,
        order: data.order,
        duration: data.duration,
        videoUrl: data.videoUrl,
        imageId: data.imageId,
        videoId: data.videoId,
        prepTime: data.prepTime,
        prepTimeUnit: data.prepTimeUnit,
        waitTime: data.waitTime,
        waitTimeUnit: data.waitTimeUnit,
        ingredients: {
          create: data.ingredients?.map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            order: ing.order ?? index,
            masterIngredientId: ing.masterIngredientId,
          })),
        },
      },
    });

    // Return updated recipe
    return this.getById(recipeId) as Promise<Recipe>;
  }

  /**
   * Update a step
   */
  async updateStep(
    recipeId: string,
    stepId: string,
    authorId: string,
    data: UpdateStepInput
  ): Promise<Recipe> {
    // Verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
      throw new Error('You can only edit your own recipes');
    }

    const step = await prisma.recipeStep.findUnique({
      where: { id: stepId },
      select: { recipeId: true, slug: true },
    });

    if (!step || step.recipeId !== recipeId) {
      throw new Error('Step not found in this recipe');
    }

    // Check for duplicate slug
    if (data.slug && data.slug !== step.slug) {
      const duplicate = await prisma.recipeStep.findFirst({
        where: { recipeId, slug: data.slug, id: { not: stepId } },
      });

      if (duplicate) {
        throw new Error('A step with this slug already exists in this recipe');
      }
    }

    logger.debug(`Updating step: ${stepId}`);

    await prisma.recipeStep.update({
      where: { id: stepId },
      data: {
        slug: data.slug,
        title: data.title,
        instruction: data.instruction,
        order: data.order,
        duration: data.duration,
        videoUrl: data.videoUrl,
        imageId: data.imageId,
        videoId: data.videoId,
        prepTime: data.prepTime,
        prepTimeUnit: data.prepTimeUnit,
        waitTime: data.waitTime,
        waitTimeUnit: data.waitTimeUnit,
      },
    });

    return this.getById(recipeId) as Promise<Recipe>;
  }

  /**
   * Delete a step
   */
  async deleteStep(recipeId: string, stepId: string, authorId: string): Promise<Recipe> {
    // Verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
      throw new Error('You can only delete your own recipes');
    }

    const step = await prisma.recipeStep.findUnique({
      where: { id: stepId },
      select: { recipeId: true },
    });

    if (!step || step.recipeId !== recipeId) {
      throw new Error('Step not found in this recipe');
    }

    logger.debug(`Deleting step: ${stepId}`);
    await prisma.recipeStep.delete({ where: { id: stepId } });

    return this.getById(recipeId) as Promise<Recipe>;
  }

  /**
   * Get aggregated ingredient summary across all steps of a recipe
   */
  async getIngredientSummary(recipeId: string): Promise<AggregatedIngredient[]> {
    logger.debug(`Getting ingredient summary for recipe: ${recipeId}`);

    const steps = await prisma.recipeStep.findMany({
      where: { recipeId },
      orderBy: { order: 'asc' },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
      },
    });

    // Group by name+unit (or masterIngredientId if available)
    const grouped = new Map<string, AggregatedIngredient>();

    for (const step of steps) {
      for (const ing of step.ingredients) {
        const key = ing.masterIngredientId
          ? `master:${ing.masterIngredientId}:${ing.unit || ''}`
          : `name:${ing.name.toLowerCase()}:${ing.unit || ''}`;

        const existing = grouped.get(key);
        const stepRef = {
          stepId: step.id,
          stepOrder: step.order,
          stepTitle: step.title,
        };

        if (existing) {
          if (existing.totalQuantity !== null && ing.quantity) {
            existing.totalQuantity += Number(ing.quantity);
          } else if (ing.quantity) {
            existing.totalQuantity = Number(ing.quantity);
          }
          existing.stepReferences.push(stepRef);
        } else {
          grouped.set(key, {
            name: ing.name,
            totalQuantity: ing.quantity ? Number(ing.quantity) : null,
            unit: ing.unit,
            masterIngredientId: ing.masterIngredientId,
            stepReferences: [stepRef],
          });
        }
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Save (bookmark) a recipe for a user
   */
  async saveRecipe(userId: string, recipeId: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, isPublished: true, authorId: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    if (!recipe.isPublished && recipe.authorId !== userId) {
      throw new Error('Recipe not found');
    }

    await prisma.savedRecipe.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      update: {},
      create: { userId, recipeId },
    });

    logger.debug(`User ${userId} saved recipe ${recipeId}`);
  }

  /**
   * Remove a saved (bookmarked) recipe for a user
   */
  async unsaveRecipe(userId: string, recipeId: string): Promise<void> {
    await prisma.savedRecipe.deleteMany({
      where: { userId, recipeId },
    });

    logger.debug(`User ${userId} unsaved recipe ${recipeId}`);
  }

  /**
   * Duplicate a recipe for the current user
   */
  async duplicateRecipe(recipeId: string, newAuthorId: string): Promise<Recipe> {
    const original = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            ingredients: { orderBy: { order: 'asc' } },
          },
        },
        dietaryTags: true,
      },
    });

    if (!original) {
      throw new Error('Recipe not found');
    }

    // Only allow duplicating published recipes or own recipes
    if (!original.isPublished && original.authorId !== newAuthorId) {
      throw new Error('Recipe not found');
    }

    // Generate unique slug for the copy
    let baseSlug = `${original.slug}-copy`;
    let slug = baseSlug;
    let counter = 2;

    while (await prisma.recipe.findFirst({ where: { authorId: newAuthorId, slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    logger.debug(`Duplicating recipe ${recipeId} for user ${newAuthorId}`);

    const recipe = await prisma.recipe.create({
      data: {
        title: `${original.title} (Copy)`,
        slug,
        description: original.description,
        prepTime: original.prepTime,
        cookTime: original.cookTime,
        servings: original.servings,
        imageUrl: original.imageUrl,
        videoUrl: original.videoUrl,
        heroImageId: original.heroImageId,
        introVideoId: original.introVideoId,
        isPublished: false,
        measurementSystem: original.measurementSystem,
        difficulty: original.difficulty,
        cuisine: original.cuisine,
        mealType: original.mealType,
        authorId: newAuthorId,
        steps: {
          create: original.steps.map((step) => ({
            slug: step.slug,
            title: step.title,
            instruction: step.instruction,
            order: step.order,
            duration: step.duration,
            videoUrl: step.videoUrl,
            imageId: step.imageId,
            videoId: step.videoId,
            prepTime: step.prepTime,
            prepTimeUnit: step.prepTimeUnit,
            waitTime: step.waitTime,
            waitTimeUnit: step.waitTimeUnit,
            ingredients: {
              create: step.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                order: ing.order,
                masterIngredientId: ing.masterIngredientId,
              })),
            },
          })),
        },
        dietaryTags: {
          create: original.dietaryTags.map((dt) => ({ tag: dt.tag })),
        },
      },
      include: recipeFullInclude,
    });

    return recipe as Recipe;
  }

  /**
   * Toggle the publish status of a recipe
   */
  async togglePublish(recipeId: string, authorId: string): Promise<Recipe> {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true, isPublished: true },
    });

    if (!existing) {
      throw new Error('Recipe not found');
    }

    if (existing.authorId !== authorId) {
      throw new Error('You can only publish your own recipes');
    }

    logger.debug(`Toggling publish for recipe ${recipeId}: ${!existing.isPublished}`);

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: { isPublished: !existing.isPublished },
      include: recipeFullInclude,
    });

    return recipe as Recipe;
  }

  /**
   * Reorder steps within a recipe
   */
  async reorderSteps(
    recipeId: string,
    authorId: string,
    data: ReorderStepsInput
  ): Promise<Recipe> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
      throw new Error('You can only edit your own recipes');
    }

    // Verify all step IDs belong to this recipe
    const existingSteps = await prisma.recipeStep.findMany({
      where: { recipeId },
      select: { id: true },
    });

    const existingIds = new Set(existingSteps.map((s) => s.id));
    for (const stepId of data.stepIds) {
      if (!existingIds.has(stepId)) {
        throw new Error(`Step ${stepId} not found in this recipe`);
      }
    }

    logger.debug(`Reordering ${data.stepIds.length} steps for recipe ${recipeId}`);

    // Update order for each step in a transaction
    await prisma.$transaction(
      data.stepIds.map((stepId, index) =>
        prisma.recipeStep.update({
          where: { id: stepId },
          data: { order: index },
        })
      )
    );

    return this.getById(recipeId) as Promise<Recipe>;
  }

  /**
   * Search master ingredients for autocomplete.
   * Uses pg_trgm similarity for fuzzy matching — handles typos and word-order swaps.
   * Also does per-word substring match so "extract vanilla" finds "vanilla extract".
   */
  async searchIngredients(query: string, limit = 10): Promise<Array<{ id: string; name: string }>> {
    if (!query || query.length < 2) {
      return [];
    }

    const trimmed = query.trim().toLowerCase();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);

    // Build a single pattern that checks all words appear in any order
    // Each word becomes a '%word%' LIKE pattern joined with AND via array_agg trick:
    // We use the approach: name ILIKE ALL(array['%word1%', '%word2%'])
    const wordPatterns = words.map(w => `%${w}%`);

    const results = await prisma.$queryRaw<Array<{ id: string; name: string; score: number }>>(
      Prisma.sql`
        SELECT id, name, score FROM (
          SELECT id, name, similarity(name, ${trimmed}) AS score
          FROM master_ingredients
          WHERE is_active = true
            AND similarity(name, ${trimmed}) > 0.15

          UNION

          SELECT id, name, 1.0::real AS score
          FROM master_ingredients
          WHERE is_active = true
            AND name ILIKE ALL(${wordPatterns}::text[])
        ) AS combined
        ORDER BY score DESC, name ASC
        LIMIT ${limit}
      `
    );

    return results.map(r => ({ id: r.id, name: r.name }));
  }
}

export const recipeService = new RecipeService();
export default recipeService;
