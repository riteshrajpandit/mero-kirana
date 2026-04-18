import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  try {
    const token = generateCsrfToken();
    const response = NextResponse.json({ data: { token } });
    setCsrfCookie(response, token);
    return response;
  } catch (error) {
    console.error("GET /api/csrf-token failed", error);
    return jsonError("Unable to create CSRF token", "INTERNAL_ERROR", 500);
  }
}
