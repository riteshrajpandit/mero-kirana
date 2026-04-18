"use client";

import Dexie, { type Table } from "dexie";

import type {
  CustomerRecord,
  SyncQueueItem,
  TransactionRecord,
} from "@/types/shared";

class MeroKiranaDexie extends Dexie {
  customers!: Table<CustomerRecord, string>;
  transactions!: Table<TransactionRecord, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("mero-kirana-db");

    this.version(1).stores({
      customers: "id, shopId, isSynced, updatedAt, name, phone",
      transactions: "id, shopId, isSynced, updatedAt, customerId, type, occurredAt",
      syncQueue:
        "id, shopId, entity, operation, status, nextAttemptAt, recordId, createdAt",
    });
  }
}

export const db = new MeroKiranaDexie();