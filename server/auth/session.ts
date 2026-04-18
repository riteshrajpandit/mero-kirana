import type { SubscriptionStatus, UserRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

type SessionRole = Extract<UserRole, "OWNER" | "STAFF">;
type SessionSubscriptionStatus = Extract<SubscriptionStatus, "TRIAL" | "ACTIVE" | "EXPIRED">;

export interface SessionClaims {
  userId: string;
  shopId: string;
  role: SessionRole;
  email: string;
  name: string;
  subscriptionStatus: SessionSubscriptionStatus;
  trialEndsAt: string | null;
  sessionVersion?: number;
}

function getAuthSecret() {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be set with at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: SessionClaims) {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({
    shopId: claims.shopId,
    role: claims.role,
    email: claims.email,
    name: claims.name,
    subscriptionStatus: claims.subscriptionStatus,
    trialEndsAt: claims.trialEndsAt,
    sessionVersion: claims.sessionVersion ?? 1,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + AUTH_SESSION_MAX_AGE_SECONDS)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });

    const userId = result.payload.sub;
    const shopId = result.payload.shopId;
    const role = result.payload.role;
    const email = result.payload.email;
    const name = result.payload.name;
    const subscriptionStatus = result.payload.subscriptionStatus;
    const trialEndsAt = result.payload.trialEndsAt;

    if (
      typeof userId !== "string" ||
      typeof shopId !== "string" ||
      (role !== "OWNER" && role !== "STAFF") ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      (subscriptionStatus !== "TRIAL" &&
        subscriptionStatus !== "ACTIVE" &&
        subscriptionStatus !== "EXPIRED") ||
      !(typeof trialEndsAt === "string" || trialEndsAt === null)
    ) {
      return null;
    }

    return {
      userId,
      shopId,
      role,
      email,
      name,
      subscriptionStatus,
      trialEndsAt,
    } as SessionClaims;
  } catch {
    return null;
  }
}

export async function getSessionFromCookieStore(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getSessionFromRequestCookies() {
  const cookieStore = await cookies();
  return getSessionFromCookieStore(cookieStore);
}

export async function tryGetSessionFromRequestCookies() {
  try {
    return await getSessionFromRequestCookies();
  } catch {
    return null;
  }
}