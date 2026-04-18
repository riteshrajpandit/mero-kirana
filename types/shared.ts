export type TransactionType = "CASH" | "CREDIT" | "PAYMENT";

export type SyncEntity = "customer" | "transaction";

export type SyncOperation = "upsert";

export type SyncStatus = "pending" | "failed";

export interface OfflineBaseRecord {
  id: string;
  shopId: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CustomerRecord extends OfflineBaseRecord {
  name: string;
  phone?: string | null;
  creditBalancePaisa: number;
}

export interface TransactionRecord extends OfflineBaseRecord {
  customerId?: string | null;
  type: TransactionType;
  amountPaisa: number;
  note?: string | null;
  occurredAt: string;
}

export interface SyncQueueItem {
  id: string;
  shopId: string;
  entity: SyncEntity;
  operation: SyncOperation;
  recordId: string;
  payload: CustomerRecord | TransactionRecord;
  status: SyncStatus;
  retryCount: number;
  nextAttemptAt: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}