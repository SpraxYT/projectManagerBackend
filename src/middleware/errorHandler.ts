// Middleware de gestion des erreurs

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware de gestion des erreurs
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Logger l'erreur
  logger.error('Erreur capturée:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Erreur Zod (validation)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Données invalides',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Erreur Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Violation de contrainte unique
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Cette valeur existe déjà',
        field: (err.meta?.target as string[])?.[0],
      });
      return;
    }

    // Enregistrement introuvable
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Ressource introuvable',
      });
      return;
    }

    // Contrainte de clé étrangère
    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'Référence invalide',
      });
      return;
    }
  }

  // Erreur applicative personnalisée
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Erreur par défaut
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur'
      : err.message,
  });
}

/**
 * Middleware pour gérer les routes inexistantes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    error: 'Route introuvable',
    path: req.path,
  });
}

/**
 * Wrapper async pour éviter les try/catch dans les controllers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
