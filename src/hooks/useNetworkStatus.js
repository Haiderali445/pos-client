import { useEffect, useState, useCallback } from "react";
import posDb from "../db/posDatabase";
import syncEngine from "../services/syncEngine";

/**
 * Custom React Hook providing real-time network connectivity
 * and offline sync queue telemetry.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await posDb.getPendingSyncCount();
      setPendingCount(count);
    } catch (err) {
      console.warn("Could not read pending sync count:", err);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    const handleQueueChange = () => {
      refreshPendingCount();
    };

    const handleSyncStatus = (event) => {
      const detail = event.detail || {};
      if (typeof detail.isSyncing === "boolean") {
        setIsSyncing(detail.isSyncing);
      }
      refreshPendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pos:offline-queue-updated", handleQueueChange);
    window.addEventListener("pos:sync-status", handleSyncStatus);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pos:offline-queue-updated", handleQueueChange);
      window.removeEventListener("pos:sync-status", handleSyncStatus);
    };
  }, [refreshPendingCount]);

  const syncNow = useCallback(async () => {
    return await syncEngine.syncPendingBills({ silent: false });
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
  };
}

export default useNetworkStatus;
