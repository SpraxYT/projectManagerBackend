// Controller pour la gestion des membres de projet

import { Request, Response } from 'express';
import { PrismaClient, ProjectMemberRole } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Schémas de validation
const addMemberSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER']).optional(),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER']),
});

/**
 * Récupérer tous les membres d'un projet
 */
export const getProjectMembers = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions
  const isMember = project.members.some((m) => m.userId === userId);
  const canView = req.user!.role === 'OWNER' || req.user!.role === 'ADMIN' || isMember;

  if (!canView) {
    throw new AppError('Accès refusé à ce projet', 403);
  }

  // Récupérer les membres avec leurs infos
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  res.json({ members });
});

/**
 * Ajouter un membre à un projet
 */
export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const data = addMemberSchema.parse(req.body);
  const currentUserId = req.user!.id;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions (OWNER du projet ou ADMIN global)
  const isProjectOwner = project.members.some(
    (m) => m.userId === currentUserId && m.role === 'OWNER'
  );
  const canManage = req.user!.role === 'OWNER' || req.user!.role === 'ADMIN' || isProjectOwner;

  if (!canManage) {
    throw new AppError('Vous n\'avez pas la permission d\'ajouter des membres', 403);
  }

  // Vérifier que l'utilisateur à ajouter existe
  const userToAdd = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!userToAdd) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  // Vérifier que l'utilisateur n'est pas déjà membre
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: data.userId,
      },
    },
  });

  if (existingMember) {
    throw new AppError('Cet utilisateur est déjà membre du projet', 400);
  }

  // Ajouter le membre
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: data.userId,
      role: data.role || 'MEMBER',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId: currentUserId,
      action: 'ADD_PROJECT_MEMBER',
      entity: 'ProjectMember',
      entityId: projectId,
      metadata: {
        projectName: project.name,
        addedUser: `${userToAdd.firstName} ${userToAdd.lastName}`,
        role: member.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Membre ajouté au projet ${project.name}: ${userToAdd.email} par ${req.user?.email}`
  );

  res.status(201).json({
    message: 'Membre ajouté avec succès',
    member,
  });
});

/**
 * Modifier le rôle d'un membre
 */
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, userId } = req.params;
  const data = updateMemberRoleSchema.parse(req.body);
  const currentUserId = req.user!.id;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions
  const isProjectOwner = project.members.some(
    (m) => m.userId === currentUserId && m.role === 'OWNER'
  );
  const canManage = req.user!.role === 'OWNER' || req.user!.role === 'ADMIN' || isProjectOwner;

  if (!canManage) {
    throw new AppError('Vous n\'avez pas la permission de modifier les rôles', 403);
  }

  // Vérifier que le membre existe
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    include: { user: true },
  });

  if (!member) {
    throw new AppError('Membre introuvable', 404);
  }

  // Empêcher de modifier le dernier OWNER
  if (member.role === 'OWNER' && data.role !== 'OWNER') {
    const ownersCount = project.members.filter((m) => m.role === 'OWNER').length;
    if (ownersCount <= 1) {
      throw new AppError('Un projet doit avoir au moins un propriétaire', 400);
    }
  }

  // Mettre à jour le rôle
  const updatedMember = await prisma.projectMember.update({
    where: {
      projectId_userId: { projectId, userId },
    },
    data: { role: data.role },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId: currentUserId,
      action: 'UPDATE_PROJECT_MEMBER_ROLE',
      entity: 'ProjectMember',
      entityId: projectId,
      metadata: {
        projectName: project.name,
        targetUser: `${member.user.firstName} ${member.user.lastName}`,
        oldRole: member.role,
        newRole: data.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Rôle modifié pour ${member.user.email} dans ${project.name} par ${req.user?.email}`
  );

  res.json({
    message: 'Rôle mis à jour avec succès',
    member: updatedMember,
  });
});

/**
 * Retirer un membre d'un projet
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, userId } = req.params;
  const currentUserId = req.user!.id;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions
  const isProjectOwner = project.members.some(
    (m) => m.userId === currentUserId && m.role === 'OWNER'
  );
  const canManage =
    req.user!.role === 'OWNER' ||
    req.user!.role === 'ADMIN' ||
    isProjectOwner ||
    currentUserId === userId; // Un utilisateur peut se retirer lui-même

  if (!canManage) {
    throw new AppError('Vous n\'avez pas la permission de retirer des membres', 403);
  }

  // Vérifier que le membre existe
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    include: { user: true },
  });

  if (!member) {
    throw new AppError('Membre introuvable', 404);
  }

  // Empêcher de retirer le dernier OWNER
  if (member.role === 'OWNER') {
    const ownersCount = project.members.filter((m) => m.role === 'OWNER').length;
    if (ownersCount <= 1) {
      throw new AppError('Impossible de retirer le dernier propriétaire du projet', 400);
    }
  }

  // Retirer le membre
  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId: currentUserId,
      action: 'REMOVE_PROJECT_MEMBER',
      entity: 'ProjectMember',
      entityId: projectId,
      metadata: {
        projectName: project.name,
        removedUser: `${member.user.firstName} ${member.user.lastName}`,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Membre retiré du projet ${project.name}: ${member.user.email} par ${req.user?.email}`
  );

  res.json({ message: 'Membre retiré avec succès' });
});
