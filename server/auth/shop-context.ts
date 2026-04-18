import prisma from "@/lib/db/prisma";
import { AuthError } from "@/server/auth/errors";
import { getSessionFromRequestCookies } from "@/server/auth/session";

type GetShopContextOptions = {
  allowExpired?: boolean;
  requireOwner?: boolean;
};

export async function getShopContext(options: GetShopContextOptions = {}) {
  const session = await getSessionFromRequestCookies();

  if (!session) {
    throw new AuthError("Please sign in to continue", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { sessionVersion: true, emailVerified: true },
  });

  if (user && session.sessionVersion !== user.sessionVersion) {
    throw new AuthError("Session expired. Please sign in again.", 401);
  }

  const shop = await prisma.shop.findUnique({
    where: { id: session.shopId },
    select: { trialEndsAt: true, subscriptionStatus: true },
  });

  const now = Date.now();
  const trialExpired =
    shop?.subscriptionStatus === "TRIAL" &&
    shop.trialEndsAt !== null &&
    new Date(shop.trialEndsAt).getTime() <= now;

  if (
    !options.allowExpired &&
    (shop?.subscriptionStatus === "EXPIRED" || trialExpired)
  ) {
    throw new AuthError(
      "Your free trial has expired. Renew your plan to continue.",
      402,
    );
  }

  if (options.requireOwner && session.role !== "OWNER") {
    throw new AuthError("This action requires owner permissions", 403);
  }

  return {
    shopId: session.shopId,
    userId: session.userId,
    role: session.role,
    email: session.email,
    name: session.name,
    subscriptionStatus: shop?.subscriptionStatus || session.subscriptionStatus,
    trialEndsAt: shop?.trialEndsAt?.toISOString() || session.trialEndsAt,
    emailVerified: user?.emailVerified ?? false,
  };
}