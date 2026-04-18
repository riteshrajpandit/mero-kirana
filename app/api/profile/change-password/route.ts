import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { jsonAuthError, jsonError, jsonUnhandledError } from "@/lib/api/response";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/constants";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/server/middleware/audit";

const changePasswordSchema = {
  currentPassword: (password: string) =>
    password && typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH,
  newPassword: (password: string) =>
    password &&
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password),
};

export async function POST(request: NextRequest) {
  try {
    if (requiresCsrf(request.method)) {
      const csrfValid = validateCsrfToken(request);
      if (!csrfValid) {
        return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
      }
    }

    const { userId, shopId } = await getShopContext();
    const payload = await request.json();

    const { currentPassword, newPassword } = payload;

    if (!changePasswordSchema.currentPassword(currentPassword)) {
      return jsonError("Invalid current password", "VALIDATION_ERROR", 400);
    }

    if (!changePasswordSchema.newPassword(newPassword)) {
      return jsonError(
        `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters with uppercase, lowercase, number, and special character`,
        "VALIDATION_ERROR",
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return jsonError("User not found", "NOT_FOUND", 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      await logAudit(request, "PASSWORD_CHANGE", {
        shopId,
        userId,
        resource: "User",
        metadata: { success: false, reason: "invalid_current_password" },
      });
      return jsonError("Current password is incorrect", "AUTHENTICATION_FAILED", 401);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: { increment: 1 },
      },
    });

    await logAudit(request, "PASSWORD_CHANGE", {
      shopId,
      userId,
      resource: "User",
      metadata: { success: true },
    });

    return NextResponse.json({
      message: "Password changed successfully. Please sign in again.",
      meta: {
        requiresRelogin: true,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("POST /api/profile/change-password failed");
    return jsonUnhandledError(error);
  }
}
