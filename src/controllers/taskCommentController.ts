// Task Comment Controller - Gestion des commentaires de tâches
import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
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
 * GET /api/tasks/:taskId/comments
 * Récupérer tous les commentaires d'une tâche
 */
export const getComments = async (req: Request, res: Response) => {
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

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
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
    });

    res.json({ comments });
  } catch (error: any) {
    console.error('Erreur getComments:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/tasks/:taskId/comments
 * Créer un nouveau commentaire
 */
export const createComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const data = createCommentSchema.parse(req.body);

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

    // Vérifier l'accès au projet (les VIEWERs peuvent commenter)
    await checkProjectAccess(userId, task.column.board.project.id);

    // Créer le commentaire
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: data.content,
      },
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
    });

    res.status(201).json({ comment });
  } catch (error: any) {
    console.error('Erreur createComment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/comments/:id
 * Mettre à jour un commentaire (seulement l'auteur)
 */
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = updateCommentSchema.parse(req.body);

    // Vérifier que le commentaire existe
    const comment = await prisma.taskComment.findUnique({
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

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres commentaires' });
    }

    // Mettre à jour le commentaire
    const updatedComment = await prisma.taskComment.update({
      where: { id },
      data: {
        content: data.content,
      },
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
    });

    res.json({ comment: updatedComment });
  } catch (error: any) {
    console.error('Erreur updateComment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('modifier') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/comments/:id
 * Supprimer un commentaire (auteur ou OWNER/MEMBER du projet)
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le commentaire existe
    const comment = await prisma.taskComment.findUnique({
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

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Vérifier l'accès au projet
    const membership = await checkProjectAccess(userId, comment.task.column.board.project.id);

    // Vérifier que l'utilisateur est l'auteur OU est OWNER/MEMBER du projet
    if (comment.userId !== userId && membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permissions insuffisantes pour supprimer ce commentaire' });
    }

    // Supprimer le commentaire
    await prisma.taskComment.delete({
      where: { id },
    });

    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur deleteComment:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};
