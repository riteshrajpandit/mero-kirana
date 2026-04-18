import bcrypt from "bcryptjs";

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const TRIAL_DAYS = 15;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const defaultShopId =
    process.env.DEFAULT_SHOP_ID || "00000000-0000-0000-0000-000000000000";
  const shopSlug = (process.env.SEED_SHOP_SLUG || "dev-shop").toLowerCase();
  const shopName = process.env.SEED_SHOP_NAME || "Development Shop";
  const ownerEmail = (
    process.env.SEED_OWNER_EMAIL || "dev@example.com"
  ).toLowerCase();
  const ownerName = process.env.SEED_OWNER_NAME || "Developer";
  
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  if (!ownerPassword) {
    console.error("ERROR: SEED_OWNER_PASSWORD environment variable is required");
    console.error("Generate a secure password with: openssl rand -base64 24");
    process.exit(1);
  }
  
  const now = new Date();
  const trialEndsAt = addDays(now, TRIAL_DAYS);

  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const shop = await prisma.shop.upsert({
    where: { slug: shopSlug },
    update: {
      name: shopName,
      subscriptionStatus: "TRIAL",
      trialStartedAt: now,
      trialEndsAt,
    },
    create: {
      id: defaultShopId,
      slug: shopSlug,
      name: shopName,
      subscriptionStatus: "TRIAL",
      trialStartedAt: now,
      trialEndsAt,
    },
  });

  const user = await prisma.user.upsert({
    where: {
      shopId_email: {
        shopId: shop.id,
        email: ownerEmail,
      },
    },
    update: {
      name: ownerName,
      passwordHash,
      role: UserRole.OWNER,
    },
    create: {
      shopId: shop.id,
      email: ownerEmail,
      name: ownerName,
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  console.log("Seed completed");
  console.log(`Shop slug: ${shop.slug}`);
  console.log(`Owner email: ${user.email}`);
  console.log("Owner password: (from SEED_OWNER_PASSWORD env or default)");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });