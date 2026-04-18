import { NextRequest, NextResponse } from "next/server";

import { jsonAuthError, jsonError, jsonUnhandledError } from "@/lib/api/response";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const { userId, emailVerified } = await getShopContext();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return jsonError("User not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({
      data: user,
      meta: {
        emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("GET /api/profile failed");
    return jsonUnhandledError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (requiresCsrf(request.method)) {
      const csrfValid = validateCsrfToken(request);
      if (!csrfValid) {
        return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
      }
    }

    const { userId } = await getShopContext();
    const payload = await request.json();

    const { name } = payload;

    if (name && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120)) {
      return jsonError("Invalid name", "VALIDATION_ERROR", 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: updated,
      meta: {
        message: "Profile updated successfully",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("PUT /api/profile failed");
    return jsonUnhandledError(error);
  }
}
