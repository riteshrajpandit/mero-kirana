"use client";

import { db } from "@/lib/offline/db";

export async function clearOfflineDataForOtherShops(activeShopId: string) {
  await db.transaction("rw", db.customers, db.transactions, db.syncQueue, async () => {
    await db.customers.where("shopId").notEqual(activeShopId).delete();
    await db.transactions.where("shopId").notEqual(activeShopId).delete();
    await db.syncQueue.where("shopId").notEqual(activeShopId).delete();
  });
}

export async function clearAllOfflineData() {
  await db.transaction("rw", db.customers, db.transactions, db.syncQueue, async () => {
    await db.customers.clear();
    await db.transactions.clear();
    await db.syncQueue.clear();
  });
}
