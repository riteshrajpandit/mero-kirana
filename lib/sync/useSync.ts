"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SyncEngine } from "@/lib/sync/engine";
import { useOffline } from "@/lib/sync/useOffline";

const SYNC_INTERVAL_MS = 15000;

export function useSync(shopId: string) {
  const { isOnline } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const syncEngine = useMemo(() => new SyncEngine(shopId), [shopId]);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return;
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      await syncEngine.runOnce();
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, syncEngine]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const initialTimer = window.setTimeout(() => {
      void syncNow();
    }, 0);

    const timer = window.setInterval(() => {
      void syncNow();
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [isOnline, syncNow]);

  useEffect(() => {
    const onOnline = () => {
      void syncNow();
    };

    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [syncNow]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    lastError,
    syncNow,
  };
}