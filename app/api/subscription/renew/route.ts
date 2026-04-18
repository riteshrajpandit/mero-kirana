import { NextRequest, NextResponse } from "next/server";

import { jsonAuthError, jsonError } from "@/lib/api/response";
import prisma from "@/lib/db/prisma";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { setAuthCookie } from "@/server/auth/cookies";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import { signSessionToken } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    if (requiresCsrf(request.method) && !validateCsrfToken(request)) {
      return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
    }

    const session = await getShopContext({ allowExpired: true });

    const owner = await prisma.user.findFirst({
      where: {
        id: session.userId,
        shopId: session.shopId,
        role: "OWNER",
      },
      select: { id: true, sessionVersion: true },
    });

    if (!owner) {
      return jsonError(
        "Only the shop owner can renew subscription",
        "AUTHORIZATION_ERROR",
        403,
      );
    }

    const shop = await prisma.shop.update({
      where: { id: session.shopId },
      data: {
        subscriptionStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    const token = await signSessionToken({
      userId: session.userId,
      shopId: session.shopId,
      role: session.role,
      email: session.email,
      name: session.name,
      subscriptionStatus: shop.subscriptionStatus,
      trialEndsAt: shop.trialEndsAt ? shop.trialEndsAt.toISOString() : null,
      sessionVersion: owner.sessionVersion,
    });

    const response = NextResponse.json({ data: { shop } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("POST /api/subscription/renew failed", error);
    return jsonError("Unable to renew subscription", "INTERNAL_ERROR", 500);
  }
}
