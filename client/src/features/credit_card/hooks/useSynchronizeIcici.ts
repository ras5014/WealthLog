import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { markTotalSpendsCacheForSync } from "./useTotalSpendsCache";

type SynchronizeIciciStatementInput = {
  file: File;
  bank?: string;
};

const synchronizeIciciStatement = async ({
  file,
  bank,
}: SynchronizeIciciStatementInput) => {
  const formData = new FormData();
  formData.append("file", file);
  if (bank) {
    formData.append("bank", bank);
  }

  const { data } = await api.post(
    "/credit-card/synchronize-icici",
    formData,
  );

  return data;
};

type AutoSyncIciciOptions = {
  autoLogin: boolean;
};

const autoSyncIciciStatements = async (options: AutoSyncIciciOptions) => {
  const { data } = await api.post("/credit-card/auto-sync-icici", options);

  return data;
};

export const useSynchronizeIcici = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: synchronizeIciciStatement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      markTotalSpendsCacheForSync();
      queryClient.invalidateQueries({ queryKey: ["bankDetails"] });
      toast.success("Statement synchronized successfully!");
    },
    onError: (error) => {
      console.error("Error synchronizing ICICI statement:", error);
      const message =
        axios.isAxiosError<{ error?: string }>(error) &&
        error.response?.data.error === "BANK_SELECTION_REQUIRED"
          ? "Select a bank for this previous statement."
          : "Failed to synchronize statement.";
      toast.error(message);
    },
  });
};

export const useAutoSyncIcici = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autoSyncIciciStatements,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      markTotalSpendsCacheForSync();
      queryClient.invalidateQueries({ queryKey: ["bankDetails"] });
      toast.success("ICICI statements auto synchronized successfully!");
    },
    onError: (error) => {
      console.error("Error auto synchronizing ICICI statements:", error);
      const message =
        axios.isAxiosError<{ error?: string }>(error) &&
        error.response?.data.error
          ? error.response.data.error
          : "Failed to auto synchronize ICICI statements.";
      toast.error(message);
    },
  });
};
