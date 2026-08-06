import { Router } from 'express';
import { CommentController } from '@/modules/comment/comment.controller';
import { CommentService } from '@/modules/comment/application/comment.service';
import { PrismaCommentRepository } from '@/modules/comment/infrastructure/PrismaCommentRepository';
import { authenticate } from '@/shared/middlewares/auth.middleware';
import { publicApiRateLimiter } from '@/shared/middlewares/security.middleware';
import { db } from '@/config/database';

const router = Router();

// Dependency Injection
const repository = new PrismaCommentRepository(db);
const service = new CommentService(repository);
const controller = new CommentController(service);

/**
 * @swagger
 * /api/v1/patterns/{patternId}/comments:
 *   get:
 *     summary: Get comments on a pattern
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: patternId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Comments on pattern
 */
router.get('/patterns/:patternId/comments', publicApiRateLimiter, controller.getComments);

/**
 * @swagger
 * /api/v1/artisans/{artisanId}/comments:
 *   get:
 *     summary: Get comments on an artisan
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: artisanId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Comments on artisan
 */
router.get('/artisans/:artisanId/comments', publicApiRateLimiter, controller.getComments);

/**
 * @swagger
 * /api/v1/patterns/{patternId}/comments:
 *   post:
 *     summary: Add comment to a pattern
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patternId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Comment added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/patterns/:patternId/comments', authenticate, publicApiRateLimiter, controller.addComment);

/**
 * @swagger
 * /api/v1/artisans/{artisanId}/comments:
 *   post:
 *     summary: Add comment to an artisan
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artisanId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/artisans/:artisanId/comments', authenticate, publicApiRateLimiter, controller.addComment);

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Comment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', authenticate, controller.deleteComment);

export default router;
