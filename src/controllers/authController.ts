// Controller pour l'authentification

import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiration,
} from '../utils/jwt';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Schémas de validation Zod
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis'),
});

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  // Vérifier si c'est le premier utilisateur (sera OWNER)
  const userCount = await prisma.user.count();
  const role: UserRole = userCount === 0 ? 'OWNER' : 'MEMBER';

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      customRoleId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Générer les tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    customRoleId: user.customRoleId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    customRoleId: user.customRoleId,
  });

  // Stocker le refresh token en DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRATION || '7d'),
    },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(`Nouvel utilisateur inscrit: ${user.email} (${role})`);

  res.status(201).json({
    message: 'Inscription réussie',
    user,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes en secondes
    },
  });
});

/**
 * Connexion d'un utilisateur
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      customRole: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(401, 'Email ou mot de passe incorrect');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Compte désactivé');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Email ou mot de passe incorrect');
  }

  // Générer les tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    customRoleId: user.customRoleId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    customRoleId: user.customRoleId,
  });

  // Stocker le refresh token en DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRATION || '7d'),
    },
  });

  // Mettre à jour lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Logger l'activité
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  logger.info(`Connexion: ${user.email}`);

  // Retirer le mot de passe de la réponse
  const { password, ...userWithoutPassword } = user;

  res.json({
    message: 'Connexion réussie',
    user: userWithoutPassword,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes en secondes
    },
  });
});

/**
 * Rafraîchir le token d'accès
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const data = refreshSchema.parse(req.body);

  // Vérifier le refresh token
  const payload = verifyRefreshToken(data.refreshToken);

  // Vérifier que le token existe en DB et n'est pas expiré
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: data.refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'Refresh token invalide');
  }

  if (storedToken.expiresAt < new Date()) {
    // Supprimer le token expiré
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AppError(401, 'Refresh token expiré');
  }

  if (!storedToken.user.isActive) {
    throw new AppError(403, 'Compte désactivé');
  }

  // Générer un nouvel access token
  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
    customRoleId: storedToken.user.customRoleId,
  });

  res.json({
    accessToken,
    expiresIn: 900, // 15 minutes en secondes
  });
});

/**
 * Déconnexion
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const data = refreshSchema.parse(req.body);

  // Supprimer le refresh token de la DB
  await prisma.refreshToken.deleteMany({
    where: { token: data.refreshToken },
  });

  if (req.user) {
    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Déconnexion: ${req.user.email}`);
  }

  res.json({ message: 'Déconnexion réussie' });
});

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Non authentifié');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
