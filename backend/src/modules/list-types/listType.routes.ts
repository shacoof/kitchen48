/**
 * List Types Routes
 * API endpoints for list type and value management
 */

import { Router } from 'express';
import { listTypeController } from './listType.controller.js';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';

const router = Router();

// ============================================================================
// List Type Routes (Admin only)
// ============================================================================

/**
 * GET /api/list-types
 * Get all list types with value count
 */
router.get('/', requireAuth, requireAdmin, listTypeController.getAllListTypes);

/**
 * POST /api/list-types
 * Create a new list type
 */
router.post('/', requireAuth, requireAdmin, listTypeController.createListType);

/**
 * GET /api/list-types/:id
 * Get a single list type by ID
 */
router.get('/:id', requireAuth, requireAdmin, listTypeController.getListTypeById);

/**
 * PUT /api/list-types/:id
 * Update a list type
 */
router.put('/:id', requireAuth, requireAdmin, listTypeController.updateListType);

/**
 * DELETE /api/list-types/:id
 * Delete a list type (cascades to values)
 */
router.delete('/:id', requireAuth, requireAdmin, listTypeController.deleteListType);

// ============================================================================
// List Value Routes (Admin only)
// ============================================================================

/**
 * GET /api/list-types/:listTypeId/values
 * Get all values for a list type
 */
router.get('/:listTypeId/values', requireAuth, requireAdmin, listTypeController.getValuesByListType);

/**
 * POST /api/list-types/:listTypeId/values
 * Create a new list value
 */
router.post('/:listTypeId/values', requireAuth, requireAdmin, listTypeController.createValue);

/**
 * PUT /api/list-types/:listTypeId/values/:valueId
 * Update a list value
 */
router.put('/:listTypeId/values/:valueId', requireAuth, requireAdmin, listTypeController.updateValue);

/**
 * DELETE /api/list-types/:listTypeId/values/:valueId
 * Delete a list value
 */
router.delete('/:listTypeId/values/:valueId', requireAuth, requireAdmin, listTypeController.deleteValue);

export default router;

// ============================================================================
// Public API Router (for consuming values in dropdowns)
// ============================================================================

export const listValuesPublicRouter = Router();

/**
 * GET /api/list-values?type={typeName}
 * Get active values for a list type (authenticated users)
 */
listValuesPublicRouter.get('/', requireAuth, listTypeController.getActiveValues);
