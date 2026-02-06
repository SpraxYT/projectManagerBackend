// Subtask Controller - Gestion des sous-tâches
import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
});

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isCompleted: z.boolean().optional(),
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
 * GET /api/tasks/:taskId/subtasks
 * Récupérer toutes les sous-tâches d'une tâche
 */
export const getSubtasks = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    // Vérifier que la tâche existe et récupérer le projet
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
    await checkProjectAccess(userId, task.column.board.project.id);

    const subtasks = await prisma.subtask.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
    });

    res.json({ subtasks });
  } catch (error: any) {
    console.error('Erreur getSubtasks:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/tasks/:taskId/subtasks
 * Créer une nouvelle sous-tâche
 */
export const createSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const data = createSubtaskSchema.parse(req.body);

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

    // Obtenir la prochaine position
    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
    });

    const position = lastSubtask ? lastSubtask.position + 1 : 0;

    // Créer la sous-tâche
    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: data.title,
        position,
      },
    });

    res.status(201).json({ subtask });
  } catch (error: any) {
    console.error('Erreur createSubtask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/subtasks/:id
 * Mettre à jour une sous-tâche
 */
export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = updateSubtaskSchema.parse(req.body);

    // Vérifier que la sous-tâche existe
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
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
        },
      },
    });

    if (!subtask) {
      return res.status(404).json({ error: 'Sous-tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, subtask.task.column.board.project.id, 'MEMBER');

    // Mettre à jour la sous-tâche
    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });

    res.json({ subtask: updatedSubtask });
  } catch (error: any) {
    console.error('Erreur updateSubtask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/subtasks/:id/toggle
 * Cocher/Décocher une sous-tâche
 */
export const toggleSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que la sous-tâche existe
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
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
        },
      },
    });

    if (!subtask) {
      return res.status(404).json({ error: 'Sous-tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, subtask.task.column.board.project.id, 'MEMBER');

    // Toggle le statut
    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: {
        isCompleted: !subtask.isCompleted,
      },
    });

    res.json({ subtask: updatedSubtask });
  } catch (error: any) {
    console.error('Erreur toggleSubtask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/subtasks/:id
 * Supprimer une sous-tâche
 */
export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que la sous-tâche existe
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
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
        },
      },
    });

    if (!subtask) {
      return res.status(404).json({ error: 'Sous-tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, subtask.task.column.board.project.id, 'MEMBER');

    // Supprimer la sous-tâche
    await prisma.subtask.delete({
      where: { id },
    });

    // Réorganiser les positions
    await prisma.subtask.updateMany({
      where: {
        taskId: subtask.taskId,
        position: { gt: subtask.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    res.json({ message: 'Sous-tâche supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur deleteSubtask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};
