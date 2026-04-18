import { NextRequest } from "next/server";

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
    metadata?: Record<string, unknown>;
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
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent") || null,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
