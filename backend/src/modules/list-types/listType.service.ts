/**
 * List Types Service
 * Business logic for managing list types and values
 */

import { prisma } from '../../core/database/prisma.js';
import { createLogger } from '../../lib/logger.js';
import type {
  CreateListTypeInput,
  UpdateListTypeInput,
  CreateListValueInput,
  UpdateListValueInput,
  ListTypeWithCount,
  ListValueResponse,
  ListValueOption,
} from './listType.types.js';

const logger = createLogger('ListTypeService');

class ListTypeService {
  // ============================================================================
  // List Type Operations
  // ============================================================================

  /**
   * Get all list types with value count
   */
  async getAllListTypes(): Promise<ListTypeWithCount[]> {
    logger.debug('Fetching all list types');

    const listTypes = await prisma.listType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    logger.debug(`Found ${listTypes.length} list types`);
    return listTypes;
  }

  /**
   * Get a single list type by ID
   */
  async getListTypeById(id: string): Promise<ListTypeWithCount | null> {
    logger.debug(`Fetching list type: ${id}`);

    const listType = await prisma.listType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    return listType;
  }

  /**
   * Get a list type by name
   */
  async getListTypeByName(name: string): Promise<ListTypeWithCount | null> {
    logger.debug(`Fetching list type by name: ${name}`);

    const listType = await prisma.listType.findUnique({
      where: { name },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    return listType;
  }

  /**
   * Create a new list type
   */
  async createListType(data: CreateListTypeInput): Promise<ListTypeWithCount> {
    logger.debug(`Creating list type: ${data.name}`);

    const listType = await prisma.listType.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    logger.debug(`Created list type: ${listType.id}`);
    return listType;
  }

  /**
   * Update a list type
   */
  async updateListType(id: string, data: UpdateListTypeInput): Promise<ListTypeWithCount> {
    logger.debug(`Updating list type: ${id}`);

    const listType = await prisma.listType.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim() ?? undefined,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    logger.debug(`Updated list type: ${listType.id}`);
    return listType;
  }

  /**
   * Delete a list type (cascades to values)
   */
  async deleteListType(id: string): Promise<void> {
    logger.debug(`Deleting list type: ${id}`);

    await prisma.listType.delete({
      where: { id },
    });

    logger.debug(`Deleted list type: ${id}`);
  }

  // ============================================================================
  // List Value Operations
  // ============================================================================

  /**
   * Get all values for a list type
   */
  async getValuesByListTypeId(listTypeId: string): Promise<ListValueResponse[]> {
    logger.debug(`Fetching values for list type: ${listTypeId}`);

    const values = await prisma.listValue.findMany({
      where: { listTypeId },
      orderBy: { sortOrder: 'asc' },
    });

    logger.debug(`Found ${values.length} values for list type: ${listTypeId}`);
    return values;
  }

  /**
   * Get active values for a list type by name (for public dropdown API)
   */
  async getActiveValuesByTypeName(typeName: string): Promise<ListValueOption[]> {
    logger.debug(`Fetching active values for type: ${typeName}`);

    const listType = await prisma.listType.findUnique({
      where: { name: typeName, isActive: true },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            value: true,
            label: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!listType) {
      logger.warning(`List type not found or inactive: ${typeName}`);
      return [];
    }

    logger.debug(`Found ${listType.values.length} active values for type: ${typeName}`);
    return listType.values;
  }

  /**
   * Get a single list value by ID
   */
  async getValueById(valueId: string): Promise<ListValueResponse | null> {
    logger.debug(`Fetching list value: ${valueId}`);

    const value = await prisma.listValue.findUnique({
      where: { id: valueId },
    });

    return value;
  }

  /**
   * Create a new list value
   */
  async createValue(listTypeId: string, data: CreateListValueInput): Promise<ListValueResponse> {
    logger.debug(`Creating value for list type: ${listTypeId}`);

    const value = await prisma.listValue.create({
      data: {
        listTypeId,
        value: data.value.trim(),
        label: data.label.trim(),
        description: data.description?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    logger.debug(`Created list value: ${value.id}`);
    return value;
  }

  /**
   * Update a list value
   */
  async updateValue(valueId: string, data: UpdateListValueInput): Promise<ListValueResponse> {
    logger.debug(`Updating list value: ${valueId}`);

    const value = await prisma.listValue.update({
      where: { id: valueId },
      data: {
        value: data.value?.trim(),
        label: data.label?.trim(),
        description: data.description?.trim() ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    logger.debug(`Updated list value: ${value.id}`);
    return value;
  }

  /**
   * Delete a list value
   */
  async deleteValue(valueId: string): Promise<void> {
    logger.debug(`Deleting list value: ${valueId}`);

    await prisma.listValue.delete({
      where: { id: valueId },
    });

    logger.debug(`Deleted list value: ${valueId}`);
  }

  /**
   * Check if a value belongs to a list type
   */
  async valuesBelongsToListType(valueId: string, listTypeId: string): Promise<boolean> {
    const value = await prisma.listValue.findFirst({
      where: {
        id: valueId,
        listTypeId,
      },
    });

    return value !== null;
  }
}

export const listTypeService = new ListTypeService();
