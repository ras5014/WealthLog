import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreditInfoType } from "../types";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const setCreditInfo = async (data: CreditInfoType) => {
  const response = await api.post("/credit-card/credit-info", data);
  return response.data;
};

export const useSetCreditInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreditInfoType) => setCreditInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-info"] });
      toast.success("Credit info set successfully!");
    },
    onError: (error) => {
      console.error("Error setting credit info:", error);
      toast.error("Failed to set credit info.");
    },
  });
};

const getCreditInfo = async () => {
  const response = await api.get("/credit-card/credit-info");
  return response.data;
};

export const useGetCreditInfo = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["credit-info"],
    queryFn: getCreditInfo,
  });
  return { data, isPending, isError };
};
