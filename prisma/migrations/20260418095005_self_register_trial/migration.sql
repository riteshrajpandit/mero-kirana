-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Shop_subscriptionStatus_trialEndsAt_idx" ON "public"."Shop"("subscriptionStatus", "trialEndsAt");
