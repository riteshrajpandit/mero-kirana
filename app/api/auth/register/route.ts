import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import { TRIAL_DAYS } from "@/lib/constants";
import prisma from "@/lib/db/prisma";
import { setAuthCookie } from "@/server/auth/cookies";
import { signSessionToken } from "@/server/auth/session";
import { registerSchema } from "@/server/validation/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limiter";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { logAudit } from "@/server/middleware/audit";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = checkRateLimit(clientIp, "REGISTER");

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
      "Too many registration attempts. Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      429,
      undefined,
      headers,
    );
  }

  try {
    const payload = await request.json();
    const parsed = registerSchema.safeParse(payload);

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

    const now = new Date();
    const trialEndsAt = addDays(now, TRIAL_DAYS);
    const shopSlug = parsed.data.shopSlug.trim().toLowerCase();
    const email = parsed.data.email.trim().toLowerCase();

    const existingShop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
      select: { id: true },
    });

    if (existingShop) {
      return jsonError("Shop slug is already taken", "CONFLICT", 409, undefined, headers);
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return jsonError("Email is already in use", "CONFLICT", 409, undefined, headers);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const shopWithOwner = await prisma.shop.create({
      data: {
        name: parsed.data.shopName.trim(),
        slug: shopSlug,
        subscriptionStatus: "TRIAL",
        trialStartedAt: now,
        trialEndsAt,
        users: {
          create: {
            email,
            name: parsed.data.ownerName.trim(),
            passwordHash,
            role: "OWNER",
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            sessionVersion: true,
          },
        },
      },
    });

    const owner = shopWithOwner.users[0];

    if (!owner) {
      return jsonError("Unable to register account", "INTERNAL_ERROR", 500, undefined, headers);
    }

    const token = await signSessionToken({
      userId: owner.id,
      shopId: shopWithOwner.id,
      role: owner.role,
      email: owner.email,
      name: owner.name,
      subscriptionStatus: shopWithOwner.subscriptionStatus,
      trialEndsAt: shopWithOwner.trialEndsAt
        ? shopWithOwner.trialEndsAt.toISOString()
        : null,
      sessionVersion: owner.sessionVersion,
    });

    const response = NextResponse.json(
      {
        data: {
          user: {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            role: owner.role,
          },
          shop: {
            id: shopWithOwner.id,
            name: shopWithOwner.name,
            slug: shopWithOwner.slug,
            subscriptionStatus: shopWithOwner.subscriptionStatus,
            trialStartedAt: shopWithOwner.trialStartedAt,
            trialEndsAt: shopWithOwner.trialEndsAt,
          },
        },
      },
      { status: 201, headers },
    );

    setAuthCookie(response, token);
    
    await logAudit(request, "REGISTER", {
      shopId: shopWithOwner.id,
      userId: owner.id,
      metadata: { 
        email: owner.email, 
        shopSlug: shopWithOwner.slug,
        trialEndsAt: shopWithOwner.trialEndsAt,
      },
    });
    
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return jsonError("Unable to register account", "INTERNAL_ERROR", 500, undefined, headers);
  }
}