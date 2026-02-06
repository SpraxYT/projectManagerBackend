import { Router } from 'express';
import { getTemplates, getTemplateById, applyTemplateToProject } from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/templates - Liste des templates
router.get('/templates', getTemplates);

// GET /api/templates/:templateId - Détail d'un template
router.get('/templates/:templateId', getTemplateById);

// POST /api/projects/:projectId/apply-template - Appliquer un template à un projet
router.post('/projects/:projectId/apply-template', applyTemplateToProject);

export default router;
