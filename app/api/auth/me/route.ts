import { NextResponse } from "next/server";

import { jsonAuthError, jsonError } from "@/lib/api/response";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";

export async function GET() {
  try {
    const session = await getShopContext();

    return NextResponse.json({
      data: {
        userId: session.userId,
        shopId: session.shopId,
        role: session.role,
        email: session.email,
        name: session.name,
        subscriptionStatus: session.subscriptionStatus,
        trialEndsAt: session.trialEndsAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("GET /api/auth/me failed", error);
    return jsonError("Unable to read session", "INTERNAL_ERROR", 500);
  }
}