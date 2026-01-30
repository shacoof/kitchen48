/**
 * Ingredient Service
 * Business logic for master ingredients management
 */

import { prisma } from '../../core/database/prisma.js';
import { createLogger } from '../../lib/logger.js';
import type { CreateIngredientInput, UpdateIngredientInput, MasterIngredient } from './ingredient.types.js';

const logger = createLogger('IngredientService');

class IngredientService {
  /**
   * Get all master ingredients
   */
  async getAll(): Promise<MasterIngredient[]> {
    logger.debug('Fetching all master ingredients');
    return prisma.masterIngredient.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get ingredient by ID
   */
  async getById(id: string): Promise<MasterIngredient | null> {
    logger.debug(`Fetching ingredient by ID: ${id}`);
    return prisma.masterIngredient.findUnique({
      where: { id },
    });
  }

  /**
   * Get ingredient by name
   */
  async getByName(name: string): Promise<MasterIngredient | null> {
    return prisma.masterIngredient.findUnique({
      where: { name: name.toLowerCase() },
    });
  }

  /**
   * Create a new ingredient
   */
  async create(data: CreateIngredientInput): Promise<MasterIngredient> {
    const normalizedName = data.name.toLowerCase().trim();

    // Check for duplicate
    const existing = await this.getByName(normalizedName);
    if (existing) {
      throw new Error('Ingredient with this name already exists');
    }

    logger.debug(`Creating ingredient: ${normalizedName}`);
    return prisma.masterIngredient.create({
      data: {
        name: normalizedName,
        category: data.category,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update an ingredient
   */
  async update(id: string, data: UpdateIngredientInput): Promise<MasterIngredient> {
    // Check if ingredient exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Ingredient not found');
    }

    // If name is changing, check for duplicates
    if (data.name && data.name.toLowerCase() !== existing.name) {
      const duplicate = await this.getByName(data.name);
      if (duplicate && duplicate.id !== id) {
        throw new Error('Ingredient with this name already exists');
      }
    }

    logger.debug(`Updating ingredient: ${id}`);
    return prisma.masterIngredient.update({
      where: { id },
      data: {
        ...data,
        name: data.name ? data.name.toLowerCase().trim() : undefined,
      },
    });
  }

  /**
   * Delete an ingredient
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Ingredient not found');
    }

    logger.debug(`Deleting ingredient: ${id}`);
    await prisma.masterIngredient.delete({
      where: { id },
    });
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    const result = await prisma.masterIngredient.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
      orderBy: { category: 'asc' },
    });

    return result.map(r => r.category).filter((c): c is string => c !== null);
  }
}

export const ingredientService = new IngredientService();
export default ingredientService;
