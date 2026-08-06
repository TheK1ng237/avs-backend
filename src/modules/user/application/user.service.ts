import type { User } from '@prisma/client';
import type { IRepository } from '@/shared/types/repository.types';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '@/shared/errors/AppError';

export interface UpdateUserDto {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  specialty?: string;
  avatar?: string;
}

export interface UpdateSettingsDto {
  // Notification settings
  emailComments?: boolean;
  emailDownloads?: boolean;
  emailValidations?: boolean;
  emailNewsletter?: boolean;
  pushBrowser?: boolean;
  pushValidations?: boolean;
  
  // Privacy settings
  profilePublic?: boolean;
  showEmail?: boolean;
  showLocation?: boolean;
  allowIndexing?: boolean;
  shareAnalytics?: boolean;
  
  // 2FA settings
  twoFAEnabled?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface BecomeCuratorDto {
  bio: string;
  specialty: string;
  location: string;
  website?: string;
  github?: string;
  twitter?: string;
}

export interface UserPattern {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'published' | 'draft' | 'review';
  views: number;
  downloads: number;
  imgUrl: string;
}

export interface UserActivity {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'comment' | 'download' | 'review' | 'favorite';
}

export interface UserStats {
  patternsCreated: number;
  totalViews: number;
  memberSince: string;
  downloadsTotal?: number;
  favoritesCount?: number;
  commentsCount?: number;
  trends?: {
    patternsTrend: string;
    downloadsTrend: string;
    viewsTrend: string;
    favoritesTrend: string;
  };
}

export class UserService {
  constructor(
    private readonly repository: IRepository<User>,
    private readonly db: PrismaClient,
  ) {}

  async getUserById(userId: string): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    const user = await this.repository.update(userId, data);
    return user;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    // Format member since date
    const memberSince = user.createdAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Current month start
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count patterns by this user
    const patternsCreated = await this.db.pattern.count({
      where: { createdById: userId },
    });

    // Sum downloads and views from user's patterns
    const patterns = await this.db.pattern.findMany({
      where: { createdById: userId },
      select: { downloads: true, views: true },
    });

    const downloadsTotal = patterns.reduce((sum, p) => sum + (p.downloads || 0), 0);
    const totalViews = patterns.reduce((sum, p) => sum + (p.views || 0), 0);

    // Count comments by this user
    const commentsCount = await this.db.comment.count({
      where: { userId },
    });

    // Count favorites (activities with FAVORITED action)
    const favoritesCount = await this.db.activity.count({
      where: { userId, action: 'FAVORITED' },
    });

    // Calculate trends - compare current month vs last month
    const patternsThisMonth = await this.db.pattern.count({
      where: {
        createdById: userId,
        createdAt: { gte: currentMonthStart },
      },
    });

