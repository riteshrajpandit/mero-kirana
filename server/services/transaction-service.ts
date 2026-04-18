import type { Transaction } from "@prisma/client";

import {
  createTransactionForShop,
  findTransactionByIdForShop,
  listTransactionsByShop,
  updateTransactionForShop,
} from "@/server/repositories/transaction-repository";
import type { CreateTransactionInput } from "@/server/validation/transaction";

export type TransactionMergeStatus = "created" | "updated" | "ignored_stale";

function parseIncomingDate(input?: string) {
  return input ? new Date(input) : new Date();
}

export async function getTransactionsForShop(
  shopId: string,
  options?: {
    limit?: number;
    cursor?: string | null;
  },
) {
  return listTransactionsByShop(shopId, options);
}

export async function mergeTransactionForShop(
  shopId: string,
  input: CreateTransactionInput,
): Promise<{ status: TransactionMergeStatus; record: Transaction }> {
  const incomingUpdatedAt = parseIncomingDate(input.updatedAt);
  const occurredAt = parseIncomingDate(input.occurredAt);
  const incomingId = input.id ?? crypto.randomUUID();
  const existing = await findTransactionByIdForShop(shopId, incomingId);

  if (!existing) {
    const created = await createTransactionForShop(shopId, {
      id: incomingId,
      customerId: input.customerId ?? null,
      type: input.type,
      amountPaisa: input.amountPaisa,
      note: input.note ?? null,
      occurredAt,
      version: input.version ?? 1,
      updatedAt: incomingUpdatedAt,
    });

    return { status: "created", record: created };
  }

  if (incomingUpdatedAt <= existing.updatedAt) {
    console.warn("Ignored stale transaction write", {
      shopId,
      id: incomingId,
      incomingUpdatedAt,
      currentUpdatedAt: existing.updatedAt,
    });

    return { status: "ignored_stale", record: existing };
  }

  const updated = await updateTransactionForShop(shopId, incomingId, {
    customerId: input.customerId ?? null,
    type: input.type,
    amountPaisa: input.amountPaisa,
    note: input.note ?? null,
    occurredAt,
    version: Math.max(existing.version + 1, input.version ?? existing.version + 1),
    updatedAt: incomingUpdatedAt,
  });

  return { status: "updated", record: updated };
}