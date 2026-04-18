import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { createAuditLog } from "@/server/repositories/audit-repository";

type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "CREATE_CUSTOMER"
  | "UPDATE_CUSTOMER"
  | "DELETE_CUSTOMER"
  | "CREATE_TRANSACTION"
  | "UPDATE_TRANSACTION"
  | "DELETE_TRANSACTION"
  | "PASSWORD_CHANGE"
  | "PROFILE_UPDATE"
  | "SUBSCRIPTION_RENEW";

export async function logAudit(
  request: NextRequest,
  action: AuditAction,
  options: {
    shopId: string;
    userId?: string;
    resource?: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  },
) {
  try {
    await createAuditLog({
      shopId: options.shopId,
      userId: options.userId,
      action,
      resource: options.resource,
      resourceId: options.resourceId,
      metadata: options.metadata,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