    const patternsLastMonth = await this.db.pattern.count({
      where: {
        createdById: userId,
        createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    });

    const patternsDiff = patternsThisMonth - patternsLastMonth;
    const patternsTrend = patternsDiff >= 0 ? `+${patternsDiff} ce mois` : `${patternsDiff} ce mois`;

    // Downloads trend (using activity data)
    const downloadsThisMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'DOWNLOADED',
        createdAt: { gte: currentMonthStart },
      },
    });

    const downloadsLastMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'DOWNLOADED',
        createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    });

    const downloadsTrend = downloadsLastMonth > 0
      ? `${Math.round(((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth) * 100)}% vs mois dernier`
      : '+0% vs mois dernier';

    // Views trend (using activity data)
    const viewsThisMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'CREATED', // Assuming CREATED represents views for now
        createdAt: { gte: currentMonthStart },
      },
    });

    const viewsLastMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'CREATED',
        createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    });

    const viewsDiff = viewsThisMonth - viewsLastMonth;
    const viewsTrend = viewsDiff >= 0 ? `+${viewsDiff} ce mois` : `${viewsDiff} ce mois`;

    // Favorites trend
    const favoritesThisMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'FAVORITED',
        createdAt: { gte: currentMonthStart },
      },
    });

    const favoritesLastMonth = await this.db.activity.count({
      where: {
        userId,
        action: 'FAVORITED',
        createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    });

    const favoritesDiff = favoritesThisMonth - favoritesLastMonth;
    const favoritesTrend = favoritesDiff >= 0 ? `+${favoritesDiff} nouveaux` : `${favoritesDiff} nouveaux`;

    return {
      patternsCreated,
      totalViews,
      memberSince,
      downloadsTotal,
      favoritesCount,
      commentsCount,
      trends: {
        patternsTrend,
        downloadsTrend,
        viewsTrend,
        favoritesTrend,
      },
    };
  }

  async getUserPatterns(userId: string, limit: number = 5): Promise<UserPattern[]> {
    const patterns = await this.db.pattern.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        views: true,
        downloads: true,
        imgUrl: true,
      },
    });

    return patterns.map((pattern) => ({
      id: pattern.id,
      name: pattern.name,
      slug: pattern.slug,
      type: pattern.type,
      status: pattern.status.toLowerCase() as 'published' | 'draft' | 'review',
      views: pattern.views || 0,
      downloads: pattern.downloads || 0,
      imgUrl: pattern.imgUrl,
    }));
  }

  async getUserActivity(userId: string, limit: number = 6): Promise<UserActivity[]> {
    const activities = await this.db.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Map ActivityAction to frontend type and action label
    const actionConfig: Record<string, { type: 'comment' | 'download' | 'review' | 'favorite'; label: string }> = {
      COMMENTED: { type: 'comment', label: 'Commentaire sur' },
      DOWNLOADED: { type: 'download', label: 'Téléchargement de' },
      REVIEWED: { type: 'review', label: 'Validation approuvée —' },
      FAVORITED: { type: 'favorite', label: 'Favori ajouté sur' },
    };

    const result: UserActivity[] = [];

    for (const activity of activities) {
      const config = actionConfig[activity.action];
      if (!config) continue;

      // Fetch pattern name if target is a pattern
      let targetName = activity.targetId;
      if (activity.targetType === 'pattern' || activity.targetType === 'Pattern') {
        const pattern = await this.db.pattern.findUnique({
          where: { id: activity.targetId },
          select: { name: true },
        });
        if (pattern) targetName = pattern.name;
      }

      result.push({
        id: activity.id,
        action: config.label,
        target: targetName,
        timestamp: activity.createdAt.toISOString(),
        type: config.type,
      });
    }

    return result;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.repository.delete(userId);
  }

  async verifyUser(userId: string): Promise<User> {
    return this.repository.update(userId, { verified: true });
  }

  // Admin methods
  async getAllUsers(search: string, role: string ): Promise<User[]> {
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    return this.db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    return this.repository.update(userId, { role });
  }

  async toggleUserVerification(userId: string, verified: boolean): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    return this.repository.update(userId, { verified });
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalPatterns: number;
    totalDownloads: number;
    totalViews: number;
    verifiedUsers: number;
    admins: number;
    curators: number;
    contributors: number;
    patternsByStatus: {
      published: number;
      draft: number;
      review: number;
    };
  }> {
    const [totalUsers, totalPatterns, totalDownloads, totalViews, admins, curators, contributors, verifiedUsers] = await Promise.all([
      this.db.user.count(),
      this.db.pattern.count(),
      this.db.pattern.aggregate({ _sum: { downloads: true } }),
      this.db.pattern.aggregate({ _sum: { views: true } }),
      this.db.user.count({ where: { role: 'ADMIN' } }),
      this.db.user.count({ where: { role: 'CURATOR' } }),
      this.db.user.count({ where: { role: 'CONTRIBUTOR' } }),
      this.db.user.count({ where: { verified: true } }),
    ]);

    const patternsByStatus = await this.db.pattern.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = {
      published: 0,
      draft: 0,
      review: 0,
    };

    patternsByStatus.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof statusCounts;
      if (statusCounts[status] !== undefined) {
        statusCounts[status] = item._count;
      }
    });

    return {
      totalUsers,
      totalPatterns,
      totalDownloads: totalDownloads._sum.downloads || 0,
      totalViews: totalViews._sum.views || 0,
      verifiedUsers,
      admins,
      curators,
      contributors,
      patternsByStatus: statusCounts,
    };
  }

  async getContributors(): Promise<any[]> {
    const users = await this.db.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'CURATOR', 'CONTRIBUTOR'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const contributorsWithStats = await Promise.all(
      users.map(async (user) => {
        const patterns = await this.db.pattern.findMany({
          where: { createdById: user.id },
          select: {
            views: true,
            downloads: true,
          },
        });

        const totalPatterns = patterns.length;
        const totalViews = patterns.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalDownloads = patterns.reduce((sum, p) => sum + (p.downloads || 0), 0);

        // Calculate a simple score based on patterns, views, and downloads
        const score = Math.min(100, Math.round(
          (totalPatterns * 2) + 
          (totalViews / 1000) + 
          (totalDownloads / 100)
        ));

        return {
          id: user.id,
          name: user.name,
          role: user.role.toLowerCase(),
          origin: user.location || 'Non renseigné',
          country: 'CM', // Default for now, could be stored in user profile
          specialty: 'Artisan textile', // Default for now
          patterns: totalPatterns,
          views: totalViews,
          downloads: totalDownloads,
          score,
          verified: user.verified,
          featured: user.role === 'ADMIN' || user.role === 'CURATOR',
          github: user.github,
          avatarCSS: 'avs-pattern-kente-royale', // Default pattern
          joinedYear: user.createdAt.getFullYear(),
          badges: user.verified ? ['Vérifié'] : [],
        };
      })
    );

    return contributorsWithStats.sort((a, b) => b.score - a.score);
  }

  async becomeCurator(userId: string, data: BecomeCuratorDto): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if user is already a curator or higher
    if (user.role === 'CURATOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new Error('User is already a curator or higher');
    }

    // Update user profile and promote to curator
    return this.repository.update(userId, {
      ...data,
      role: 'CURATOR',
    });
  }

  async updateSettings(userId: string, data: UpdateSettingsDto): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    return this.repository.update(userId, data);
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.passwordHash) {
      throw new UnauthorizedError('User has no password set (OAuth account)');
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
    return this.repository.update(userId, { passwordHash: newPasswordHash });
  }

  async getSettings(userId: string): Promise<{
    notifications: {
      emailComments: boolean;
      emailDownloads: boolean;
      emailValidations: boolean;
      emailNewsletter: boolean;
      pushBrowser: boolean;
      pushValidations: boolean;
    };
    privacy: {
      profilePublic: boolean;
      showEmail: boolean;
      showLocation: boolean;
      allowIndexing: boolean;
      shareAnalytics: boolean;
    };
    security: {
      twoFAEnabled: boolean;
    };
  }> {
    const user = await this.repository.findById(userId);
    if (!user) throw new Error('User not found');

    return {
      notifications: {
        emailComments: user.emailComments,
        emailDownloads: user.emailDownloads,
        emailValidations: user.emailValidations,
        emailNewsletter: user.emailNewsletter,
        pushBrowser: user.pushBrowser,
        pushValidations: user.pushValidations,
      },
      privacy: {
        profilePublic: user.profilePublic,
        showEmail: user.showEmail,
        showLocation: user.showLocation,
        allowIndexing: user.allowIndexing,
        shareAnalytics: user.shareAnalytics,
      },
      security: {
        twoFAEnabled: user.twoFAEnabled,
      },
    };
  }

  async getSessions(userId: string): Promise<Array<{
    id: string;
    device: string;
    location: string;
    lastSeen: string;
    current: boolean;
  }>> {
    const sessions = await this.db.session.findMany({
      where: { userId },
      orderBy: { expires: 'desc' },
    });

    const now = new Date();
    return sessions.map((session) => ({
      id: session.id,
      device: 'Session Web',
      location: 'Inconnu',
      lastSeen: this.formatLastSeen(session.expires),
      current: session.expires > now,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.db.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized to revoke this session');
    }

    await this.db.session.delete({
      where: { id: sessionId },
    });
  }

  async revokeAllSessions(userId: string, exceptCurrentSessionId?: string): Promise<void> {
    const where: any = { userId };

    if (exceptCurrentSessionId) {
      where.id = { not: exceptCurrentSessionId };
    }

    await this.db.session.deleteMany({ where });
  }

  private formatLastSeen(expires: Date): string {
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Expirée';
    if (diffDays === 1) return 'Il y a 1 jour';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }
}

