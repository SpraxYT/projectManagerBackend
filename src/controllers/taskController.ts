// Task Controller - Gestion des tâches Kanban
import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const createTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  assignees: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const moveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
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

async function getNextPosition(columnId: string): Promise<number> {
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
  });

  return lastTask ? lastTask.position + 1 : 0;
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * GET /api/projects/:projectId/tasks
 * Récupérer toutes les tâches d'un projet (groupées par colonnes)
 */
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, projectId);

    // Récupérer le board et ses colonnes avec toutes les tâches
    const board = await prisma.board.findFirst({
      where: { projectId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignments: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
                labels: {
                  include: {
                    label: true,
                  },
                },
                subtasks: {
                  orderBy: { position: 'asc' },
                },
                _count: {
                  select: {
                    comments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board non trouvé' });
    }

    res.json({ board });
  } catch (error: any) {
    console.error('Erreur getAllTasks:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * GET /api/tasks/:id
 * Récupérer les détails complets d'une tâche
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id },
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
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: {
          orderBy: { position: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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

    res.json({ task });
  } catch (error: any) {
    console.error('Erreur getTaskById:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/columns/:columnId/tasks
 * Créer une nouvelle tâche
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const { columnId } = req.params;
    const userId = req.user!.id;

    const data = createTaskSchema.parse({ ...req.body, columnId });

    // Vérifier que la colonne existe et récupérer le projectId
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!column) {
      return res.status(404).json({ error: 'Colonne non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, column.board.project.id, 'MEMBER');

    // Obtenir la prochaine position
    const position = await getNextPosition(columnId);

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        columnId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position,
        assignments: data.assignees
          ? {
              create: data.assignees.map((userId) => ({ userId })),
            }
          : undefined,
        labels: data.labelIds
          ? {
              create: data.labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.status(201).json({ task });
  } catch (error: any) {
    console.error('Erreur createTask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/tasks/:id
 * Mettre à jour une tâche
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = updateTaskSchema.parse(req.body);

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
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

    if (!existingTask) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, existingTask.column.board.project.id, 'MEMBER');

    // Mettre à jour la tâche
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.json({ task });
  } catch (error: any) {
    console.error('Erreur updateTask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/tasks/:id/move
 * Déplacer une tâche (drag & drop)
 */
export const moveTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = moveTaskSchema.parse(req.body);

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id },
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

    // Vérifier que la colonne de destination existe et est dans le même board
    const targetColumn = await prisma.column.findUnique({
      where: { id: data.columnId },
      include: { board: true },
    });

    if (!targetColumn || targetColumn.boardId !== task.column.boardId) {
      return res.status(400).json({ error: 'Colonne de destination invalide' });
    }

    const isSameColumn = task.columnId === data.columnId;

    // Réorganiser les positions
    if (isSameColumn) {
      // Déplacement dans la même colonne
      const tasks = await prisma.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { position: 'asc' },
      });

      // Supprimer la tâche de sa position actuelle
      const tasksCopy = tasks.filter((t) => t.id !== task.id);
      // Insérer à la nouvelle position
      tasksCopy.splice(data.position, 0, task);

      // Mettre à jour les positions
      await Promise.all(
        tasksCopy.map((t, index) =>
          prisma.task.update({
            where: { id: t.id },
            data: { position: index },
          })
        )
      );
    } else {
      // Déplacement vers une autre colonne
      // 1. Réorganiser l'ancienne colonne
      await prisma.task.updateMany({
        where: {
          columnId: task.columnId,
          position: { gt: task.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // 2. Faire de la place dans la nouvelle colonne
      await prisma.task.updateMany({
        where: {
          columnId: data.columnId,
          position: { gte: data.position },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // 3. Déplacer la tâche
      await prisma.task.update({
        where: { id },
        data: {
          columnId: data.columnId,
          position: data.position,
        },
      });
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Erreur moveTask:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/tasks/:id
 * Supprimer une tâche
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id },
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

    // Supprimer la tâche
    await prisma.task.delete({
      where: { id },
    });

    // Réorganiser les positions des tâches restantes
    await prisma.task.updateMany({
      where: {
        columnId: task.columnId,
        position: { gt: task.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur deleteTask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/tasks/:id/assign
 * Assigner un utilisateur à une tâche
 */
export const assignTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: assigneeId } = req.body;
    const userId = req.user!.id;

    if (!assigneeId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id },
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

    // Vérifier que l'assignee est membre du projet
    await checkProjectAccess(assigneeId, task.column.board.project.id);

    // Créer l'assignation
    await prisma.taskAssignment.create({
      data: {
        taskId: id,
        userId: assigneeId,
      },
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Erreur assignTask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/tasks/:id/assign/:userId
 * Retirer un utilisateur assigné d'une tâche
 */
export const unassignTask = async (req: Request, res: Response) => {
  try {
    const { id, userId: assigneeId } = req.params;
    const userId = req.user!.id;

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id },
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

    // Supprimer l'assignation
    await prisma.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId: id,
          userId: assigneeId,
        },
      },
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Erreur unassignTask:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};
