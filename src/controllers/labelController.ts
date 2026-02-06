// Label Controller - Gestion des étiquettes de projet
import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  type: z.enum(['PRIORITY', 'STATUS', 'CUSTOM']).optional(),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  type: z.enum(['PRIORITY', 'STATUS', 'CUSTOM']).optional(),
});

const addLabelToTaskSchema = z.object({
  labelId: z.string().uuid(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function checkProjectAccess(userId: string, projectId: string, requiredRole?: 'OWNER' | 'MEMBER') {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!membership) {
    throw new Error('Accès au projet refusé');
  }

  if (requiredRole && membership.role === 'VIEWER') {
    throw new Error('Permissions insuffisantes');
  }

  return membership;
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * GET /api/projects/:projectId/labels
 * Récupérer toutes les étiquettes d'un projet
 */
export const getLabels = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, projectId);

    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.json({ labels });
  } catch (error: any) {
    console.error('Erreur getLabels:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/projects/:projectId/labels
 * Créer une nouvelle étiquette
 */
export const createLabel = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const data = createLabelSchema.parse(req.body);

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, projectId, 'MEMBER');

    // Créer l'étiquette
    const label = await prisma.label.create({
      data: {
        projectId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type || 'CUSTOM',
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.status(201).json({ label });
  } catch (error: any) {
    console.error('Erreur createLabel:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/labels/:id
 * Mettre à jour une étiquette
 */
export const updateLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = updateLabelSchema.parse(req.body);

    // Vérifier que l'étiquette existe
    const existingLabel = await prisma.label.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!existingLabel) {
      return res.status(404).json({ error: 'Étiquette non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, existingLabel.projectId, 'MEMBER');

    // Mettre à jour l'étiquette
    const label = await prisma.label.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color && { color: data.color }),
        ...(data.type && { type: data.type }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.json({ label });
  } catch (error: any) {
    console.error('Erreur updateLabel:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/labels/:id
 * Supprimer une étiquette
 */
export const deleteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que l'étiquette existe
    const label = await prisma.label.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!label) {
      return res.status(404).json({ error: 'Étiquette non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, label.projectId, 'MEMBER');

    // Supprimer l'étiquette (les relations TaskLabel seront supprimées automatiquement avec onDelete: Cascade)
    await prisma.label.delete({
      where: { id },
    });

    res.json({ message: 'Étiquette supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur deleteLabel:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/tasks/:taskId/labels
 * Ajouter une étiquette à une tâche
 */
export const addLabelToTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const data = addLabelToTaskSchema.parse(req.body);

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, task.column.board.project.id, 'MEMBER');

    // Vérifier que l'étiquette appartient au même projet
    const label = await prisma.label.findUnique({
      where: { id: data.labelId },
    });

    if (!label || label.projectId !== task.column.board.project.id) {
      return res.status(400).json({ error: 'Étiquette invalide' });
    }

    // Ajouter l'étiquette à la tâche
    await prisma.taskLabel.create({
      data: {
        taskId,
        labelId: data.labelId,
      },
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Erreur addLabelToTask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/tasks/:taskId/labels/:labelId
 * Retirer une étiquette d'une tâche
 */
export const removeLabelFromTask = async (req: Request, res: Response) => {
  try {
    const { taskId, labelId } = req.params;
    const userId = req.user!.id;

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, task.column.board.project.id, 'MEMBER');

    // Retirer l'étiquette de la tâche
    await prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Erreur removeLabelFromTask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};
