// Controller pour la gestion des projets

import { Request, Response } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Schéma de validation pour créer un projet
const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED']).optional(),
  prodUrl: z.string().url().optional().or(z.literal('')),
  betaUrl: z.string().url().optional().or(z.literal('')),
  repoUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),
});

// Schéma de validation pour mettre à jour un projet
const updateProjectSchema = createProjectSchema.partial();

/**
 * Récupérer tous les projets selon les permissions
 */
export const getAllProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, status } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Construire les filtres
  const where: any = {};

  // Filtre par statut
  if (status) {
    where.status = status as ProjectStatus;
  }

  // Recherche par nom ou description
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { description: { contains: search as string } },
    ];
  }

  // Permissions : OWNER et ADMIN voient tout
  // Les autres ne voient que leurs projets
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    // Vérifier les permissions du rôle personnalisé
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customRole: true },
    });

    const canViewAllProjects = user?.role === 'OWNER' || user?.role === 'ADMIN' ||
      (user?.customRole?.permissions as any)?.canViewAllProjects === true;

    if (!canViewAllProjects) {
      // Ne voir que les projets dont l'utilisateur est membre
      where.members = {
        some: { userId },
      };
    }
  }

  // Récupérer les projets
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            credentials: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({
    projects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Récupérer un projet par ID
 */
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          credentials: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions
  const isMember = project.members.some((m) => m.userId === userId);
  const canViewAllProjects = userRole === 'OWNER' || userRole === 'ADMIN';

  if (!isMember && !canViewAllProjects) {
    throw new AppError('Accès refusé à ce projet', 403);
  }

  res.json({ project });
});

/**
 * Créer un nouveau projet
 */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const data = createProjectSchema.parse(req.body);
  const userId = req.user!.id;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status || 'ACTIVE',
      prodUrl: data.prodUrl || null,
      betaUrl: data.betaUrl || null,
      repoUrl: data.repoUrl || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: userId,
      // Ajouter automatiquement le créateur comme OWNER du projet
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
      metadata: { projectName: project.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(`Projet créé: ${project.name} par ${req.user?.email}`);

  res.status(201).json({
    message: 'Projet créé avec succès',
    project,
  });
});

/**
 * Mettre à jour un projet
 */
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateProjectSchema.parse(req.body);
  const userId = req.user!.id;

  // Vérifier l'existence et les permissions
  const existingProject = await prisma.project.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!existingProject) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions (OWNER du projet ou ADMIN/OWNER global)
  const isProjectOwner = existingProject.members.some(
    (m) => m.userId === userId && m.role === 'OWNER'
  );
  const canEdit = req.user!.role === 'OWNER' || req.user!.role === 'ADMIN' || isProjectOwner;

  if (!canEdit) {
    throw new AppError('Vous n\'avez pas la permission de modifier ce projet', 403);
  }

  // Mettre à jour
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.prodUrl !== undefined && { prodUrl: data.prodUrl || null }),
      ...(data.betaUrl !== undefined && { betaUrl: data.betaUrl || null }),
      ...(data.repoUrl !== undefined && { repoUrl: data.repoUrl || null }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
      metadata: { changes: Object.keys(data) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(`Projet mis à jour: ${project.name} par ${req.user?.email}`);

  res.json({
    message: 'Projet mis à jour avec succès',
    project,
  });
});

/**
 * Supprimer un projet
 */
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Vérifier l'existence et les permissions
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Seuls OWNER global ou OWNER du projet peuvent supprimer
  const isProjectOwner = project.members.some(
    (m) => m.userId === userId && m.role === 'OWNER'
  );
  const canDelete = req.user!.role === 'OWNER' || isProjectOwner;

  if (!canDelete) {
    throw new AppError('Seul le propriétaire du projet peut le supprimer', 403);
  }

  // Supprimer
  await prisma.project.delete({ where: { id } });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'DELETE_PROJECT',
      entity: 'Project',
      entityId: id,
      metadata: { projectName: project.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(`Projet supprimé: ${project.name} par ${req.user?.email}`);

  res.json({ message: 'Projet supprimé avec succès' });
});
