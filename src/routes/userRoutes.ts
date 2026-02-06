// Routes pour la gestion des utilisateurs

import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, requirePermission, requireSelfOrPermission } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/users
 * Récupérer tous les utilisateurs
 * Permission: canViewUsers
 */
router.get('/', requirePermission('canViewUsers'), userController.getAllUsers);

/**
 * GET /api/users/:id
 * Récupérer un utilisateur par ID
 * Permission: canViewUsers OU accès à ses propres données
 */
router.get('/:id', requireSelfOrPermission('canViewUsers'), userController.getUserById);

/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur
 * Permission: canEditUsers OU accès à ses propres données
 */
router.put('/:id', requireSelfOrPermission('canEditUsers'), userController.updateUser);

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 * Permission: canDeleteUsers
 */
router.delete('/:id', requirePermission('canDeleteUsers'), userController.deleteUser);

/**
 * GET /api/users/:id/activity
 * Récupérer les logs d'activité d'un utilisateur
 * Permission: canViewLogs OU accès à ses propres logs
 */
router.get(
  '/:id/activity',
  requireSelfOrPermission('canViewLogs'),
  userController.getUserActivityLogs
);

export default router;
