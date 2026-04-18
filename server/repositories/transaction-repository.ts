import type { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";

export type TransactionCreateRecord = {
  id: string;
  customerId?: string | null;
  type: "CASH" | "CREDIT" | "PAYMENT";
  amountPaisa: number;
  note: string | null;
  occurredAt: Date;
  version: number;
  updatedAt: Date;
};

export async function listTransactionsByShop(shopId: string) {
  return prisma.transaction.findMany({
    where: { shopId },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });
}

export async function findTransactionByIdForShop(shopId: string, id: string) {
  return prisma.transaction.findUnique({
    where: {
      id_shopId: {
        id,
        shopId,
      },
    },
  });
}

export async function createTransactionForShop(
  shopId: string,
  input: TransactionCreateRecord,
) {
  return prisma.transaction.create({
    data: {
      id: input.id,
      shopId,
      customerId: input.customerId,
      type: input.type,
      amountPaisa: input.amountPaisa,
      note: input.note,
      occurredAt: input.occurredAt,
      version: input.version,
      updatedAt: input.updatedAt,
    },
  });
}

export async function updateTransactionForShop(
  shopId: string,
  id: string,
  input: Prisma.TransactionUncheckedUpdateInput,
) {
  return prisma.transaction.update({
    where: {
      id_shopId: {
        id,
        shopId,
      },
    },
    data: input,
  });
}