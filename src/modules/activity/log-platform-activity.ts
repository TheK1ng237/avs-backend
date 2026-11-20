import type { ActivityAction, Prisma } from '@prisma/client';
import { db } from '@/infra/database/database';

interface LogPlatformActivityInput {
  userId: string;
  action: ActivityAction;
  targetId: string;
  targetType: string;
  targetName: string;
  details?: Prisma.InputJsonObject;
}

export async function logPlatformActivity(input: LogPlatformActivityInput): Promise<void> {
  await db.activity.create({
    data: {
      userId: input.userId,
      action: input.action,
      targetId: input.targetId,
      targetType: input.targetType,
      metadata: {
        targetName: input.targetName,
        ...input.details,
      },
    },
  });
}
