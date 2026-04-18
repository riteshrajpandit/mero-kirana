import { NextRequest, NextResponse } from "next/server";

import { PAGINATION } from "@/lib/constants";
import { createErrorResponse } from "@/lib/errors";
import { validateCsrfToken, requiresCsrf } from "@/lib/csrf";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";
import {
  getCustomersForShop,
  mergeCustomerForShop,
} from "@/server/services/customer-service";
import { createCustomerSchema } from "@/server/validation/customer";

export async function GET(request: NextRequest) {
  try {
    const { shopId, role } = await getShopContext();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10),
      PAGINATION.MAX_LIMIT
    );
    const cursor = searchParams.get("cursor");

    const customers = await getCustomersForShop(shopId, { limit, cursor });

    return NextResponse.json({ 
      data: customers,
      meta: {
        limit,
        hasMore: customers.length === limit,
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.statusCode },
      );
    }

    console.error("GET /api/customers failed");
    const response = createErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
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

    const { shopId, role } = await getShopContext();
    const payload = await request.json();
    const parsed = createCustomerSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", code: "VALIDATION_ERROR" } },
        { status: 400 },
      );
    }

    const result = await mergeCustomerForShop(shopId, parsed.data);
    const statusCode =
      result.status === "created"
        ? 201
        : result.status === "updated"
          ? 200
          : 202;

    return NextResponse.json(
      {
        data: result.record,
        meta: {
          status: result.status,
          syncedAt: result.record.syncedAt,
        }
      },
      { status: statusCode },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.statusCode },
      );
    }

    console.error("POST /api/customers failed");
    const response = createErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}