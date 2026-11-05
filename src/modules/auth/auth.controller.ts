import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '@/modules/auth/application/auth.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const PasswordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  locale: z.enum(['fr', 'en']).default('fr'),
});

const PasswordResetSchema = z.object({
  token: z.string().min(64).max(128),
  password: z.string().min(8).max(128),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(64),
  role: z.enum(['VIEWER', 'CONTRIBUTOR', 'CURATOR']).optional(),
});

const GithubAuthSchema = z.object({
  accessToken: z.string().min(1),
});

const GoogleAuthSchema = z.object({
  accessToken: z.string().min(1),
});

export class AuthController {
  constructor(private readonly service: AuthService) {}

  // ─────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await this.service.register(data);

      res
        .status(StatusCodes.CREATED)
        .json(ok(result, 'User registered successfully'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await this.service.login(data);

      res.json(ok(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = PasswordResetRequestSchema.parse(req.body);
      await this.service.requestPasswordReset(data);
      res.json(
        ok(
          null,
          'Si cette adresse est associée à un compte, un e-mail de réinitialisation sera envoyé.',
        ),
      );
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = PasswordResetSchema.parse(req.body);
      await this.service.resetPassword(data.token, data.password);
      res.json(ok(null, 'Mot de passe réinitialisé avec succès.'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // GITHUB LOGIN
  // ─────────────────────────────────────────
  githubLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = GithubAuthSchema.parse(req.body);
      const result = await this.service.githubLogin(data);

      res.json(ok(result, 'GitHub login successful'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────
  googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = GoogleAuthSchema.parse(req.body);
      const result = await this.service.googleLogin(data);

      res.json(ok(result, 'Google login successful'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(ok(null, 'Logout successful'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);

      const result = await this.service.refreshToken(refreshToken);

      res.json(ok(result, 'Token refreshed'));
    } catch (err) {
      next(err);
    }
  };

}
