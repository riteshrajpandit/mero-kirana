import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/errors";

type ErrorDetails = Record<string, string[]>;

export function jsonError(
  message: string,
  code: string,
  status: number,
  details?: ErrorDetails,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        ...(details ? { details } : {}),
      },
    },
    { status, headers },
  );
}

export function jsonUnhandledError(error: unknown) {
  const response = createErrorResponse(error);
  return NextResponse.json(response.body, { status: response.status });
}

export function jsonAuthError(error: { message: string; code: string; statusCode: number }) {
  return jsonError(error.message, error.code, error.statusCode);
}
