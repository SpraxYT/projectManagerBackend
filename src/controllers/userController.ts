// Controller pour la gestion des utilisateurs

import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Créer un nouvel utilisateur
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      customRoleId: data.role === 'CUSTOM' ? data.customRoleId : null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      customRoleId: true,
      customRole: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Nouvel utilisateur créé: ${user.email} par ${req.user?.email}`);

  res.status(201).json({
    message: 'Utilisateur créé',
    user,
  });
});

// Schémas de validation
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'CUSTOM']).default('MEMBER'),
  customRoleId: z.string().uuid().optional().nullable(),
});

const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'CUSTOM']).optional(),
  customRoleId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .optional(),
});

/**
 * Récupérer tous les utilisateurs
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, role } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Construire les filtres
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search as string } },
      { firstName: { contains: search as string } },
      { lastName: { contains: search as string } },
    ];
  }

  if (role) {
    where.role = role as UserRole;
  }

  // Récupérer les utilisateurs
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        customRoleId: true,
        customRole: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Récupérer un utilisateur par ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      customRoleId: true,
      customRole: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          permissions: true,
        },
      },
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable');
  }

  res.json({ user });
});

/**
 * Mettre à jour un utilisateur
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateUserSchema.parse(req.body);

  // Vérifier que l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError(404, 'Utilisateur introuvable');
  }

  // Ne pas permettre de changer le rôle OWNER
  if (existingUser.role === 'OWNER' && data.role && data.role !== 'OWNER') {
    throw new AppError(403, 'Impossible de modifier le rôle OWNER');
  }

  // Ne pas permettre de désactiver le seul OWNER
  if (existingUser.role === 'OWNER' && data.isActive === false) {
    const ownerCount = await prisma.user.count({
      where: { role: 'OWNER', isActive: true },
    });
    if (ownerCount <= 1) {
      throw new AppError(403, 'Impossible de désactiver le seul OWNER');
    }
  }

  // Préparer les données de mise à jour
  const updateData: any = {};

  if (data.email) updateData.email = data.email;
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.role) updateData.role = data.role;
  if (data.customRoleId !== undefined) updateData.customRoleId = data.customRoleId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Si changement de mot de passe
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  // Mettre à jour l'utilisateur
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      customRoleId: true,
      customRole: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        metadata: { changes: Object.keys(updateData) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Utilisateur mis à jour: ${user.email}`);

  res.json({
    message: 'Utilisateur mis à jour',
    user,
  });
});

/**
 * Supprimer un utilisateur
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable');
  }

  // Ne pas permettre de supprimer un OWNER
  if (user.role === 'OWNER') {
    throw new AppError(403, 'Impossible de supprimer un OWNER');
  }

  // Ne pas permettre de se supprimer soi-même
  if (req.user && req.user.id === id) {
    throw new AppError(403, 'Impossible de se supprimer soi-même');
  }

  // Supprimer l'utilisateur (cascade sur RefreshToken et ActivityLog)
  await prisma.user.delete({
    where: { id },
  });

  // Logger l'activité
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: id,
        metadata: { deletedEmail: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  logger.info(`Utilisateur supprimé: ${user.email}`);

  res.json({ message: 'Utilisateur supprimé' });
});

/**
 * Récupérer les logs d'activité d'un utilisateur
 */
export const getUserActivityLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.activityLog.count({ where: { userId: id } }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
);
