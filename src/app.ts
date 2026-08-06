import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  requestId,
} from '@/shared/middlewares/security.middleware';
import { errorFilter, notFoundHandler } from '@/shared/filters/error.filter';
import { logger } from '@/shared/utils/logger';
import { swaggerSpec } from '@/shared/docs/swagger.config';

// ── Authentication & User Management ───────────────────────────────────────
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/user/user.routes';

// ── Cultural Content ───────────────────────────────────────────────────────
import cultureRoutes from '@/modules/culture/culture.routes';
import artisanRoutes from '@/modules/artisan/artisan.routes';

// ── Creative Tools & Resources ─────────────────────────────────────────────
import paletteRoutes from '@/modules/palette/palette.routes';

// ── Community & Interaction ───────────────────────────────────────────────
import commentRoutes from '@/modules/comment/comment.routes';
import activityRoutes from '@/modules/activity/activity.routes';

const app = express();
const API_VERSION = process.env.API_VERSION ?? 'v1';

// ── Middlewares globaux ───────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(requestId);
// NOTE : Helmet bloque swagger-ui en dev — on le désactive sur /api-docs
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) return next();
  helmetMiddleware(req, res, next);
});
app.use(corsMiddleware);
app.use(globalRateLimiter);
app.use(compression());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

// ── Swagger UI ────────────────────────────────────────────────────────────────
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'AVS API Docs',
  customCss: `
    body { font-family: 'Segoe UI', sans-serif; }
    .topbar { background-color: #1D1D1B !important; padding: 8px 20px; }
    .topbar .topbar-wrapper .link { color: #C0573E !important; font-weight: 700; font-size: 1.1rem; }
    .topbar .topbar-wrapper .link::before { content: ''; }
    .swagger-ui .info .title { color: #C0573E; }
    .swagger-ui .info .description p { color: #1D1D1B; }
    .swagger-ui .opblock.opblock-get    .opblock-summary { border-color: #1D1D1B; }
    .swagger-ui .opblock.opblock-post   .opblock-summary-method { background: #C0573E; }
    .swagger-ui .opblock.opblock-patch  .opblock-summary-method { background: #8B3A27; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #5C1A0A; }
    .swagger-ui .btn.authorize { background: #C0573E; border-color: #C0573E; color: #F5EBE0; }
    .swagger-ui .btn.authorize svg { fill: #F5EBE0; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Endpoint pour récupérer le spec JSON brut (utile pour Postman / CI)
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Vérification de l'état de l'API
 *     tags: [System]
 *     description: Endpoint de santé — utilisé par les health checks Docker et les load balancers.
 *     responses:
 *       200:
 *         description: API opérationnelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string,  example: ok }
 *                 service:   { type: string,  example: avs-backend }
 *                 version:   { type: string,  example: '1.0.0' }
 *                 timestamp: { type: string,  format: date-time }
 *                 uptime:    { type: number,  example: 3600.42, description: 'Secondes depuis le démarrage' }
 */
app.get(`/api/${API_VERSION}/health`, (_req, res) => {
  res.json({
    status:    'ok',
    service:   'avs-backend',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  });
});

// ── Routes Registration ──────────────────────────────────────────────────────
// Authentication & User Management
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Cultural Content
app.use(`/api/${API_VERSION}/patterns`, cultureRoutes);
app.use(`/api/${API_VERSION}/artisans`, artisanRoutes);

// Creative Tools & Resources
app.use(`/api/${API_VERSION}/palettes`, paletteRoutes);

// Community & Interaction
app.use(`/api/${API_VERSION}/comments`, commentRoutes);
app.use(`/api/${API_VERSION}/activities`, activityRoutes);

// ── Handlers 404 + Error ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorFilter);

export default app;
