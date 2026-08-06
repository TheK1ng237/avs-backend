import { Router } from 'express';
import { PaletteController } from '@/modules/palette/palette.controller';
import { PaletteService } from '@/modules/palette/application/palette.service';
import { PrismaPaletteRepository } from '@/modules/palette/infrastructure/PrismaPaletteRepository';
import { authenticate, requireAdmin } from '@/shared/middlewares/auth.middleware';
import { publicApiRateLimiter } from '@/shared/middlewares/security.middleware';
import { db } from '@/config/database';

const router = Router();

// Dependency Injection
const repository = new PrismaPaletteRepository(db);
const service = new PaletteService(repository);
const controller = new PaletteController(service);

/**
 * @swagger
 * /api/v1/palettes:
 *   get:
 *     summary: List all published palettes
 *     tags: [Palettes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: List of palettes
 */
router.get('/', publicApiRateLimiter, controller.list);

/**
 * @swagger
 * /api/v1/palettes/{id}:
 *   get:
 *     summary: Get palette by ID
 *     tags: [Palettes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Palette details with color tokens
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', publicApiRateLimiter, controller.getById);

/**
 * @swagger
 * /api/v1/palettes:
 *   post:
 *     summary: Create new palette
 *     tags: [Palettes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, origin, description, tokens]
 *             properties:
 *               name:
 *                 type: string
 *               origin:
 *                 type: string
 *               description:
 *                 type: string
 *               patternCSS:
 *                 type: string
 *               tokens:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Palette created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, controller.create);

/**
 * @swagger
 * /api/v1/palettes/{id}:
 *   patch:
 *     summary: Update palette
 *     tags: [Palettes]
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
 *         description: Palette updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/:id', authenticate, controller.update);

/**
 * @swagger
 * /api/v1/palettes/{id}/publish:
 *   patch:
 *     summary: Publish palette
 *     tags: [Palettes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Palette published
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/:id/publish', authenticate, requireAdmin, controller.publish);

/**
 * @swagger
 * /api/v1/palettes/{id}:
 *   delete:
 *     summary: Delete palette
 *     tags: [Palettes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Palette deleted
 */
router.delete('/:id', authenticate, requireAdmin, controller.delete);

export default router;
