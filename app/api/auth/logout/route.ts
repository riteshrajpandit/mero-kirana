import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { clearAuthCookie } from "@/server/auth/cookies";

export async function POST(request: NextRequest) {
  if (requiresCsrf(request.method) && !validateCsrfToken(request)) {
    return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
  }

  const response = NextResponse.json({ data: { ok: true } });
  clearAuthCookie(response);

  return response;
}