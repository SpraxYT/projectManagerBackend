// Routes pour la gestion des paramètres de l'instance

import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/settings
 * Récupérer les paramètres de l'instance
 * Accessible par tous les utilisateurs authentifiés
 */
router.get('/', settingsController.getSettings);

/**
 * PUT /api/settings
 * Mettre à jour les paramètres de l'instance
 * Uniquement OWNER et ADMIN
 */
router.put('/', requireRole('OWNER', 'ADMIN'), settingsController.updateSettings);

export default router;
