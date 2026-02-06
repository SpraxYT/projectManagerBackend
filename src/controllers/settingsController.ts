// Controller pour la gestion des paramètres de l'instance

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Schéma de validation
const updateSettingsSchema = z.object({
  instanceName: z.string().min(1).max(100).optional(),
  enableRegistration: z.boolean().optional(),
  enableGoogleAuth: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional().nullable(),
});

/**
 * Récupérer les paramètres de l'instance
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  // Récupérer ou créer les paramètres
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    // Créer les paramètres par défaut
    settings = await prisma.settings.create({
      data: {
        instanceName: 'ProjectManager',
        enableRegistration: true,
        enableGoogleAuth: false,
        maintenanceMode: false,
      },
    });
  }

  res.json({ settings });
});

/**
 * Mettre à jour les paramètres de l'instance
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSettingsSchema.parse(req.body);

  // Récupérer les paramètres existants
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    // Créer si n'existe pas
    settings = await prisma.settings.create({
      data: {
        instanceName: data.instanceName || 'ProjectManager',
        enableRegistration: data.enableRegistration ?? true,
        enableGoogleAuth: data.enableGoogleAuth ?? false,
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage,
      },
    });
  } else {
    // Mettre à jour
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTINGS',
        entity: 'Settings',
        entityId: settings.id,
        metadata: { changes: Object.keys(data) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Paramètres mis à jour par ${req.user?.email}`);

  res.json({
    message: 'Paramètres mis à jour',
    settings,
  });
});
