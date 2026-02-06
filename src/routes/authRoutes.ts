// Routes pour l'authentification

import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/refresh
 * Rafraîchir le token d'accès
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Déconnexion (suppression du refresh token)
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Récupérer le profil de l'utilisateur connecté
 */
router.get('/me', authenticate, authController.getMe);

export default router;
