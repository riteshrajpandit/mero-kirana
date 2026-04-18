"use client";

import { db } from "@/lib/offline/db";
import { fetchWithCsrf } from "@/lib/client/csrf-token";
import type { CustomerRecord, SyncQueueItem, TransactionRecord } from "@/types/shared";

type SyncResponse = {
  ok: boolean;
  error?: string;
};

type SyncEngineOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
};

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY_MS = 1000;

export class SyncEngine {
  private isRunning = false;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(
    private readonly shopId: string,
    options: SyncEngineOptions = {},
  ) {
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  }

  private computeDelayMs(retryCount: number) {
    return this.baseDelayMs * 2 ** retryCount;
  }

  private buildRequestBody(item: SyncQueueItem) {
    if (item.entity === "customer") {
      const payload = item.payload as CustomerRecord;

      return {
        id: payload.id,
        name: payload.name,
        phone: payload.phone,
        creditBalancePaisa: payload.creditBalancePaisa,
        updatedAt: payload.updatedAt,
        version: payload.version,
      };
    }

    const payload = item.payload as TransactionRecord;

    return {
      id: payload.id,
      customerId: payload.customerId,
      type: payload.type,
      amountPaisa: payload.amountPaisa,
      note: payload.note,
      occurredAt: payload.occurredAt,
      updatedAt: payload.updatedAt,
      version: payload.version,
    };
  }

  private async push(item: SyncQueueItem): Promise<SyncResponse> {
    const endpoint =
      item.entity === "customer" ? "/api/customers" : "/api/transactions";

    try {
      const response = await fetchWithCsrf(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.buildRequestBody(item)),
      });

      if (response.ok) {
        return { ok: true };
      }

      if (response.status === 403) {
        return {
          ok: false,
          error: "CSRF token invalid or expired",
        };
      }

      const message = await response.text();
      return {
        ok: false,
        error: message || `Sync failed with status ${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network request failed",
      };
    }
  }

  private async markRecordSynced(item: SyncQueueItem) {
    const now = new Date().toISOString();

    if (item.entity === "customer") {
      await db.customers.update(item.recordId, {
        isSynced: true,
        updatedAt: now,
      });
      return;
    }

    await db.transactions.update(item.recordId, {
      isSynced: true,
      updatedAt: now,
    });
  }

  private async markRetry(item: SyncQueueItem, error: string) {
    const retryCount = item.retryCount + 1;
    const now = Date.now();

    if (retryCount > this.maxRetries) {
      await db.syncQueue.update(item.id, {
        retryCount,
        status: "failed",
        lastError: error,
        updatedAt: new Date(now).toISOString(),
      });
      return;
    }

    const delay = this.computeDelayMs(retryCount);
    await db.syncQueue.update(item.id, {
      retryCount,
      status: "pending",
      nextAttemptAt: new Date(now + delay).toISOString(),
      lastError: error,
      updatedAt: new Date(now).toISOString(),
    });
  }

  private async processItem(item: SyncQueueItem) {
    const result = await this.push(item);

    if (result.ok) {
      await db.transaction("rw", db.syncQueue, db.customers, db.transactions, async () => {
        await this.markRecordSynced(item);
        await db.syncQueue.delete(item.id);
      });
      return;
    }

    await this.markRetry(item, result.error ?? "Unknown sync error");
  }

  async runOnce() {
    if (this.isRunning || !navigator.onLine) {
      return;
    }

    this.isRunning = true;

    try {
      const nowIso = new Date().toISOString();
      const queued = await db.syncQueue.where("shopId").equals(this.shopId).toArray();
      const readyItems = queued
        .filter((item) => item.status === "pending" && item.nextAttemptAt <= nowIso)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      for (const item of readyItems) {
        await this.processItem(item);
      }
    } finally {
      this.isRunning = false;
    }
  }
}