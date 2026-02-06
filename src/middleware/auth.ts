// Middleware d'authentification et d'autorisation

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { extractToken, verifyAccessToken } from '../utils/jwt';
import { Permission, DEFAULT_PERMISSIONS } from '../types';

const prisma = new PrismaClient();

/**
 * Middleware pour vérifier l'authentification JWT
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: 'Token manquant' });
      return;
    }

    const payload = verifyAccessToken(token);

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        customRoleId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Utilisateur introuvable ou inactif' });
      return;
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      customRoleId: user.customRoleId,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(401).json({ error: 'Erreur d\'authentification' });
    }
  }
}

/**
 * Récupère les permissions d'un utilisateur
 */
async function getUserPermissions(
  role: UserRole,
  customRoleId?: string | null
): Promise<Permission> {
  if (role !== 'CUSTOM') {
    return DEFAULT_PERMISSIONS[role];
  }

  if (!customRoleId) {
    return DEFAULT_PERMISSIONS.MEMBER; // Fallback
  }

  const customRole = await prisma.customRole.findUnique({
    where: { id: customRoleId },
    select: { permissions: true },
  });

  if (!customRole) {
    return DEFAULT_PERMISSIONS.MEMBER; // Fallback
  }

  return customRole.permissions as Permission;
}

/**
 * Middleware pour vérifier une permission spécifique
 */
export function requirePermission(permissionKey: keyof Permission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Owner a toujours toutes les permissions
      if (req.user.role === 'OWNER') {
        next();
        return;
      }

      const permissions = await getUserPermissions(
        req.user.role,
        req.user.customRoleId
      );

      if (!permissions[permissionKey]) {
        res.status(403).json({ error: 'Permission refusée' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
  };
}

/**
 * Middleware pour restreindre l'accès aux rôles spécifiques
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Rôle insuffisant' });
      return;
    }

    next();
  };
}

/**
 * Middleware pour vérifier que l'utilisateur accède uniquement à ses propres données
 */
export function requireSelfOrPermission(permissionKey: keyof Permission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const targetUserId = req.params.id;

      // L'utilisateur peut toujours accéder à ses propres données
      if (req.user.id === targetUserId) {
        next();
        return;
      }

      // Owner a toujours accès
      if (req.user.role === 'OWNER') {
        next();
        return;
      }

      // Sinon, vérifier la permission
      const permissions = await getUserPermissions(
        req.user.role,
        req.user.customRoleId
      );

      if (!permissions[permissionKey]) {
        res.status(403).json({ error: 'Permission refusée' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
  };
}
