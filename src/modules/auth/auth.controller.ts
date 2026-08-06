import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '@/modules/auth/application/auth.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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

      this.setAuthCookies(res, result.tokens);

      res.status(StatusCodes.CREATED).json(
        ok({ user: result.user }, 'User registered successfully')
      );
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

      this.setAuthCookies(res, result.tokens);

      res.json(ok({ user: result.user }, 'Login successful'));
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

      this.setAuthCookies(res, result.tokens);

      res.json(ok({ user: result.user }, 'GitHub login successful'));
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

      this.setAuthCookies(res, result.tokens);

      res.json(ok({ user: result.user }, 'Google login successful'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.clearAuthCookies(res);
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
      const refreshToken = req.cookies?.avs_refresh;

      if (!refreshToken) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Refresh token required',
        });
        return;
      }

      const result = await this.service.refreshToken(refreshToken);

      this.setAuthCookies(res, result.tokens);

      res.json(ok({ user: result.user }, 'Token refreshed'));
    } catch (err) {
      next(err);
    }
  };

  // ─────────────────────────────────────────
  // HELPERS - SET/CLEAR COOKIES
  // ─────────────────────────────────────────
  private setAuthCookies(res: Response, tokens: any) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('avs_access', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 min
      path: '/',
    });

    res.cookie('avs_refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('avs_access', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie('avs_refresh', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
    });
  }
}