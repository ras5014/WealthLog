import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const getBankDetails = async () => {
  const result = await api.get("/credit-card/get-credit-card-bank-details");
  return result.data;
};

export const useBankDetails = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["bankDetails"],
    queryFn: getBankDetails,
  });
  return { data, isPending, isError };
};
