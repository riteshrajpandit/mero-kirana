import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/errors";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const { userId, email, emailVerified } = await getShopContext();

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
      return NextResponse.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: user,
      meta: {
        emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.statusCode },
      );
    }

    console.error("GET /api/profile failed");
    const response = createErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (requiresCsrf(request.method)) {
      const csrfValid = validateCsrfToken(request);
      if (!csrfValid) {
        return NextResponse.json(
          { error: { message: "Invalid CSRF token", code: "CSRF_ERROR" } },
          { status: 403 },
        );
      }
    }

    const { userId, shopId } = await getShopContext();
    const payload = await request.json();

    const { name } = payload;

    if (name && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120)) {
      return NextResponse.json(
        { error: { message: "Invalid name", code: "VALIDATION_ERROR" } },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.statusCode },
      );
    }

    console.error("PUT /api/profile failed");
    const response = createErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
