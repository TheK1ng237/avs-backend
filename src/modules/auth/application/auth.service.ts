import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaUserRepository } from '@/modules/user/infrastructure/PrismaUserRepository';
import { UnauthorizedError, ConflictError } from '@/shared/errors/AppError';
import type { User, Role } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
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

      const primaryEmail = emails.find((entry) => entry.primary && entry.verified && entry.email) ?? emails.find((entry) => entry.verified && entry.email);
      if (primaryEmail?.email) {
        email = primaryEmail.email;
      }
    }

    const normalizedEmail = email ?? `${githubProfile.login ?? githubProfile.id ?? 'github'}@github.local`;
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
        role: user.role.toLowerCase() as 'viewer' | 'contributor' | 'curator' | 'admin' | 'super_admin',
      },
      this.jwtSecret,
      { expiresIn: this.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      { expiresIn: this.refreshExpiry }
    );

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