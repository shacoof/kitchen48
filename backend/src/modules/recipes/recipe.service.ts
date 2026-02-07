/**
 * Recipe Service
 * Business logic for recipes, steps, and step ingredients
 */

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
} from './recipe.types.js';

const logger = createLogger('RecipeService');

/** Include clause for full recipe with steps + ingredients + dietary tags */
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
  steps: {
    orderBy: { order: 'asc' as const },
    include: {
      ingredients: {
        orderBy: { order: 'asc' as const },
      },
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
   * Search master ingredients for autocomplete
   */
  async searchIngredients(query: string, limit = 10): Promise<Array<{ id: string; name: string }>> {
    if (!query || query.length < 2) {
      return [];
    }

    return prisma.masterIngredient.findMany({
      where: {
        name: { contains: query.toLowerCase(), mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true, name: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}

export const recipeService = new RecipeService();
export default recipeService;
