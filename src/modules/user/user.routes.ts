import { Router } from 'express';
import multer from 'multer';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/application/user.service';
import { PrismaUserRepository } from '@/modules/user/infrastructure/PrismaUserRepository';
import { authenticate, requireAdmin, requireSuperAdmin } from '@/shared/middlewares/auth.middleware';
import { db } from '@/config/database';

const router = Router();

// Dependency Injection
const repository = new PrismaUserRepository(db);
const service = new UserService(repository as any, db);
const controller = new UserController(service);

// Multer configuration for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, controller.getMe);

/**
 * @swagger
 * /api/v1/users/me/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/stats', authenticate, controller.getStats);

/**
 * @swagger
 * /api/v1/users/me/patterns:
 *   get:
 *     summary: Get user patterns
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 50
 *         description: Maximum number of patterns to return
 *     responses:
 *       200:
 *         description: User patterns
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/patterns', authenticate, controller.getPatterns);

/**
 * @swagger
 * /api/v1/users/me/activity:
 *   get:
 *     summary: Get user activity
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *           maximum: 50
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: User activity
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/activity', authenticate, controller.getActivity);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/me', authenticate, controller.update);

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/me', authenticate, controller.delete);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/avatar', authenticate, upload.single('avatar'), controller.uploadAvatar);

/**
 * @swagger
 * /api/v1/users/admin:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [viewer, contributor, curator, admin]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin', authenticate, requireAdmin, controller.getAllUsers);

/**
 * @swagger
 * /api/v1/users/admin/{userId}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [viewer, contributor, curator, admin]
 *     responses:
 *       200:
 *         description: User role updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/admin/:userId/role', authenticate, requireSuperAdmin, controller.updateUserRole);

/**
 * @swagger
 * /api/v1/users/admin/{userId}/verification:
 *   patch:
 *     summary: Toggle user verification (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User verification updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/admin/:userId/verification', authenticate, requireAdmin, controller.toggleUserVerification);

/**
 * @swagger
 * /api/v1/users/admin/stats:
 *   get:
 *     summary: Get platform-wide statistics (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/stats', authenticate, requireAdmin, controller.getPlatformStats);

/**
 * @swagger
 * /api/v1/users/contributors:
 *   get:
 *     summary: Get contributors with stats
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contributors with stats
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/contributors', authenticate, controller.getContributors);

/**
 * @swagger
 * /api/v1/users/become-curator:
 *   post:
 *     summary: Become a curator
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *               - specialty
 *               - location
 *             properties:
 *               bio:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 280
 *               specialty:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 64
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 64
 *               website:
 *                 type: string
 *                 format: uri
 *               github:
 *                 type: string
 *                 maxLength: 39
 *               twitter:
 *                 type: string
 *                 maxLength: 15
 *     responses:
 *       200:
 *         description: User promoted to curator
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         description: Invalid input or already curator
 */
router.post('/become-curator', authenticate, controller.becomeCurator);

/**
 * @swagger
 * /api/v1/users/me/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/settings', authenticate, controller.getSettings);

/**
 * @swagger
 * /api/v1/users/me/settings:
 *   patch:
 *     summary: Update user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailComments:
 *                 type: boolean
 *               emailDownloads:
 *                 type: boolean
 *               emailValidations:
 *                 type: boolean
 *               emailNewsletter:
 *                 type: boolean
 *               pushBrowser:
 *                 type: boolean
 *               pushValidations:
 *                 type: boolean
 *               profilePublic:
 *                 type: boolean
 *               showEmail:
 *                 type: boolean
 *               showLocation:
 *                 type: boolean
 *               allowIndexing:
 *                 type: boolean
 *               shareAnalytics:
 *                 type: boolean
 *               twoFAEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/me/settings', authenticate, controller.updateSettings);

/**
 * @swagger
 * /api/v1/users/me/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 minLength: 8
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         description: Invalid password
 */
router.post('/me/change-password', authenticate, controller.changePassword);

/**
 * @swagger
 * /api/v1/users/me/sessions:
 *   get:
 *     summary: Get user active sessions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User sessions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/sessions', authenticate, controller.getSessions);

/**
 * @swagger
 * /api/v1/users/me/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/me/sessions/:sessionId', authenticate, controller.revokeSession);

/**
 * @swagger
 * /api/v1/users/me/sessions/revoke-all:
 *   post:
 *     summary: Revoke all sessions except current
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentSessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: All sessions revoked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/sessions/revoke-all', authenticate, controller.revokeAllSessions);

export default router;
