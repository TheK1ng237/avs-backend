import { Router } from 'express';
import { ActivityController } from '@/modules/activity/activity.controller';
import { ActivityService } from '@/modules/activity/application/activity.service';
import { PrismaActivityRepository } from '@/modules/activity/infrastructure/PrismaActivityRepository';
import { authenticate } from '@/shared/middlewares/auth.middleware';
import { publicApiRateLimiter } from '@/shared/middlewares/security.middleware';
import { db } from '@/config/database';

const router = Router();

// Dependency Injection
const repository = new PrismaActivityRepository(db);
const service = new ActivityService(repository);
const controller = new ActivityController(service);

/**
 * @swagger
 * /api/v1/activities:
 *   get:
 *     summary: Get user activity feed
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: User activity feed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, controller.getUserActivity);

/**
 * @swagger
 * /api/v1/activities/global:
 *   get:
 *     summary: Get global platform activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Global activity feed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/global', authenticate, controller.getGlobalActivity);

export default router;
