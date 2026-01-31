/**
 * Recipe Routes
 * API endpoints for recipe management
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { recipeService } from './recipe.service.js';
import {
  createRecipeSchema,
  updateRecipeSchema,
  createStepSchema,
  updateStepSchema,
  recipeQuerySchema,
} from './recipe.types.js';
import { createLogger } from '../../lib/logger.js';

const router = Router();
const logger = createLogger('RecipeRoutes');

/**
 * GET /api/recipes
 * List recipes with pagination and filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validation = recipeQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await recipeService.getAll(validation.data);
    res.json({
      recipes: result.recipes,
      total: result.total,
      page: validation.data.page,
      limit: validation.data.limit,
    });
  } catch (error) {
    logger.error(`Error fetching recipes: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

/**
 * GET /api/recipes/search-ingredients
 * Search master ingredients for autocomplete
 */
router.get('/search-ingredients', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const ingredients = await recipeService.searchIngredients(query);
    res.json({ ingredients });
  } catch (error) {
    logger.error(`Error searching ingredients: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to search ingredients' });
  }
});

/**
 * GET /api/recipes/:id
 * Get recipe by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const recipe = await recipeService.getById(id);

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // If not published, only author can view
    if (!recipe.isPublished) {
      if (!req.userId || req.userId !== recipe.authorId) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
    }

    res.json({ recipe });
  } catch (error) {
    logger.error(`Error fetching recipe: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

/**
 * POST /api/recipes
 * Create a new recipe (auth required)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = createRecipeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const recipe = await recipeService.create(req.userId!, validation.data);
    res.status(201).json({ recipe });
  } catch (error) {
    logger.error(`Error creating recipe: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message.includes('already have a recipe')) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a recipe (auth required, owner only)
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validation = updateRecipeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const recipe = await recipeService.update(id, req.userId!, validation.data);
    res.json({ recipe });
  } catch (error) {
    logger.error(`Error updating recipe: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Recipe not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only edit your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
      if (error.message.includes('already have a recipe')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe (auth required, owner only)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await recipeService.delete(id, req.userId!);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting recipe: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Recipe not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only delete your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

/**
 * POST /api/recipes/:id/steps
 * Add a step to a recipe (auth required, owner only)
 */
router.post('/:id/steps', requireAuth, async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id as string;
    const validation = createStepSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const recipe = await recipeService.addStep(recipeId, req.userId!, validation.data);
    res.status(201).json({ recipe });
  } catch (error) {
    logger.error(`Error adding step: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Recipe not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only edit your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
      if (error.message.includes('step with this slug')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to add step' });
  }
});

/**
 * PUT /api/recipes/:id/steps/:stepId
 * Update a step (auth required, owner only)
 */
router.put('/:id/steps/:stepId', requireAuth, async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id as string;
    const stepId = req.params.stepId as string;
    const validation = updateStepSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const recipe = await recipeService.updateStep(recipeId, stepId, req.userId!, validation.data);
    res.json({ recipe });
  } catch (error) {
    logger.error(`Error updating step: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only edit your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
      if (error.message.includes('step with this slug')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to update step' });
  }
});

/**
 * DELETE /api/recipes/:id/steps/:stepId
 * Delete a step (auth required, owner only)
 */
router.delete('/:id/steps/:stepId', requireAuth, async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id as string;
    const stepId = req.params.stepId as string;

    const recipe = await recipeService.deleteStep(recipeId, stepId, req.userId!);
    res.json({ recipe });
  } catch (error) {
    logger.error(`Error deleting step: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only edit your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to delete step' });
  }
});

export default router;
