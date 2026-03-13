/**
 * Voice Commands Service
 * Business logic for voice command management
 */

import { prisma } from '../../core/database/prisma.js';
import type {
  VoiceCommand,
  CreateVoiceCommandInput,
  UpdateVoiceCommandInput,
  UpsertTranslationInput,
} from './voice-commands.types.js';

class VoiceCommandsService {
  /**
   * Get all voice commands with translations (admin)
   */
  async getAll(): Promise<VoiceCommand[]> {
    return prisma.voiceCommand.findMany({
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get active voice commands with translations for a specific language (public)
   */
  async getActiveWithTranslations(lang: string): Promise<VoiceCommand[]> {
    return prisma.voiceCommand.findMany({
      where: { isActive: true },
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single voice command by ID
   */
  async getById(id: string): Promise<VoiceCommand | null> {
    return prisma.voiceCommand.findUnique({
      where: { id },
      include: { translations: true },
    });
  }

  /**
   * Create a new voice command
   */
  async create(input: CreateVoiceCommandInput): Promise<VoiceCommand> {
    const existing = await prisma.voiceCommand.findUnique({
      where: { command: input.command },
    });
    if (existing) {
      throw new Error('Voice command with this key already exists');
    }

    return prisma.voiceCommand.create({
      data: {
        command: input.command,
        keywords: input.keywords,
        icon: input.icon,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: { translations: true },
    });
  }

  /**
   * Update a voice command
   */
  async update(id: string, input: UpdateVoiceCommandInput): Promise<VoiceCommand> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Not found');
    }

    // If changing the command key, check uniqueness
    if (input.command && input.command !== existing.command) {
      const duplicate = await prisma.voiceCommand.findUnique({
        where: { command: input.command },
      });
      if (duplicate) {
        throw new Error('Voice command with this key already exists');
      }
    }

    return prisma.voiceCommand.update({
      where: { id },
      data: {
        ...(input.command !== undefined && { command: input.command }),
        ...(input.keywords !== undefined && { keywords: input.keywords }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: { translations: true },
    });
  }

  /**
   * Delete a voice command
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Not found');
    }
    await prisma.voiceCommand.delete({ where: { id } });
  }

  /**
   * Upsert a translation for a voice command
   */
  async upsertTranslation(
    voiceCommandId: string,
    input: UpsertTranslationInput
  ): Promise<VoiceCommand> {
    const existing = await this.getById(voiceCommandId);
    if (!existing) {
      throw new Error('Voice command not found');
    }

    await prisma.voiceCommandTranslation.upsert({
      where: {
        voiceCommandId_language: {
          voiceCommandId,
          language: input.language,
        },
      },
      update: {
        displayKeyword: input.displayKeyword,
        description: input.description,
      },
      create: {
        voiceCommandId,
        language: input.language,
        displayKeyword: input.displayKeyword,
        description: input.description,
      },
    });

    return (await this.getById(voiceCommandId))!;
  }
}

export const voiceCommandsService = new VoiceCommandsService();
export default voiceCommandsService;
