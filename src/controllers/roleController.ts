// Controller pour la gestion des rôles personnalisés

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Permission } from '../types';

const prisma = new PrismaClient();

// Schéma de validation pour les permissions
const permissionsSchema = z.object({
  canViewUsers: z.boolean().optional(),
  canCreateUsers: z.boolean().optional(),
  canEditUsers: z.boolean().optional(),
  canDeleteUsers: z.boolean().optional(),
  canViewRoles: z.boolean().optional(),
  canCreateRoles: z.boolean().optional(),
  canEditRoles: z.boolean().optional(),
  canDeleteRoles: z.boolean().optional(),
  canViewLogs: z.boolean().optional(),
  canViewAllProjects: z.boolean().optional(),
  canCreateProjects: z.boolean().optional(),
  canEditProjects: z.boolean().optional(),
  canDeleteProjects: z.boolean().optional(),
  canManageProjectMembers: z.boolean().optional(),
  canViewProjectCredentials: z.boolean().optional(),
  canViewAllTasks: z.boolean().optional(),
  canCreateTasks: z.boolean().optional(),
  canEditAllTasks: z.boolean().optional(),
  canDeleteAllTasks: z.boolean().optional(),
  canAssignTasks: z.boolean().optional(),
});

// Schéma de validation pour créer un rôle
const createRoleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide').optional(),
  permissions: permissionsSchema,
});

// Schéma de validation pour mettre à jour un rôle
const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide').optional(),
  permissions: permissionsSchema.optional(),
});

/**
 * Récupérer tous les rôles personnalisés
 */
export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Construire les filtres
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { description: { contains: search as string } },
    ];
  }

  // Récupérer les rôles
  const [roles, total] = await Promise.all([
    prisma.customRole.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customRole.count({ where }),
  ]);

  res.json({
    roles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Récupérer un rôle par ID
 */
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await prisma.customRole.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new AppError(404, 'Rôle introuvable');
  }

  res.json({ role });
});

/**
 * Créer un nouveau rôle personnalisé
 */
export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const data = createRoleSchema.parse(req.body);

  // Créer le rôle
  const role = await prisma.customRole.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      permissions: data.permissions as any,
    },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_ROLE',
        entity: 'CustomRole',
        entityId: role.id,
        metadata: { name: role.name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Rôle créé: ${role.name}`);

  res.status(201).json({
    message: 'Rôle créé',
    role,
  });
});

/**
 * Mettre à jour un rôle
 */
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateRoleSchema.parse(req.body);

  // Vérifier que le rôle existe
  const existingRole = await prisma.customRole.findUnique({
    where: { id },
  });

  if (!existingRole) {
    throw new AppError(404, 'Rôle introuvable');
  }

  // Préparer les données de mise à jour
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.permissions) updateData.permissions = data.permissions;

  // Mettre à jour le rôle
  const role = await prisma.customRole.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_ROLE',
        entity: 'CustomRole',
        entityId: id,
        metadata: { changes: Object.keys(updateData), name: role.name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Rôle mis à jour: ${role.name}`);

  res.json({
    message: 'Rôle mis à jour',
    role,
  });
});

/**
 * Supprimer un rôle
 */
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que le rôle existe
  const role = await prisma.customRole.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new AppError(404, 'Rôle introuvable');
  }

  // Vérifier qu'aucun utilisateur n'utilise ce rôle
  if (role._count.users > 0) {
    throw new AppError(
      400,
      `Impossible de supprimer ce rôle, ${role._count.users} utilisateur(s) l'utilisent`
    );
  }

  // Supprimer le rôle
  await prisma.customRole.delete({
    where: { id },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_ROLE',
        entity: 'CustomRole',
        entityId: id,
        metadata: { name: role.name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Rôle supprimé: ${role.name}`);

  res.json({ message: 'Rôle supprimé' });
});

/**
 * Dupliquer un rôle (pour créer un nouveau rôle basé sur un existant)
 */
export const duplicateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    throw new AppError(400, 'Le nom du nouveau rôle est requis');
  }

  // Récupérer le rôle source
  const sourceRole = await prisma.customRole.findUnique({
    where: { id },
  });

  if (!sourceRole) {
    throw new AppError(404, 'Rôle source introuvable');
  }

  // Créer le nouveau rôle
  const newRole = await prisma.customRole.create({
    data: {
      name,
      description: sourceRole.description,
      color: sourceRole.color,
      permissions: sourceRole.permissions,
    },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DUPLICATE_ROLE',
        entity: 'CustomRole',
        entityId: newRole.id,
        metadata: { sourceRoleId: id, sourceName: sourceRole.name, newName: name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Rôle dupliqué: ${sourceRole.name} -> ${newRole.name}`);

  res.status(201).json({
    message: 'Rôle dupliqué',
    role: newRole,
  });
});
