import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from '@/config/database';
import { PrismaUserRepository } from '@/modules/user/infrastructure/PrismaUserRepository';
import { AppError, UnauthorizedError, ConflictError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';
import {
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from '@/shared/utils/password-reset-email';
import type { User, Role } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface PasswordResetRequestDto {
  email: string;
  locale: 'fr' | 'en';
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface GithubLoginDto {
  accessToken: string;
}

export interface GoogleLoginDto {
  accessToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: AuthTokens;
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET!;
  private readonly accessExpiry = '24h';
  private readonly refreshExpiry = '7d';

  constructor(private readonly userRepository: PrismaUserRepository) {}

  // ─────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role || 'VIEWER',
    });

    return this.generateAuthResponse(user);
  }

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.generateAuthResponse(user);
  }

  async requestPasswordReset(dto: PasswordResetRequestDto): Promise<void> {
    if (!isPasswordResetEmailConfigured()) {
      throw new AppError(
        'La réinitialisation du mot de passe est temporairement indisponible.',
        503,
        'PASSWORD_RESET_UNAVAILABLE',
      );
    }

    const user = await db.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (!user?.passwordHash) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    try {
      await sendPasswordResetEmail(user.email, token, dto.locale);
    } catch (error) {
      logger.error('Password reset email could not be sent.', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      try {
        await db.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
      } catch (cleanupError) {
        logger.error('Failed to invalidate an unsent password reset token.', {
          userId: user.id,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    const now = new Date();

    if (!resetToken || resetToken.expiresAt <= now) {
      throw new AppError(
        'Ce lien de réinitialisation est invalide ou a expiré.',
        400,
        'INVALID_RESET_TOKEN',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.$transaction(async (transaction) => {
      const consumedToken = await transaction.passwordResetToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: new Date() } },
      });
      if (consumedToken.count !== 1) {
        throw new AppError(
          'Ce lien de réinitialisation est invalide ou a expiré.',
          400,
          'INVALID_RESET_TOKEN',
        );
      }

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
    });
  }

  // ─────────────────────────────────────────
  // GITHUB LOGIN
  // ─────────────────────────────────────────
  async githubLogin(dto: GithubLoginDto): Promise<AuthResponse> {
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${dto.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!githubUserResponse.ok) {
      throw new UnauthorizedError('GitHub authentication failed');
    }

    const githubProfile = (await githubUserResponse.json()) as {
      login?: string;
      name?: string;
      email?: string;
      id?: number;
    };

    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${dto.accessToken}`,
        Accept: 'application/json',
      },
    });

    let email = githubProfile.email ?? null;

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }>;

      const primaryEmail =
        emails.find((entry) => entry.primary && entry.verified && entry.email) ??
        emails.find((entry) => entry.verified && entry.email);
      if (primaryEmail?.email) {
        email = primaryEmail.email;
      }
    }

    const normalizedEmail =
      email ?? `${githubProfile.login ?? githubProfile.id ?? 'github'}@github.local`;
    const githubUsername = githubProfile.login ?? null;
    const displayName = githubProfile.name?.trim() || githubProfile.login || 'GitHub User';

    let user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      user = await this.userRepository.create({
        email: normalizedEmail,
        name: displayName,
        passwordHash: null,
        role: 'VIEWER',
        github: githubUsername ?? undefined,
      });
    } else if (!user.github && githubUsername) {
      user = await this.userRepository.update(user.id, { github: githubUsername });
    }

    return this.generateAuthResponse(user);
  }

  // ─────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────
  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponse> {
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${dto.accessToken}`,
      },
    });

    if (!googleUserResponse.ok) {
      throw new UnauthorizedError('Google authentication failed');
    }

    const googleProfile = (await googleUserResponse.json()) as {
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      sub?: string;
    };

    const email = googleProfile.email;
    if (!email) {
      throw new UnauthorizedError('Google email not provided');
    }

    const displayName = googleProfile.name?.trim() || googleProfile.given_name || 'Google User';
    const googleId = googleProfile.sub;

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      user = await this.userRepository.create({
        email,
        name: displayName,
        passwordHash: null,
        role: 'VIEWER',
        google: googleId ?? undefined,
      });
    } else if (!user.google && googleId) {
      user = await this.userRepository.update(user.id, { google: googleId });
    }

    return this.generateAuthResponse(user);
  }

  // ─────────────────────────────────────────
  // TOKEN VALIDATION (middleware / api guard)
  // ─────────────────────────────────────────
  async validateAccessToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  // ─────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────
  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;

      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.generateAuthResponse(user);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  // ─────────────────────────────────────────
  // CORE TOKEN GENERATION
  // ─────────────────────────────────────────
  private generateAuthResponse(user: User): AuthResponse {
    const { passwordHash, ...safeUser } = user;

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.toLowerCase() as
          | 'viewer'
          | 'contributor'
          | 'curator'
          | 'admin'
          | 'super_admin',
      },
      this.jwtSecret,
      { expiresIn: this.accessExpiry },
    );

    const refreshToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
      expiresIn: this.refreshExpiry,
    });

    // Record session entry in database
    db.session
      .create({
        data: {
          userId: user.id,
          sessionToken: refreshToken,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      .catch(() => {
        // Ignore background session record errors
      });

    return {
      user: safeUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60,
      },
    };
  }
}
