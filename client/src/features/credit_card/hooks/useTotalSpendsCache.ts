import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

type TotalSpendsCacheResponse = {
  lastMonthSameTimeSpend: number;
};

const LAST_RUN_DATE_KEY = "credit-card:total-spends-cache:last-run-date";
const LAST_SYNC_VERSION_KEY = "credit-card:total-spends-cache:last-sync-version";
const RESPONSE_KEY = "credit-card:total-spends-cache:response";
export const TOTAL_SPENDS_SYNC_VERSION_KEY = "credit-card:total-spends-sync-version";
export const TOTAL_SPENDS_SYNC_VERSION_EVENT = "credit-card-total-spends-sync-version";

const getTodayKey = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

const updateTotalSpendsCache = async (totalSpends: number) => {
  const { data } = await api.post<TotalSpendsCacheResponse>(
    "/credit-card/total-spends-cache",
    { totalSpends },
  );
  return data;
};

const getStoredResponse = () => {
  const storedResponse = localStorage.getItem(RESPONSE_KEY);
  if (!storedResponse) return undefined;

  try {
    return JSON.parse(storedResponse) as TotalSpendsCacheResponse;
  } catch {
    return undefined;
  }
};

export const markTotalSpendsCacheForSync = () => {
  localStorage.setItem(TOTAL_SPENDS_SYNC_VERSION_KEY, String(Date.now()));
  window.dispatchEvent(new Event(TOTAL_SPENDS_SYNC_VERSION_EVENT));
};

export const useTotalSpendsCache = (totalSpends: number, enabled: boolean) => {
  const [data, setData] = useState<TotalSpendsCacheResponse | undefined>(
    getStoredResponse,
  );
  const [syncVersion, setSyncVersion] = useState(
    () => localStorage.getItem(TOTAL_SPENDS_SYNC_VERSION_KEY) ?? "",
  );

  const {
    mutate,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateTotalSpendsCache,
    onSuccess: (response) => {
      const todayKey = getTodayKey();
      localStorage.setItem(LAST_RUN_DATE_KEY, todayKey);
      localStorage.setItem(LAST_SYNC_VERSION_KEY, syncVersion);
      localStorage.setItem(RESPONSE_KEY, JSON.stringify(response));
      setData(response);
    },
  });

  useEffect(() => {
    const updateSyncVersion = () => {
      setSyncVersion(localStorage.getItem(TOTAL_SPENDS_SYNC_VERSION_KEY) ?? "");
    };

    window.addEventListener(TOTAL_SPENDS_SYNC_VERSION_EVENT, updateSyncVersion);
    window.addEventListener("storage", updateSyncVersion);

    return () => {
      window.removeEventListener(
        TOTAL_SPENDS_SYNC_VERSION_EVENT,
        updateSyncVersion,
      );
      window.removeEventListener("storage", updateSyncVersion);
    };
  }, []);

  useEffect(() => {
    if (!enabled || isPending) return;

    const todayKey = getTodayKey();
    const lastRunDate = localStorage.getItem(LAST_RUN_DATE_KEY);
    const lastSyncVersion = localStorage.getItem(LAST_SYNC_VERSION_KEY) ?? "";

    if (lastRunDate === todayKey && lastSyncVersion === syncVersion) return;

    mutate(totalSpends);
  }, [enabled, isPending, mutate, syncVersion, totalSpends]);

  return { data, isPending, isError };
};
