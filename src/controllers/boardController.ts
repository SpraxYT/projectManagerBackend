// Board & Column Controller - Gestion des boards Kanban
import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const updateColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()),
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

async function getOrCreateBoard(projectId: string) {
  let board = await prisma.board.findFirst({
    where: { projectId },
  });

  if (!board) {
    // Créer le board avec les colonnes par défaut
    board = await prisma.board.create({
      data: {
        projectId,
        name: 'Kanban Board',
        position: 0,
        columns: {
          create: [
            { name: 'À faire', position: 0, color: '#6B7280' },
            { name: 'En cours', position: 1, color: '#3B82F6' },
            { name: 'En révision', position: 2, color: '#F59E0B' },
            { name: 'Terminé', position: 3, color: '#10B981' },
          ],
        },
      },
    });
  }

  return board;
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * GET /api/projects/:projectId/board
 * Récupérer le board d'un projet (avec colonnes)
 */
export const getBoard = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, projectId);

    // Obtenir ou créer le board
    const board = await getOrCreateBoard(projectId);

    // Récupérer le board complet avec colonnes
    const fullBoard = await prisma.board.findUnique({
      where: { id: board.id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
      },
    });

    res.json({ board: fullBoard });
  } catch (error: any) {
    console.error('Erreur getBoard:', error);
    res.status(error.message.includes('Accès') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * POST /api/projects/:projectId/board/columns
 * Créer une nouvelle colonne
 */
export const createColumn = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const data = createColumnSchema.parse(req.body);

    // Vérifier l'accès au projet (OWNER ou MEMBER seulement)
    await checkProjectAccess(userId, projectId, 'MEMBER');

    // Obtenir ou créer le board
    const board = await getOrCreateBoard(projectId);

    // Obtenir la prochaine position
    const lastColumn = await prisma.column.findFirst({
      where: { boardId: board.id },
      orderBy: { position: 'desc' },
    });

    const position = lastColumn ? lastColumn.position + 1 : 0;

    // Créer la colonne
    const column = await prisma.column.create({
      data: {
        boardId: board.id,
        name: data.name,
        color: data.color || '#6B7280',
        position,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.status(201).json({ column });
  } catch (error: any) {
    console.error('Erreur createColumn:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/columns/:id
 * Mettre à jour une colonne
 */
export const updateColumn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const data = updateColumnSchema.parse(req.body);

    // Vérifier que la colonne existe
    const column = await prisma.column.findUnique({
      where: { id },
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

    // Mettre à jour la colonne
    const updatedColumn = await prisma.column.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color && { color: data.color }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.json({ column: updatedColumn });
  } catch (error: any) {
    console.error('Erreur updateColumn:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * PATCH /api/columns/reorder
 * Réorganiser les colonnes
 */
export const reorderColumns = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = reorderColumnsSchema.parse(req.body);

    // Vérifier que toutes les colonnes existent et appartiennent au même board
    const columns = await prisma.column.findMany({
      where: { id: { in: data.columnIds } },
      include: {
        board: {
          include: {
            project: true,
          },
        },
      },
    });

    if (columns.length !== data.columnIds.length) {
      return res.status(400).json({ error: 'Certaines colonnes sont invalides' });
    }

    const boardId = columns[0].boardId;
    const projectId = columns[0].board.project.id;

    if (!columns.every((col) => col.boardId === boardId)) {
      return res.status(400).json({ error: 'Toutes les colonnes doivent appartenir au même board' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, projectId, 'MEMBER');

    // Mettre à jour les positions
    await Promise.all(
      data.columnIds.map((columnId, index) =>
        prisma.column.update({
          where: { id: columnId },
          data: { position: index },
        })
      )
    );

    const updatedColumns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.json({ columns: updatedColumns });
  } catch (error: any) {
    console.error('Erreur reorderColumns:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};

/**
 * DELETE /api/columns/:id
 * Supprimer une colonne (déplace les tâches vers la première colonne)
 */
export const deleteColumn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que la colonne existe
    const column = await prisma.column.findUnique({
      where: { id },
      include: {
        board: {
          include: {
            project: true,
            columns: {
              orderBy: { position: 'asc' },
            },
          },
        },
        tasks: true,
      },
    });

    if (!column) {
      return res.status(404).json({ error: 'Colonne non trouvée' });
    }

    // Vérifier l'accès au projet
    await checkProjectAccess(userId, column.board.project.id, 'MEMBER');

    // Empêcher la suppression si c'est la dernière colonne
    if (column.board.columns.length === 1) {
      return res.status(400).json({ error: 'Impossible de supprimer la dernière colonne' });
    }

    // Déplacer toutes les tâches vers la première colonne (si ce n'est pas celle qu'on supprime)
    if (column.tasks.length > 0) {
      const firstColumn = column.board.columns.find((col) => col.id !== id);

      if (firstColumn) {
        // Obtenir la prochaine position dans la colonne de destination
        const lastTaskInFirstColumn = await prisma.task.findFirst({
          where: { columnId: firstColumn.id },
          orderBy: { position: 'desc' },
        });

        const startPosition = lastTaskInFirstColumn ? lastTaskInFirstColumn.position + 1 : 0;

        // Déplacer toutes les tâches
        await Promise.all(
          column.tasks.map((task, index) =>
            prisma.task.update({
              where: { id: task.id },
              data: {
                columnId: firstColumn.id,
                position: startPosition + index,
              },
            })
          )
        );
      }
    }

    // Supprimer la colonne
    await prisma.column.delete({
      where: { id },
    });

    // Réorganiser les positions des colonnes restantes
    const remainingColumns = column.board.columns.filter((col) => col.id !== id);
    await Promise.all(
      remainingColumns.map((col, index) =>
        prisma.column.update({
          where: { id: col.id },
          data: { position: index },
        })
      )
    );

    res.json({ message: 'Colonne supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur deleteColumn:', error);
    res.status(error.message.includes('Accès') || error.message.includes('Permissions') ? 403 : 500).json({
      error: error.message || 'Erreur serveur',
    });
  }
};
