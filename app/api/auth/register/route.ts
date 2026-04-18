import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: { message: "Invalid CSRF token", code: "CSRF_ERROR" } },
        { status: 403, headers },
      );
    }
  }

  if (!rateLimitResult.success) {
    headers.set("Retry-After", Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString());
    return NextResponse.json(
      { error: { message: "Too many registration attempts. Please try again later.", code: "RATE_LIMIT_EXCEEDED" } },
      { status: 429, headers },
    );
  }

  try {
    const payload = await request.json();
    const parsed = registerSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", code: "VALIDATION_ERROR" } },
        { status: 400, headers },
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
      return NextResponse.json(
        { error: { message: "Shop slug is already taken", code: "CONFLICT" } },
        { status: 409, headers },
      );
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: { message: "Email is already in use", code: "CONFLICT" } },
        { status: 409, headers },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: parsed.data.shopName.trim(),
          slug: shopSlug,
          subscriptionStatus: "TRIAL",
          trialStartedAt: now,
          trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          shopId: shop.id,
          email,
          name: parsed.data.ownerName.trim(),
          passwordHash,
          role: "OWNER",
        },
      });

      return { shop, user };
    });

    const token = await signSessionToken({
      userId: result.user.id,
      shopId: result.shop.id,
      role: result.user.role,
      email: result.user.email,
      name: result.user.name,
      subscriptionStatus: result.shop.subscriptionStatus,
      trialEndsAt: result.shop.trialEndsAt
        ? result.shop.trialEndsAt.toISOString()
        : null,
    });

    const response = NextResponse.json(
      {
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
          shop: {
            id: result.shop.id,
            name: result.shop.name,
            slug: result.shop.slug,
            subscriptionStatus: result.shop.subscriptionStatus,
            trialStartedAt: result.shop.trialStartedAt,
            trialEndsAt: result.shop.trialEndsAt,
          },
        },
      },
      { status: 201, headers },
    );

    setAuthCookie(response, token);
    
    await logAudit(request, "REGISTER", {
      shopId: result.shop.id,
      userId: result.user.id,
      metadata: { 
        email: result.user.email, 
        shopSlug: result.shop.slug,
        trialEndsAt: result.shop.trialEndsAt,
      },
    });
    
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: { message: "Unable to register account", code: "INTERNAL_ERROR" } },
      { status: 500, headers },
    );
  }
}