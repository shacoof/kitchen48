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
  ListValueOptionTranslated,
  UpsertTranslationsInput,
  TranslationResponse,
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
   * When lang is provided, includes translations map for each value
   */
  async getActiveValuesByTypeName(typeName: string, lang?: string): Promise<ListValueOption[] | ListValueOptionTranslated[]> {
    logger.debug(`Fetching active values for type: ${typeName}${lang ? ` (lang: ${lang})` : ''}`);

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
            translations: {
              select: {
                language: true,
                label: true,
              },
            },
          },
        },
      },
    });

    if (!listType) {
      logger.warning(`List type not found or inactive: ${typeName}`);
      return [];
    }

    logger.debug(`Found ${listType.values.length} active values for type: ${typeName}`);

    // If lang requested, resolve translated labels and include translations map
    if (lang) {
      return listType.values.map(v => {
        const translationsMap: Record<string, string> = {};
        for (const t of v.translations) {
          translationsMap[t.language] = t.label;
        }
        return {
          value: v.value,
          label: translationsMap[lang] || v.label,
          sortOrder: v.sortOrder,
          translations: translationsMap,
        };
      });
    }

    return listType.values.map(v => ({
      value: v.value,
      label: v.label,
      sortOrder: v.sortOrder,
    }));
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

  // ============================================================================
  // Translation Operations
  // ============================================================================

  /**
   * Get all translations for a list value
   */
  async getTranslationsByValueId(valueId: string): Promise<TranslationResponse[]> {
    logger.debug(`Fetching translations for value: ${valueId}`);

    const translations = await prisma.listValueTranslation.findMany({
      where: { listValueId: valueId },
      orderBy: { language: 'asc' },
    });

    return translations;
  }

  /**
   * Upsert translations for a list value (bulk create/update)
   */
  async upsertTranslations(valueId: string, translations: UpsertTranslationsInput): Promise<TranslationResponse[]> {
    logger.debug(`Upserting ${translations.length} translations for value: ${valueId}`);

    const results: TranslationResponse[] = [];
    for (const t of translations) {
      const result = await prisma.listValueTranslation.upsert({
        where: {
          listValueId_language: {
            listValueId: valueId,
            language: t.language,
          },
        },
        update: {
          label: t.label,
          description: t.description ?? undefined,
        },
        create: {
          listValueId: valueId,
          language: t.language,
          label: t.label,
          description: t.description ?? null,
        },
      });
      results.push(result);
    }

    logger.debug(`Upserted ${results.length} translations for value: ${valueId}`);
    return results;
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(valueId: string, language: string): Promise<void> {
    logger.debug(`Deleting translation (${language}) for value: ${valueId}`);

    await prisma.listValueTranslation.delete({
      where: {
        listValueId_language: {
          listValueId: valueId,
          language,
        },
      },
    });

    logger.debug(`Deleted translation (${language}) for value: ${valueId}`);
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
