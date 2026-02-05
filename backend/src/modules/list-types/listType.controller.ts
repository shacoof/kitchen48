/**
 * List Types Controller
 * Request handlers for list type and value operations
 */

import { Request, Response } from 'express';
import { createLogger } from '../../lib/logger.js';
import { listTypeService } from './listType.service.js';
import {
  createListTypeSchema,
  updateListTypeSchema,
  createListValueSchema,
  updateListValueSchema,
} from './listType.types.js';

const logger = createLogger('ListTypeController');

// ============================================================================
// List Type Controllers
// ============================================================================

/**
 * GET /api/list-types
 * Get all list types with value count
 */
async function getAllListTypes(_req: Request, res: Response) {
  try {
    const listTypes = await listTypeService.getAllListTypes();
    res.json({ success: true, data: listTypes });
  } catch (error) {
    logger.error(`Failed to get list types: ${error}`);
    res.status(500).json({ error: 'Failed to get list types' });
  }
}

/**
 * GET /api/list-types/:id
 * Get a single list type by ID
 */
async function getListTypeById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const listType = await listTypeService.getListTypeById(id);

    if (!listType) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    res.json({ success: true, data: listType });
  } catch (error) {
    logger.error(`Failed to get list type: ${error}`);
    res.status(500).json({ error: 'Failed to get list type' });
  }
}

/**
 * POST /api/list-types
 * Create a new list type
 */
async function createListType(req: Request, res: Response) {
  try {
    const validation = createListTypeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const listType = await listTypeService.createListType(validation.data);
    res.status(201).json({ success: true, data: listType });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unique constraint')) {
      res.status(400).json({ error: 'A list type with this name already exists' });
      return;
    }

    logger.error(`Failed to create list type: ${error}`);
    res.status(500).json({ error: 'Failed to create list type' });
  }
}

/**
 * PUT /api/list-types/:id
 * Update a list type
 */
async function updateListType(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const validation = updateListTypeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    // Check if list type exists
    const existing = await listTypeService.getListTypeById(id);
    if (!existing) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    const listType = await listTypeService.updateListType(id, validation.data);
    res.json({ success: true, data: listType });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unique constraint')) {
      res.status(400).json({ error: 'A list type with this name already exists' });
      return;
    }

    logger.error(`Failed to update list type: ${error}`);
    res.status(500).json({ error: 'Failed to update list type' });
  }
}

/**
 * DELETE /api/list-types/:id
 * Delete a list type (cascades to values)
 */
async function deleteListType(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // Check if list type exists
    const existing = await listTypeService.getListTypeById(id);
    if (!existing) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    await listTypeService.deleteListType(id);
    res.json({ success: true, message: 'List type deleted' });
  } catch (error) {
    logger.error(`Failed to delete list type: ${error}`);
    res.status(500).json({ error: 'Failed to delete list type' });
  }
}

// ============================================================================
// List Value Controllers
// ============================================================================

/**
 * GET /api/list-types/:listTypeId/values
 * Get all values for a list type
 */
async function getValuesByListType(req: Request, res: Response) {
  try {
    const listTypeId = req.params.listTypeId as string;

    // Check if list type exists
    const listType = await listTypeService.getListTypeById(listTypeId);
    if (!listType) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    const values = await listTypeService.getValuesByListTypeId(listTypeId);
    res.json({ success: true, data: values });
  } catch (error) {
    logger.error(`Failed to get list values: ${error}`);
    res.status(500).json({ error: 'Failed to get list values' });
  }
}

/**
 * POST /api/list-types/:listTypeId/values
 * Create a new list value
 */
async function createValue(req: Request, res: Response) {
  try {
    const listTypeId = req.params.listTypeId as string;
    const validation = createListValueSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    // Check if list type exists
    const listType = await listTypeService.getListTypeById(listTypeId);
    if (!listType) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    const value = await listTypeService.createValue(listTypeId, validation.data);
    res.status(201).json({ success: true, data: value });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unique constraint')) {
      res.status(400).json({ error: 'A value with this code already exists for this list type' });
      return;
    }

    logger.error(`Failed to create list value: ${error}`);
    res.status(500).json({ error: 'Failed to create list value' });
  }
}

/**
 * PUT /api/list-types/:listTypeId/values/:valueId
 * Update a list value
 */
async function updateValue(req: Request, res: Response) {
  try {
    const listTypeId = req.params.listTypeId as string;
    const valueId = req.params.valueId as string;
    const validation = updateListValueSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    // Check if list type exists
    const listType = await listTypeService.getListTypeById(listTypeId);
    if (!listType) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    // Check if value exists and belongs to this list type
    const belongsToType = await listTypeService.valuesBelongsToListType(valueId, listTypeId);
    if (!belongsToType) {
      res.status(404).json({ error: 'List value not found' });
      return;
    }

    const value = await listTypeService.updateValue(valueId, validation.data);
    res.json({ success: true, data: value });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unique constraint')) {
      res.status(400).json({ error: 'A value with this code already exists for this list type' });
      return;
    }

    logger.error(`Failed to update list value: ${error}`);
    res.status(500).json({ error: 'Failed to update list value' });
  }
}

/**
 * DELETE /api/list-types/:listTypeId/values/:valueId
 * Delete a list value
 */
async function deleteValue(req: Request, res: Response) {
  try {
    const listTypeId = req.params.listTypeId as string;
    const valueId = req.params.valueId as string;

    // Check if list type exists
    const listType = await listTypeService.getListTypeById(listTypeId);
    if (!listType) {
      res.status(404).json({ error: 'List type not found' });
      return;
    }

    // Check if value exists and belongs to this list type
    const belongsToType = await listTypeService.valuesBelongsToListType(valueId, listTypeId);
    if (!belongsToType) {
      res.status(404).json({ error: 'List value not found' });
      return;
    }

    await listTypeService.deleteValue(valueId);
    res.json({ success: true, message: 'List value deleted' });
  } catch (error) {
    logger.error(`Failed to delete list value: ${error}`);
    res.status(500).json({ error: 'Failed to delete list value' });
  }
}

// ============================================================================
// Public API Controllers
// ============================================================================

/**
 * GET /api/list-values?type={typeName}
 * Get active values for a list type (for dropdowns)
 */
async function getActiveValues(req: Request, res: Response) {
  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      res.status(400).json({ error: 'Query parameter "type" is required' });
      return;
    }

    const values = await listTypeService.getActiveValuesByTypeName(type);
    res.json({ success: true, data: values });
  } catch (error) {
    logger.error(`Failed to get active list values: ${error}`);
    res.status(500).json({ error: 'Failed to get list values' });
  }
}

export const listTypeController = {
  // List Types
  getAllListTypes,
  getListTypeById,
  createListType,
  updateListType,
  deleteListType,
  // List Values
  getValuesByListType,
  createValue,
  updateValue,
  deleteValue,
  // Public API
  getActiveValues,
};
