import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { setAuthCookie } from "@/server/auth/cookies";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import { signSessionToken } from "@/server/auth/session";

export async function POST() {
  try {
    const session = await getShopContext({ allowExpired: true });

    const owner = await prisma.user.findFirst({
      where: {
        id: session.userId,
        shopId: session.shopId,
        role: "OWNER",
      },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Only the shop owner can renew subscription" },
        { status: 403 },
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
    });

    const response = NextResponse.json({ data: { shop } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("POST /api/subscription/renew failed", error);
    return NextResponse.json(
      { error: "Unable to renew subscription" },
      { status: 500 },
    );
  }
}
