// Routes pour la gestion des projets

import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import * as memberController from '../controllers/projectMemberController';
import * as credentialController from '../controllers/projectCredentialController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ============================================================================
// ROUTES PROJETS
// ============================================================================

/**
 * GET /api/projects
 * Récupérer tous les projets (selon permissions)
 */
router.get('/', projectController.getAllProjects);

/**
 * POST /api/projects
 * Créer un nouveau projet
 */
router.post('/', projectController.createProject);

/**
 * GET /api/projects/:id
 * Récupérer un projet par ID
 */
router.get('/:id', projectController.getProjectById);

/**
 * PUT /api/projects/:id
 * Mettre à jour un projet
 */
router.put('/:id', projectController.updateProject);

/**
 * DELETE /api/projects/:id
 * Supprimer un projet
 */
router.delete('/:id', projectController.deleteProject);

// ============================================================================
// ROUTES MEMBRES
// ============================================================================

/**
 * GET /api/projects/:projectId/members
 * Récupérer tous les membres d'un projet
 */
router.get('/:projectId/members', memberController.getProjectMembers);

/**
 * POST /api/projects/:projectId/members
 * Ajouter un membre à un projet
 */
router.post('/:projectId/members', memberController.addProjectMember);

/**
 * PUT /api/projects/:projectId/members/:userId
 * Modifier le rôle d'un membre
 */
router.put('/:projectId/members/:userId', memberController.updateMemberRole);

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Retirer un membre d'un projet
 */
router.delete('/:projectId/members/:userId', memberController.removeMember);

// ============================================================================
// ROUTES CREDENTIALS
// ============================================================================

/**
 * GET /api/projects/:projectId/credentials
 * Récupérer tous les credentials d'un projet
 */
router.get('/:projectId/credentials', credentialController.getProjectCredentials);

/**
 * POST /api/projects/:projectId/credentials
 * Créer un nouveau credential
 */
router.post('/:projectId/credentials', credentialController.createCredential);

/**
 * GET /api/projects/:projectId/credentials/:credentialId/reveal
 * Révéler le mot de passe d'un credential
 */
router.get(
  '/:projectId/credentials/:credentialId/reveal',
  credentialController.revealCredentialPassword
);

/**
 * PUT /api/projects/:projectId/credentials/:credentialId
 * Mettre à jour un credential
 */
router.put('/:projectId/credentials/:credentialId', credentialController.updateCredential);

/**
 * DELETE /api/projects/:projectId/credentials/:credentialId
 * Supprimer un credential
 */
router.delete('/:projectId/credentials/:credentialId', credentialController.deleteCredential);

export default router;
