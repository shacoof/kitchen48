/**
 * Ingredient Routes
 * API endpoints for master ingredients management
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { ingredientService } from './ingredient.service.js';
import { createIngredientSchema, updateIngredientSchema } from './ingredient.types.js';
import { createLogger } from '../../lib/logger.js';

const router = Router();
const logger = createLogger('IngredientRoutes');

/**
 * GET /api/ingredients
 * List all master ingredients (admin only)
 */
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const ingredients = await ingredientService.getAll();
    res.json({ ingredients });
  } catch (error) {
    logger.error(`Error fetching ingredients: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

/**
 * GET /api/ingredients/categories
 * List unique categories (admin only)
 */
router.get('/categories', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const categories = await ingredientService.getCategories();
    res.json({ categories });
  } catch (error) {
    logger.error(`Error fetching categories: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/ingredients/:id
 * Get single ingredient by ID (admin only)
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const ingredient = await ingredientService.getById(id);

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    res.json({ ingredient });
  } catch (error) {
    logger.error(`Error fetching ingredient: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch ingredient' });
  }
});

/**
 * POST /api/ingredients
 * Create a new ingredient (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = createIngredientSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const ingredient = await ingredientService.create(validation.data);
    res.status(201).json({ ingredient });
  } catch (error) {
    logger.error(`Error creating ingredient: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

/**
 * PUT /api/ingredients/:id
 * Update an ingredient (admin only)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const validation = updateIngredientSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const ingredient = await ingredientService.update(id, validation.data);
    res.json({ ingredient });
  } catch (error) {
    logger.error(`Error updating ingredient: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Ingredient not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

/**
 * DELETE /api/ingredients/:id
 * Delete an ingredient (admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    await ingredientService.delete(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting ingredient: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message === 'Ingredient not found') {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export default router;
