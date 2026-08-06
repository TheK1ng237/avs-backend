import { Router } from 'express';
import { ArtisanController } from '@/modules/artisan/artisan.controller';
import { ArtisanService } from '@/modules/artisan/application/artisan.service';
import { PrismaArtisanRepository } from '@/modules/artisan/infrastructure/PrismaArtisanRepository';
import { authenticate, requireAdmin } from '@/shared/middlewares/auth.middleware';
import { publicApiRateLimiter } from '@/shared/middlewares/security.middleware';
import { db } from '@/config/database';

const router = Router();

// Dependency Injection
const repository = new PrismaArtisanRepository(db);
const service = new ArtisanService(repository as any);
const controller = new ArtisanController(service);

/**
 * @swagger
 * /api/v1/artisans:
 *   get:
 *     summary: List all artisans
 *     tags: [Artisans]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: specialty
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of artisans
 */
router.get('/', publicApiRateLimiter, controller.list);

/**
 * @swagger
 * /api/v1/artisans/{id}:
 *   get:
 *     summary: Get artisan by ID
 *     tags: [Artisans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artisan details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', publicApiRateLimiter, controller.getById);

/**
 * @swagger
 * /api/v1/artisans:
 *   post:
 *     summary: Create artisan profile
 *     tags: [Artisans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, craft, origin, country, bio, specialties]
 *             properties:
 *               name:
 *                 type: string
 *               craft:
 *                 type: string
 *               origin:
 *                 type: string
 *               country:
 *                 type: string
 *               bio:
 *                 type: string
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Artisan created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, controller.create);

/**
 * @swagger
 * /api/v1/artisans/{id}:
 *   patch:
 *     summary: Update artisan profile
 *     tags: [Artisans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Artisan updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/:id', authenticate, controller.update);

/**
 * @swagger
 * /api/v1/artisans/{id}/verify:
 *   patch:
 *     summary: Verify artisan
 *     tags: [Artisans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artisan verified
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/:id/verify', authenticate, requireAdmin, controller.verify);

/**
 * @swagger
 * /api/v1/artisans/{id}:
 *   delete:
 *     summary: Delete artisan
 *     tags: [Artisans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Artisan deleted
 */
router.delete('/:id', authenticate, requireAdmin, controller.delete);

export default router;
