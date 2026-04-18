import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isProtectedPage = isProtected(PAGE_PREFIXES, pathname);
  const isProtectedApi = isProtected(API_PREFIXES, pathname);

  if (!hasSession && isProtectedApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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