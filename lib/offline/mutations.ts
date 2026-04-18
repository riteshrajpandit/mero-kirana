"use client";

import { db } from "@/lib/offline/db";
import type {
  CustomerRecord,
  SyncEntity,
  SyncQueueItem,
  TransactionRecord,
  TransactionType,
} from "@/types/shared";

const nowIso = () => new Date().toISOString();

async function upsertQueueItem(
  shopId: string,
  entity: SyncEntity,
  recordId: string,
  payload: CustomerRecord | TransactionRecord,
) {
  const now = nowIso();
  const existing = await db.syncQueue
    .where("shopId")
    .equals(shopId)
    .filter((item) => item.entity === entity && item.recordId === recordId)
    .first();

  if (existing) {
    await db.syncQueue.update(existing.id, {
      payload,
      status: "pending",
      nextAttemptAt: now,
      updatedAt: now,
      lastError: undefined,
    });
    return;
  }

  const queueItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    shopId,
    entity,
    operation: "upsert",
    recordId,
    payload,
    status: "pending",
    retryCount: 0,
    nextAttemptAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db.syncQueue.add(queueItem);
}

export async function createLocalCustomer(input: {
  shopId: string;
  name: string;
  phone?: string;
}) {
  const now = nowIso();
  const customer: CustomerRecord = {
    id: crypto.randomUUID(),
    shopId: input.shopId,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    creditBalancePaisa: 0,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  await db.transaction("rw", db.customers, db.syncQueue, async () => {
    await db.customers.put(customer);
    await upsertQueueItem(input.shopId, "customer", customer.id, customer);
  });

  return customer;
}

export async function createLocalTransaction(input: {
  shopId: string;
  amountPaisa: number;
  type: TransactionType;
  customerId?: string;
  note?: string;
}) {
  const now = nowIso();
  const transaction: TransactionRecord = {
    id: crypto.randomUUID(),
    shopId: input.shopId,
    amountPaisa: input.amountPaisa,
    type: input.type,
    customerId: input.customerId ?? null,
    note: input.note?.trim() || null,
    occurredAt: now,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  await db.transaction(
    "rw",
    db.transactions,
    db.customers,
    db.syncQueue,
    async () => {
      await db.transactions.put(transaction);
      await upsertQueueItem(input.shopId, "transaction", transaction.id, transaction);

      if (!input.customerId) {
        return;
      }

      const customer = await db.customers.get(input.customerId);
      if (!customer || customer.shopId !== input.shopId) {
        return;
      }

      const delta =
        input.type === "CREDIT"
          ? input.amountPaisa
          : input.type === "PAYMENT"
            ? -input.amountPaisa
            : 0;

      if (delta === 0) {
        return;
      }

      const updatedCustomer: CustomerRecord = {
        ...customer,
        creditBalancePaisa: Math.max(0, customer.creditBalancePaisa + delta),
        isSynced: false,
        updatedAt: now,
        version: customer.version + 1,
      };

      await db.customers.put(updatedCustomer);
      await upsertQueueItem(
        input.shopId,
        "customer",
        updatedCustomer.id,
        updatedCustomer,
      );
    },
  );

  return transaction;
}