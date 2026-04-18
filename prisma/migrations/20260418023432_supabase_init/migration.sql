-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('CASH', 'CREDIT', 'PAYMENT');

-- CreateEnum
CREATE TYPE "public"."SyncEntityType" AS ENUM ('CUSTOMER', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "public"."SyncOperation" AS ENUM ('UPSERT', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('PENDING', 'FAILED', 'DONE');

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "creditBalancePaisa" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "note" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SyncQueue" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "entityType" "public"."SyncEntityType" NOT NULL,
    "operation" "public"."SyncOperation" NOT NULL,
    "recordId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."SyncStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_createdAt_idx" ON "public"."Shop"("createdAt");

-- CreateIndex
CREATE INDEX "User_shopId_updatedAt_idx" ON "public"."User"("shopId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_shopId_email_key" ON "public"."User"("shopId", "email");

-- CreateIndex
CREATE INDEX "Customer_shopId_updatedAt_idx" ON "public"."Customer"("shopId", "updatedAt");

-- CreateIndex
CREATE INDEX "Customer_shopId_phone_idx" ON "public"."Customer"("shopId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_shopId_key" ON "public"."Customer"("id", "shopId");

-- CreateIndex
CREATE INDEX "Transaction_shopId_occurredAt_idx" ON "public"."Transaction"("shopId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transaction_shopId_updatedAt_idx" ON "public"."Transaction"("shopId", "updatedAt");

-- CreateIndex
CREATE INDEX "Transaction_shopId_customerId_idx" ON "public"."Transaction"("shopId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_id_shopId_key" ON "public"."Transaction"("id", "shopId");

-- CreateIndex
CREATE INDEX "SyncQueue_shopId_status_nextAttemptAt_idx" ON "public"."SyncQueue"("shopId", "status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "SyncQueue_shopId_entityType_recordId_idx" ON "public"."SyncQueue"("shopId", "entityType", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncQueue_id_shopId_key" ON "public"."SyncQueue"("id", "shopId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SyncQueue" ADD CONSTRAINT "SyncQueue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
