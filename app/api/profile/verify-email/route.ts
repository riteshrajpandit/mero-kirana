import { NextRequest, NextResponse } from "next/server";

import { jsonAuthError, jsonError, jsonUnhandledError } from "@/lib/api/response";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    if (requiresCsrf(request.method)) {
      const csrfValid = validateCsrfToken(request);
      if (!csrfValid) {
        return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
      }
    }

    const { userId, email } = await getShopContext();

    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.upsert({
      where: {
        userId_type: {
          userId,
          type: "EMAIL_VERIFICATION",
        },
      },
      update: {
        token: verificationCode,
        expiresAt,
      },
      create: {
        userId,
        type: "EMAIL_VERIFICATION",
        token: verificationCode,
        expiresAt,
      },
    });

    console.log(`Email verification code for ${email}: ${verificationCode}`);
    console.log("In production, send this via email to the user");

    return NextResponse.json({
      message: "Verification code generated. Check logs for development.",
      meta: {
        email,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("POST /api/profile/verify-email failed");
    return jsonUnhandledError(error);
  }
}
