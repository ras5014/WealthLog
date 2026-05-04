import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddToEMIType } from "../types";
import toast from "react-hot-toast";

const addToEMI = async (data: AddToEMIType) => {
  const response = await api.post("/emi/add-to-emi", data);
  return response.data;
};

export const useAddToEMI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToEMIType) => addToEMI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction added to EMI successfully!");
    },
    onError: (error) => {
      console.error("Error adding transaction to EMI:", error);
      toast.error("Failed to add transaction to EMI.");
    },
  });
};
