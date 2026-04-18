import type { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

const isSecureCookie = process.env.NODE_ENV === "production";

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}