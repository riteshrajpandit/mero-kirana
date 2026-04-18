export function validateEnv() {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (!process.env.DIRECT_URL) {
    errors.push("DIRECT_URL is required");
  }

  if (!process.env.AUTH_JWT_SECRET) {
    errors.push("AUTH_JWT_SECRET is required");
  } else if (process.env.AUTH_JWT_SECRET.length < 32) {
    errors.push("AUTH_JWT_SECRET must be at least 32 characters");
  } else if (
    process.env.AUTH_JWT_SECRET.includes("replace-with") ||
    process.env.AUTH_JWT_SECRET.includes("your-") ||
    process.env.AUTH_JWT_SECRET.includes("change-me")
  ) {
    errors.push("AUTH_JWT_SECRET appears to be a placeholder value");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET!,
    sessionMaxAge: parseInt(process.env.AUTH_SESSION_MAX_AGE || "604800", 10),
  },
  shop: {
    defaultId: process.env.DEFAULT_SHOP_ID || "00000000-0000-0000-0000-000000000000",
  },
} as const;
