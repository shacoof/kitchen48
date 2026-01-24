/**
 * Parameter Service
 * Business logic for system parameters management
 */

import { prisma } from '../../core/database/prisma.js';
import type { CreateParameterInput, UpdateParameterInput, Parameter } from './parameter.types.js';

class ParameterService {
  /**
   * Get all parameters
   */
  async getAll(): Promise<Parameter[]> {
    return prisma.parameter.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });
  }

  /**
   * Get parameter by ID
   */
  async getById(id: string): Promise<Parameter | null> {
    return prisma.parameter.findUnique({
      where: { id },
    });
  }

  /**
   * Get parameter by key and owner
   * Note: Uses findFirst instead of findUnique because Prisma doesn't support null in compound unique keys
   */
  async getByKeyAndOwner(
    key: string,
    ownerType: 'SYSTEM' | 'ORGANIZATION' | 'USER',
    ownerId?: string | null
  ): Promise<Parameter | null> {
    return prisma.parameter.findFirst({
      where: {
        key,
        ownerType,
        ownerId: ownerId ?? null,
      },
    });
  }

  /**
   * Get parameter value with hierarchical fallback (USER -> ORGANIZATION -> SYSTEM)
   */
  async getValue(
    key: string,
    userId?: string,
    organizationId?: string
  ): Promise<string | null> {
    // Try USER level first
    if (userId) {
      const userParam = await this.getByKeyAndOwner(key, 'USER', userId);
      if (userParam?.value !== undefined && userParam.value !== null) {
        return userParam.value;
      }
    }

    // Try ORGANIZATION level
    if (organizationId) {
      const orgParam = await this.getByKeyAndOwner(key, 'ORGANIZATION', organizationId);
      if (orgParam?.value !== undefined && orgParam.value !== null) {
        return orgParam.value;
      }
    }

    // Fall back to SYSTEM level
    const systemParam = await this.getByKeyAndOwner(key, 'SYSTEM', null);
    if (systemParam?.value !== undefined && systemParam.value !== null) {
      return systemParam.value;
    }

    // Return default value if exists at system level
    if (systemParam?.defaultValue !== undefined) {
      return systemParam.defaultValue;
    }

    return null;
  }

  /**
   * Create a new parameter
   */
  async create(data: CreateParameterInput, userId?: string): Promise<Parameter> {
    // Check for duplicate
    const existing = await this.getByKeyAndOwner(
      data.key,
      data.ownerType as 'SYSTEM' | 'ORGANIZATION' | 'USER',
      data.ownerId
    );

    if (existing) {
      throw new Error('Parameter with this key already exists for this owner');
    }

    return prisma.parameter.create({
      data: {
        key: data.key,
        value: data.value,
        dataType: data.dataType,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        category: data.category,
        description: data.description,
        isEncrypted: data.isEncrypted,
        defaultValue: data.defaultValue,
        validationRules: data.validationRules,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * Update a parameter
   */
  async update(id: string, data: UpdateParameterInput, userId?: string): Promise<Parameter> {
    // Check if parameter exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Parameter not found');
    }

    // If key or owner is changing, check for duplicates
    if (data.key || data.ownerType || data.ownerId !== undefined) {
      const newKey = data.key ?? existing.key;
      const newOwnerType = (data.ownerType ?? existing.ownerType) as 'SYSTEM' | 'ORGANIZATION' | 'USER';
      const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

      const duplicate = await this.getByKeyAndOwner(newKey, newOwnerType, newOwnerId);
      if (duplicate && duplicate.id !== id) {
        throw new Error('Parameter with this key already exists for this owner');
      }
    }

    return prisma.parameter.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /**
   * Delete a parameter
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Parameter not found');
    }

    await prisma.parameter.delete({
      where: { id },
    });
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    const result = await prisma.parameter.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
      orderBy: { category: 'asc' },
    });

    return result.map(r => r.category).filter((c): c is string => c !== null);
  }
}

export const parameterService = new ParameterService();
export default parameterService;
