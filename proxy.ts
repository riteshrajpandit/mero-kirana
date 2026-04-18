import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/server/auth/session";

const PAGE_PREFIXES = ["/dashboard", "/customers", "/transactions"];
const API_PREFIXES = [
  "/api/customers",
  "/api/transactions",
  "/api/subscription",
];

function isProtected(prefixes: string[], pathname: string) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = rawToken ? await verifySessionToken(rawToken) : null;
  const hasSession = Boolean(session);
  const isProtectedPage = isProtected(PAGE_PREFIXES, pathname);
  const isProtectedApi = isProtected(API_PREFIXES, pathname);

  if (rawToken && !session) {
    const response = NextResponse.next();
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (!hasSession && isProtectedApi) {
    return NextResponse.json(
      {
        error: {
          message: "Unauthorized",
          code: "AUTHENTICATION_ERROR",
        },
      },
      { status: 401 },
    );
  }

  if (!hasSession && isProtectedPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/transactions/:path*",
    "/login",
    "/api/customers/:path*",
    "/api/transactions/:path*",
    "/api/subscription/:path*",
  ],
};