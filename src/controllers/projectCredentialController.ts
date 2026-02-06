// Controller pour la gestion des credentials de projet

import { Request, Response } from 'express';
import { PrismaClient, CredentialType } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { encryptPassword, decryptPassword } from '../utils/encryption';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Schémas de validation
const createCredentialSchema = z.object({
  type: z.enum(['FTP', 'DATABASE', 'ADMIN', 'API', 'SSH', 'OTHER']),
  name: z.string().min(1, 'Le nom est requis').max(100),
  username: z.string().optional(),
  password: z.string().min(1, 'Le mot de passe est requis'),
  url: z.string().optional(),
  notes: z.string().optional(),
});

const updateCredentialSchema = z.object({
  type: z.enum(['FTP', 'DATABASE', 'ADMIN', 'API', 'SSH', 'OTHER']).optional(),
  name: z.string().min(1).max(100).optional(),
  username: z.string().optional(),
  password: z.string().optional(), // Si fourni, sera rechiffré
  url: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Vérifier si l'utilisateur a accès au projet
 */
async function checkProjectAccess(projectId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'OWNER' || userRole === 'ADMIN') {
    return true;
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  return !!member;
}

/**
 * Récupérer tous les credentials d'un projet (sans les passwords)
 */
export const getProjectCredentials = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier l'accès au projet
  const hasAccess = await checkProjectAccess(projectId, userId, userRole);

  if (!hasAccess) {
    throw new AppError('Accès refusé à ce projet', 403);
  }

  // Récupérer les credentials (SANS les passwords chiffrés)
  const credentials = await prisma.projectCredential.findMany({
    where: { projectId },
    select: {
      id: true,
      type: true,
      name: true,
      username: true,
      url: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      // Exclure les champs de chiffrement
      passwordEncrypted: false,
      encryptionSalt: false,
      encryptionIv: false,
      encryptionTag: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ credentials });
});

/**
 * Révéler le mot de passe d'un credential (temporairement)
 */
export const revealCredentialPassword = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, credentialId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Vérifier l'accès au projet
  const hasAccess = await checkProjectAccess(projectId, userId, userRole);

  if (!hasAccess) {
    throw new AppError('Accès refusé à ce projet', 403);
  }

  // Vérifier que l'utilisateur a le droit de révéler les mots de passe
  // Les VIEWER ne peuvent PAS révéler les mots de passe
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member || member.role === 'VIEWER') {
      throw new AppError('Seuls les propriétaires et membres peuvent révéler les mots de passe', 403);
    }
  }

  // Récupérer le credential
  const credential = await prisma.projectCredential.findFirst({
    where: {
      id: credentialId,
      projectId,
    },
  });

  if (!credential) {
    throw new AppError('Credential introuvable', 404);
  }

  // Déchiffrer le mot de passe
  try {
    const password = decryptPassword(
      credential.passwordEncrypted,
      credential.encryptionSalt,
      credential.encryptionIv,
      credential.encryptionTag
    );

    // Logger l'activité (accès sensible)
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'REVEAL_CREDENTIAL',
        entity: 'ProjectCredential',
        entityId: credentialId,
        metadata: {
          credentialName: credential.name,
          projectId,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Credential révélé: ${credential.name} dans projet ${projectId} par ${req.user?.email}`
    );

    res.json({
      password,
      // Optionnel : envoyer aussi les autres infos
      credential: {
        id: credential.id,
        type: credential.type,
        name: credential.name,
        username: credential.username,
        url: credential.url,
      },
    });
  } catch (error) {
    logger.error('Échec du déchiffrement:', error);
    throw new AppError('Impossible de déchiffrer le mot de passe', 500);
  }
});

/**
 * Créer un nouveau credential
 */
export const createCredential = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const data = createCredentialSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  // Vérifier les permissions (OWNER du projet, MEMBER, ou ADMIN global)
  const member = project.members.find((m) => m.userId === userId);
  const canCreate =
    userRole === 'OWNER' ||
    userRole === 'ADMIN' ||
    (member && (member.role === 'OWNER' || member.role === 'MEMBER'));

  if (!canCreate) {
    throw new AppError('Vous n\'avez pas la permission de créer des credentials', 403);
  }

  // Chiffrer le mot de passe
  const encrypted = encryptPassword(data.password);

  // Créer le credential
  const credential = await prisma.projectCredential.create({
    data: {
      projectId,
      type: data.type,
      name: data.name,
      username: data.username,
      passwordEncrypted: encrypted.encrypted,
      encryptionSalt: encrypted.salt,
      encryptionIv: encrypted.iv,
      encryptionTag: encrypted.tag,
      url: data.url,
      notes: data.notes,
    },
    select: {
      id: true,
      type: true,
      name: true,
      username: true,
      url: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'CREATE_CREDENTIAL',
      entity: 'ProjectCredential',
      entityId: credential.id,
      metadata: {
        credentialName: credential.name,
        projectName: project.name,
        type: credential.type,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Credential créé: ${credential.name} dans ${project.name} par ${req.user?.email}`
  );

  res.status(201).json({
    message: 'Credential créé avec succès',
    credential,
  });
});

