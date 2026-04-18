import { NextRequest, NextResponse } from "next/server";

import { jsonAuthError, jsonError, jsonUnhandledError } from "@/lib/api/response";
import { PAGINATION } from "@/lib/constants";
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
    const { shopId } = await getShopContext();
    
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
      return jsonAuthError(error);
    }

    console.error("GET /api/customers failed");
    return jsonUnhandledError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (requiresCsrf(request.method)) {
      const csrfValid = validateCsrfToken(request);
      if (!csrfValid) {
        return jsonError("Invalid CSRF token", "CSRF_ERROR", 403);
      }
    }

    const { shopId } = await getShopContext();
    const payload = await request.json();
    const parsed = createCustomerSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Invalid request", "VALIDATION_ERROR", 400);
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
          updatedAt: result.record.updatedAt,
        }
      },
      { status: statusCode },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonAuthError(error);
    }

    console.error("POST /api/customers failed");
    return jsonUnhandledError(error);
  }
}