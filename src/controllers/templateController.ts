// Template Controller - Application de templates de tâches
import { Request, Response } from 'express';
import { prisma } from '../server';
import { taskTemplates } from '../templates/taskTemplates';

/**
 * GET /api/templates
 * Liste tous les templates disponibles
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    // Retourner les templates sans les détails des tâches (juste métadonnées)
    const templatesMetadata = taskTemplates.map(({ id, name, description, icon }) => ({
      id,
      name,
      description,
      icon,
    }));

    res.json({ templates: templatesMetadata });
  } catch (error: any) {
    console.error('Erreur getTemplates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/templates/:templateId
 * Obtenir le détail d'un template
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = taskTemplates.find((t) => t.id === templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    res.json({ template });
  } catch (error: any) {
    console.error('Erreur getTemplateById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/projects/:projectId/apply-template
 * Appliquer un template à un projet
 */
export const applyTemplateToProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { templateId } = req.body;
    const userId = req.user!.id;

    // Vérifier que l'utilisateur a les droits (OWNER ou MEMBER)
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership || membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    // Trouver le template
    const template = taskTemplates.find((t) => t.id === templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    // Récupérer ou créer le board du projet
    let board = await prisma.board.findFirst({
      where: { projectId },
    });

    if (!board) {
      board = await prisma.board.create({
        data: {
          projectId,
          name: 'Kanban Board',
          position: 0,
        },
      });
    }

    // Supprimer les colonnes existantes (et donc les tâches associées)
    await prisma.column.deleteMany({
      where: { boardId: board.id },
    });

    // Créer les nouvelles colonnes et tâches depuis le template
    for (let colIndex = 0; colIndex < template.columns.length; colIndex++) {
      const colTemplate = template.columns[colIndex];

      const column = await prisma.column.create({
        data: {
          boardId: board.id,
          name: colTemplate.name,
          color: colTemplate.color,
          position: colIndex,
        },
      });

      // Créer les tâches de cette colonne
      for (let taskIndex = 0; taskIndex < colTemplate.tasks.length; taskIndex++) {
        const taskTemplate = colTemplate.tasks[taskIndex];

        await prisma.task.create({
          data: {
            columnId: column.id,
            title: taskTemplate.title,
            description: taskTemplate.description || '',
            priority: taskTemplate.priority,
            position: taskIndex,
          },
        });
      }
    }

    res.json({ 
      message: 'Template appliqué avec succès',
      columnsCreated: template.columns.length,
      tasksCreated: template.columns.reduce((sum, col) => sum + col.tasks.length, 0),
    });
  } catch (error: any) {
    console.error('Erreur applyTemplateToProject:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
