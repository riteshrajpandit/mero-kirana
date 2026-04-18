import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: { message: "Invalid CSRF token", code: "CSRF_ERROR" } },
        { status: 403, headers },
      );
    }
  }

  if (!rateLimitResult.success) {
    headers.set("Retry-After", Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString());
    return NextResponse.json(
      { error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMIT_EXCEEDED" } },
      { status: 429, headers },
    );
  }

  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", code: "VALIDATION_ERROR" } },
        { status: 400, headers },
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
      return NextResponse.json(
        { error: { message: "Invalid credentials", code: "AUTHENTICATION_FAILED" } },
        { status: 401, headers },
      );
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
      return NextResponse.json(
        { error: { message: "Invalid credentials", code: "AUTHENTICATION_FAILED" } },
        { status: 401, headers },
      );
    }

    const token = await signSessionToken({
      userId: user.id,
      shopId: user.shopId,
      role: user.role,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.shop.subscriptionStatus,
      trialEndsAt: user.shop.trialEndsAt ? user.shop.trialEndsAt.toISOString() : null,
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
    return NextResponse.json(
      { error: { message: "Unable to sign in", code: "INTERNAL_ERROR" } },
      { status: 500, headers },
    );
  }
}