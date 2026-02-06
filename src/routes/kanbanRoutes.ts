// Kanban Routes - Phase 3
// Routes pour boards, colonnes, tâches, étiquettes, sous-tâches et commentaires

import express from 'express';
import { authenticate } from '../middleware/auth';

// Controllers
import {
  getBoard,
  createColumn,
  updateColumn,
  reorderColumns,
  deleteColumn,
} from '../controllers/boardController';

import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  assignTask,
  unassignTask,
} from '../controllers/taskController';

import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
} from '../controllers/labelController';

import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  toggleSubtask,
  deleteSubtask,
} from '../controllers/subtaskController';

import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/taskCommentController';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ============================================================================
// BOARDS & COLUMNS
// ============================================================================

// Board
router.get('/projects/:projectId/board', getBoard);

// Columns
router.post('/projects/:projectId/board/columns', createColumn);
router.patch('/columns/:id', updateColumn);
router.patch('/columns/reorder', reorderColumns);
router.delete('/columns/:id', deleteColumn);

// ============================================================================
// TASKS
// ============================================================================

// Tasks CRUD
router.get('/projects/:projectId/tasks', getAllTasks);
router.get('/tasks/:id', getTaskById);
router.post('/columns/:columnId/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.patch('/tasks/:id/move', moveTask);
router.delete('/tasks/:id', deleteTask);

// Task Assignments
router.post('/tasks/:id/assign', assignTask);
router.delete('/tasks/:id/assign/:userId', unassignTask);

// ============================================================================
// LABELS
// ============================================================================

// Project Labels
router.get('/projects/:projectId/labels', getLabels);
router.post('/projects/:projectId/labels', createLabel);
router.patch('/labels/:id', updateLabel);
router.delete('/labels/:id', deleteLabel);

// Task Labels
router.post('/tasks/:taskId/labels', addLabelToTask);
router.delete('/tasks/:taskId/labels/:labelId', removeLabelFromTask);

// ============================================================================
// SUBTASKS
// ============================================================================

router.get('/tasks/:taskId/subtasks', getSubtasks);
router.post('/tasks/:taskId/subtasks', createSubtask);
router.patch('/subtasks/:id', updateSubtask);
router.patch('/subtasks/:id/toggle', toggleSubtask);
router.delete('/subtasks/:id', deleteSubtask);

// ============================================================================
// COMMENTS
// ============================================================================

router.get('/tasks/:taskId/comments', getComments);
router.post('/tasks/:taskId/comments', createComment);
router.patch('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);

export default router;
