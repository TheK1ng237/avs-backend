import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '@/modules/user/application/user.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';
import { createStorageService } from '@/infra/storage/storage.factory';

// ── Multer configuration for avatar upload ─────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const UpdateSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  bio: z.string().max(280).optional(),
  location: z.string().max(64).optional(),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().max(39).optional(),
  twitter: z.string().max(15).optional(),
  specialty: z.string().max(64).optional(),
  avatar: z.string().optional(),
});

const RoleSchema = z.object({
  role: z.enum(['viewer', 'contributor', 'curator', 'admin', 'super_admin']),
}).transform((data) => ({
  ...data,
  role: data.role.toUpperCase() as 'VIEWER' | 'CONTRIBUTOR' | 'CURATOR' | 'ADMIN' | 'SUPER_ADMIN',
}));

const VerificationSchema = z.object({
  verified: z.boolean(),
});

const BecomeCuratorSchema = z.object({
  bio: z.string().min(10).max(280),
  specialty: z.string().min(2).max(64),
  location: z.string().min(2).max(64),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().max(39).optional(),
  twitter: z.string().max(15).optional(),
});

const SettingsSchema = z.object({
  emailComments: z.boolean().optional(),
  emailDownloads: z.boolean().optional(),
  emailValidations: z.boolean().optional(),
  emailNewsletter: z.boolean().optional(),
  pushBrowser: z.boolean().optional(),
  pushValidations: z.boolean().optional(),
  profilePublic: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  allowIndexing: z.boolean().optional(),
  shareAnalytics: z.boolean().optional(),
  twoFAEnabled: z.boolean().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Une majuscule requise').regex(/[0-9]/, 'Un chiffre requis'),
});

export class UserController {
  constructor(private readonly service: UserService) {}
  private storage = createStorageService();

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await this.service.getUserById(userId);
      const { passwordHash, ...safeUser } = user;

      // Refresh session cookie (httpOnly) on each /me request
      this.refreshSessionCookie(req, res);

      res.json(ok(safeUser, 'User retrieved'));
    } catch (err) {
      next(err);
    }
  };

  private refreshSessionCookie(req: Request, res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      res.cookie('avs_session', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });
    }
  }

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await this.service.getUserStats(userId);
      res.json(ok(stats, 'Stats retrieved'));
    } catch (err) {
      next(err);
    }
  };

  getPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = Math.min(Number(req.query.limit) || 5, 50);
      const patterns = await this.service.getUserPatterns(userId, limit);
      res.json(ok(patterns, 'Patterns retrieved'));
    } catch (err) {
      next(err);
    }
  };

  getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = Math.min(Number(req.query.limit) || 6, 50);
      const activity = await this.service.getUserActivity(userId, limit);
      res.json(ok(activity, 'Activity retrieved'));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = UpdateSchema.parse(req.body);
      const user = await this.service.updateUser(userId, data);
      const { passwordHash, ...safeUser } = user;
      res.json(ok(safeUser, 'User updated'));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await this.service.deleteUser(userId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const file = req.file as Express.Multer.File;
      if (!file) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
        return;
      }

      // Upload to Supabase using the storage service
      const uploadResult = await this.storage.upload(file, 'avatars');

      // Update user avatar URL
      const user = await this.service.updateUser(userId, { avatar: uploadResult.url });
      const { passwordHash, ...safeUser } = user;

      res.json(ok(safeUser, 'Avatar uploaded successfully'));
    } catch (err) {
      next(err);
    }
  };

  // Admin methods
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, role } = req.query;
      const users = await this.service.getAllUsers(
        search as string ,
        role as string 
      );
      const safeUsers = users.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(ok(safeUsers, 'Users retrieved'));
    } catch (err) {
      next(err);
    }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = RoleSchema.parse(req.body);

      const user = await this.service.updateUserRole(userId as string, role);
      const { passwordHash, ...safeUser } = user;

      res.json(ok(safeUser, 'User role updated'));
    } catch (err) {
      next(err);
    }
  };

  toggleUserVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { verified } = VerificationSchema.parse(req.body);

      const user = await this.service.toggleUserVerification(userId as string, verified);
      const { passwordHash, ...safeUser } = user;

      res.json(ok(safeUser, 'User verification updated'));
    } catch (err) {
      next(err);
    }
  };

  getPlatformStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getPlatformStats();
      res.json(ok(stats, 'Platform stats retrieved'));
    } catch (err) {
      next(err);
    }
  };

  getContributors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contributors = await this.service.getContributors();
      res.json(ok(contributors, 'Contributors retrieved'));
    } catch (err) {
      next(err);
    }
  };

  becomeCurator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = BecomeCuratorSchema.parse(req.body);
      const user = await this.service.becomeCurator(userId, data);
      const { passwordHash, ...safeUser } = user;

      res.json(ok(safeUser, 'User promoted to curator'));
    } catch (err) {
      next(err);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const settings = await this.service.getSettings(userId);
      res.json(ok(settings, 'Settings retrieved'));
    } catch (err) {
      next(err);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = SettingsSchema.parse(req.body);
      const user = await this.service.updateSettings(userId, data);
      const { passwordHash, ...safeUser } = user;

      res.json(ok(safeUser, 'Settings updated'));
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = ChangePasswordSchema.parse(req.body);
      await this.service.changePassword(userId, data);

      res.json(ok(null, 'Password changed successfully'));
    } catch (err) {
      next(err);
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessions = await this.service.getSessions(userId);
      res.json(ok(sessions, 'Sessions retrieved'));
    } catch (err) {
      next(err);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;
      await this.service.revokeSession(userId, sessionId as string);

      res.json(ok(null, 'Session revoked'));
    } catch (err) {
      next(err);
    }
  };

  revokeAllSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { currentSessionId } = req.body;
      await this.service.revokeAllSessions(userId, currentSessionId);

      res.json(ok(null, 'All sessions revoked'));
    } catch (err) {
      next(err);
    }
  };
}
