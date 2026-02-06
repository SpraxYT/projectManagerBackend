// Routes pour la gestion des rôles personnalisés

import { Router } from 'express';
import * as roleController from '../controllers/roleController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/roles
 * Récupérer tous les rôles personnalisés
 * Permission: canViewRoles
 */
router.get('/', requirePermission('canViewRoles'), roleController.getAllRoles);

/**
 * POST /api/roles
 * Créer un nouveau rôle personnalisé
 * Permission: canCreateRoles
 */
router.post('/', requirePermission('canCreateRoles'), roleController.createRole);

/**
 * GET /api/roles/:id
 * Récupérer un rôle par ID
 * Permission: canViewRoles
 */
router.get('/:id', requirePermission('canViewRoles'), roleController.getRoleById);

/**
 * PUT /api/roles/:id
 * Mettre à jour un rôle
 * Permission: canEditRoles
 */
router.put('/:id', requirePermission('canEditRoles'), roleController.updateRole);

/**
 * DELETE /api/roles/:id
 * Supprimer un rôle
 * Permission: canDeleteRoles
 */
router.delete('/:id', requirePermission('canDeleteRoles'), roleController.deleteRole);

/**
 * POST /api/roles/:id/duplicate
 * Dupliquer un rôle
 * Permission: canCreateRoles
 */
router.post('/:id/duplicate', requirePermission('canCreateRoles'), roleController.duplicateRole);

export default router;
