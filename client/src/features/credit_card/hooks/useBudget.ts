import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BudgetType } from "../types";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const setBudget = async (data: BudgetType) => {
  const response = await api.post("/credit-card/budget", data);
  return response.data;
};

export const useSetBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetType) => setBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Budget set successfully!");
    },
    onError: (error) => {
      console.error("Error setting budget:", error);
      toast.error("Failed to set budget.");
    },
  });
};

const getBudget = async () => {
  const response = await api.get("/credit-card/budget");
  return response.data;
};

export const useGetBudget = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["budget"],
    queryFn: getBudget,
  });
  return { data, isPending, isError };
};
