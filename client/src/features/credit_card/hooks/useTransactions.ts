import { useQuery } from "@tanstack/react-query";
import type { TransactionsResponse } from "../types";
import api from "@/lib/axios";

const getTransactions = async () => {
  const { data } = await api.get<TransactionsResponse>(
    "/credit-card/get-transactions",
  );
  return data;
};

export const useTransactions = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  return { data, isPending, isError };
};
