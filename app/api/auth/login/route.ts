import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import prisma from "@/lib/db/prisma";
import { setAuthCookie } from "@/server/auth/cookies";
import { signSessionToken } from "@/server/auth/session";
import { loginSchema } from "@/server/validation/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limiter";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { logAudit } from "@/server/middleware/audit";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = checkRateLimit(clientIp, "LOGIN");

  const headers = new Headers(getRateLimitHeaders(rateLimitResult));

  if (requiresCsrf(request.method)) {
    const csrfValid = validateCsrfToken(request);
    if (!csrfValid) {
      return jsonError("Invalid CSRF token", "CSRF_ERROR", 403, undefined, headers);
    }
  }

  if (!rateLimitResult.success) {
    headers.set("Retry-After", Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString());
    return jsonError(
      "Too many login attempts. Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      429,
      undefined,
      headers,
    );
  }

  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      return jsonError(
        "Invalid request",
        "VALIDATION_ERROR",
        400,
        {
          ...flattened.fieldErrors,
          ...(flattened.formErrors.length > 0
            ? { _form: flattened.formErrors }
            : {}),
        },
        headers,
      );
    }

    const shopSlug = parsed.data.shopSlug.trim().toLowerCase();
    const email = parsed.data.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email,
        shop: {
          slug: shopSlug,
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            slug: true,
            name: true,
            subscriptionStatus: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!user) {
      await logAudit(request, "LOGIN_FAILED", {
        shopId: "unknown",
        metadata: { email, shopSlug, reason: "user_not_found" },
      });
      return jsonError("Invalid credentials", "AUTHENTICATION_FAILED", 401, undefined, headers);
    }

    const isPasswordValid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await logAudit(request, "LOGIN_FAILED", {
        shopId: user.shopId,
        userId: user.id,
        metadata: { email, shopSlug, reason: "invalid_password" },
      });
      return jsonError("Invalid credentials", "AUTHENTICATION_FAILED", 401, undefined, headers);
    }

    const token = await signSessionToken({
      userId: user.id,
      shopId: user.shopId,
      role: user.role,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.shop.subscriptionStatus,
      trialEndsAt: user.shop.trialEndsAt ? user.shop.trialEndsAt.toISOString() : null,
      sessionVersion: user.sessionVersion,
    });

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        shop: user.shop,
      },
    }, { headers });

    setAuthCookie(response, token);
    
    await logAudit(request, "LOGIN_SUCCESS", {
      shopId: user.shopId,
      userId: user.id,
      metadata: { email, shopSlug },
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return jsonError("Unable to sign in", "INTERNAL_ERROR", 500, undefined, headers);
  }
}