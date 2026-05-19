import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type TotalSpendsCacheResponse = {
  lastMonthSameTimeSpend: number;
};

const updateTotalSpendsCache = async (totalSpends: number) => {
  const { data } = await api.post<TotalSpendsCacheResponse>(
    "/credit-card/total-spends-cache",
    { totalSpends },
  );
  return data;
};

export const useTotalSpendsCache = (totalSpends: number, enabled: boolean) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["total-spends-cache", totalSpends],
    queryFn: () => updateTotalSpendsCache(totalSpends),
    enabled,
  });

  return { data, isPending, isError };
};
