import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateTransactionCategoryType } from "../types";
import toast from "react-hot-toast";

const updateTransactionCategory = async ({
  id,
  category,
}: UpdateTransactionCategoryType) => {
  const response = await api.patch(`/credit-card/transactions/${id}/category`, {
    category,
  });
  return response.data;
};

export const useUpdateTransactionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransactionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Category updated.");
    },
    onError: (error) => {
      console.error("Error updating transaction category:", error);
      toast.error("Failed to update category.");
    },
  });
};
