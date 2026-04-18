import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/constants";

const TOKEN_LENGTH = 32;
const isSecureCookie = process.env.NODE_ENV === "production";

export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}

export function setCsrfCookie(response: NextResponse, token: string) {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function getCsrfToken(request: NextRequest | Request): string | null {
  if (request instanceof NextRequest) {
    return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
  }

  const cookieHeader = (request as Request).headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[CSRF_COOKIE_NAME] || null;
}

export function getCsrfHeader(request: NextRequest | Request): string | null {
  if (request instanceof NextRequest) {
    return request.headers.get(CSRF_HEADER_NAME);
  }
  return (request as Request).headers.get(CSRF_HEADER_NAME);
}

export function validateCsrfToken(request: NextRequest | Request): boolean {
  const cookieToken = getCsrfToken(request);
  const headerToken = getCsrfHeader(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

export function requiresCsrf(method: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());
}
