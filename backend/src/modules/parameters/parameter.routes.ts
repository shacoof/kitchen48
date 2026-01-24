/**
 * Parameter Routes
 * API endpoints for parameters management
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { parameterService } from './parameter.service.js';
import { createParameterSchema, updateParameterSchema } from './parameter.types.js';

const router = Router();

/**
 * GET /api/parameters
 * List all parameters (admin only)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const parameters = await parameterService.getAll();
    res.json({ parameters });
  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({ error: 'Failed to fetch parameters' });
  }
});

/**
 * GET /api/parameters/categories
 * List unique categories (admin only)
 */
router.get('/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await parameterService.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/parameters/value
 * Get parameter value with hierarchical fallback
 * Query params: key, userId (optional), organizationId (optional)
 */
router.get('/value', requireAuth, async (req, res) => {
  try {
    const { key, userId, organizationId } = req.query;

    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'Key is required' });
      return;
    }

    const value = await parameterService.getValue(
      key,
      userId as string | undefined,
      organizationId as string | undefined
    );

    res.json({ key, value });
  } catch (error) {
    console.error('Error fetching parameter value:', error);
    res.status(500).json({ error: 'Failed to fetch parameter value' });
  }
});

/**
 * GET /api/parameters/:id
 * Get single parameter by ID (admin only)
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const parameter = await parameterService.getById(id);

    if (!parameter) {
      res.status(404).json({ error: 'Parameter not found' });
      return;
    }

    res.json({ parameter });
  } catch (error) {
    console.error('Error fetching parameter:', error);
    res.status(500).json({ error: 'Failed to fetch parameter' });
  }
});

/**
 * POST /api/parameters
 * Create a new parameter (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = createParameterSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const parameter = await parameterService.create(validation.data, req.userId);
    res.status(201).json({ parameter });
  } catch (error) {
    console.error('Error creating parameter:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create parameter' });
  }
});

/**
 * PUT /api/parameters/:id
 * Update a parameter (admin only)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateParameterSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const parameter = await parameterService.update(id, validation.data, req.userId);
    res.json({ parameter });
  } catch (error) {
    console.error('Error updating parameter:', error);

    if (error instanceof Error) {
      if (error.message === 'Parameter not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to update parameter' });
  }
});

/**
 * DELETE /api/parameters/:id
 * Delete a parameter (admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await parameterService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting parameter:', error);

    if (error instanceof Error && error.message === 'Parameter not found') {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to delete parameter' });
  }
});

export default router;