/**
 * Mettre à jour un credential
 */
export const updateCredential = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, credentialId } = req.params;
  const data = updateCredentialSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Vérifier que le credential existe
  const existingCredential = await prisma.projectCredential.findFirst({
    where: {
      id: credentialId,
      projectId,
    },
  });

  if (!existingCredential) {
    throw new AppError('Credential introuvable', 404);
  }

  // Vérifier les permissions
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  const member = project.members.find((m) => m.userId === userId);
  const canUpdate =
    userRole === 'OWNER' ||
    userRole === 'ADMIN' ||
    (member && (member.role === 'OWNER' || member.role === 'MEMBER'));

  if (!canUpdate) {
    throw new AppError('Vous n\'avez pas la permission de modifier ce credential', 403);
  }

  // Préparer les données de mise à jour
  const updateData: any = {
    ...(data.type && { type: data.type }),
    ...(data.name && { name: data.name }),
    ...(data.username !== undefined && { username: data.username }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };

  // Si un nouveau mot de passe est fourni, le rechiffrer
  if (data.password) {
    const encrypted = encryptPassword(data.password);
    updateData.passwordEncrypted = encrypted.encrypted;
    updateData.encryptionSalt = encrypted.salt;
    updateData.encryptionIv = encrypted.iv;
    updateData.encryptionTag = encrypted.tag;
  }

  // Mettre à jour
  const credential = await prisma.projectCredential.update({
    where: { id: credentialId },
    data: updateData,
    select: {
      id: true,
      type: true,
      name: true,
      username: true,
      url: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'UPDATE_CREDENTIAL',
      entity: 'ProjectCredential',
      entityId: credentialId,
      metadata: {
        credentialName: credential.name,
        projectName: project.name,
        changes: Object.keys(data),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Credential mis à jour: ${credential.name} dans ${project.name} par ${req.user?.email}`
  );

  res.json({
    message: 'Credential mis à jour avec succès',
    credential,
  });
});

/**
 * Supprimer un credential
 */
export const deleteCredential = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, credentialId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Vérifier que le credential existe
  const credential = await prisma.projectCredential.findFirst({
    where: {
      id: credentialId,
      projectId,
    },
  });

  if (!credential) {
    throw new AppError('Credential introuvable', 404);
  }

  // Vérifier les permissions
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError('Projet introuvable', 404);
  }

  const member = project.members.find((m) => m.userId === userId);
  const canDelete =
    userRole === 'OWNER' ||
    userRole === 'ADMIN' ||
    (member && member.role === 'OWNER');

  if (!canDelete) {
    throw new AppError('Seuls les propriétaires peuvent supprimer des credentials', 403);
  }

  // Supprimer
  await prisma.projectCredential.delete({
    where: { id: credentialId },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'DELETE_CREDENTIAL',
      entity: 'ProjectCredential',
      entityId: credentialId,
      metadata: {
        credentialName: credential.name,
        projectName: project.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(
    `Credential supprimé: ${credential.name} dans ${project.name} par ${req.user?.email}`
  );

  res.json({ message: 'Credential supprimé avec succès' });
});
