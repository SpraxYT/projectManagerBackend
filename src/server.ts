// Point d'entrée du serveur Express

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import settingsRoutes from './routes/settingsRoutes';
import projectRoutes from './routes/projectRoutes';
import kanbanRoutes from './routes/kanbanRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Prisma
export const prisma = new PrismaClient();

// Créer l'application Express
const app = express();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// ============================================================================
// MIDDLEWARES GLOBAUX
// ============================================================================

// Helmet pour la sécurité des headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Non autorisé par CORS'));
      }
    },
    credentials: true,
  })
);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging des requêtes
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    instance: process.env.INSTANCE_NAME || 'Unknown',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', kanbanRoutes); // Phase 3: Kanban & Tasks

// Route de bienvenue
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'ProjectManager API',
    version: '1.0.0-phase1',
    phase: 'Phase 1: Authentication & Roles',
    documentation: '/api/docs',
    health: '/health',
  });
});

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

// 404 - Route introuvable
app.use(notFoundHandler);

// Gestionnaire d'erreurs global
app.use(errorHandler);

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    await prisma.$connect();
    logger.info('✓ Connexion à la base de données établie');

    // Démarrer le serveur
    app.listen(PORT, () => {
      logger.info('╔═══════════════════════════════════════════════════════════╗');
      logger.info(`║   ProjectManager Backend - Phase 3 (Kanban)              ║`);
      logger.info('╚═══════════════════════════════════════════════════════════╝');
      logger.info(`✓ Serveur démarré sur le port ${PORT}`);
      logger.info(`✓ Environnement: ${NODE_ENV}`);
      logger.info(`✓ URL: http://localhost:${PORT}`);
      logger.info(`✓ Health: http://localhost:${PORT}/health`);
      logger.info(`✓ Instance: ${process.env.INSTANCE_NAME || 'Dev'}`);
      logger.info('');
      logger.info('API Endpoints disponibles:');
      logger.info('  Auth:  POST /api/auth/register');
      logger.info('         POST /api/auth/login');
      logger.info('         POST /api/auth/refresh');
      logger.info('         POST /api/auth/logout');
      logger.info('         GET  /api/auth/me');
      logger.info('  Users: GET    /api/users');
      logger.info('         POST   /api/users');
      logger.info('         GET    /api/users/:id');
      logger.info('         PUT    /api/users/:id');
      logger.info('         DELETE /api/users/:id');
      logger.info('  Roles: GET    /api/roles');
      logger.info('         POST   /api/roles');
      logger.info('         GET    /api/roles/:id');
      logger.info('         PUT    /api/roles/:id');
      logger.info('         DELETE /api/roles/:id');
      logger.info('  Settings: GET  /api/settings');
      logger.info('            PUT  /api/settings');
      logger.info('  Projects: GET    /api/projects');
      logger.info('            POST   /api/projects');
      logger.info('            GET    /api/projects/:id');
      logger.info('            PUT    /api/projects/:id');
      logger.info('            DELETE /api/projects/:id');
      logger.info('  Members:  GET    /api/projects/:id/members');
      logger.info('            POST   /api/projects/:id/members');
      logger.info('            PUT    /api/projects/:id/members/:userId');
      logger.info('            DELETE /api/projects/:id/members/:userId');
      logger.info('  Creds:    GET    /api/projects/:id/credentials');
      logger.info('            POST   /api/projects/:id/credentials');
      logger.info('            GET    /api/projects/:id/credentials/:credId/reveal');
      logger.info('            PUT    /api/projects/:id/credentials/:credId');
      logger.info('            DELETE /api/projects/:id/credentials/:credId');
      logger.info('  Kanban:   GET    /api/projects/:id/board');
      logger.info('            POST   /api/projects/:id/board/columns');
      logger.info('            GET    /api/projects/:id/tasks');
      logger.info('  Tasks:    GET    /api/tasks/:id');
      logger.info('            POST   /api/columns/:id/tasks');
      logger.info('            PATCH  /api/tasks/:id');
      logger.info('            PATCH  /api/tasks/:id/move (drag & drop)');
      logger.info('            DELETE /api/tasks/:id');
      logger.info('  Labels:   GET    /api/projects/:id/labels');
      logger.info('            POST   /api/projects/:id/labels');
      logger.info('  Subtasks: GET    /api/tasks/:id/subtasks');
      logger.info('            POST   /api/tasks/:id/subtasks');
      logger.info('  Comments: GET    /api/tasks/:id/comments');
      logger.info('            POST   /api/tasks/:id/comments');
      logger.info('═══════════════════════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT reçu, arrêt gracieux...');
  await prisma.$disconnect();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();

export default app;
