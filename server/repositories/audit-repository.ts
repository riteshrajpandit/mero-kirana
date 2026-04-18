import prisma from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type CreateAuditLogInput = {
  shopId: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      shopId: input.shopId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export async function getAuditLogsForShop(
  shopId: string,
  options?: {
    limit?: number;
    cursor?: string;
    userId?: string;
    action?: string;
  },
) {
  const limit = options?.limit ?? 50;

  return prisma.auditLog.findMany({
    where: {
      shopId,
      userId: options?.userId,
      action: options?.action,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(options?.cursor && {
      cursor: { id: options.cursor },
      skip: 1,
    }),
  });
}
