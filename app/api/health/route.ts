import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return jsonError("Database connection failed", "SERVICE_UNAVAILABLE", 503);
  }
}
