import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const getSavingstransactions = async () => {
  const { data } = await api.get("/savings/get-Savings-account-info");
  return data;
};

export const useSavingsTransactions = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["savings-transactions"],
    queryFn: getSavingstransactions,
  });
  return { data, isPending, isError };
};
