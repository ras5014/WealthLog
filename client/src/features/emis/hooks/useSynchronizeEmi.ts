import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

const synchronizeEmiIcici = async ({
  file,
  bank,
}: {
  file: File;
  bank: string;
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bank", bank);

  const { data } = await api.post("/emi/synchronize-emi-icici", formData);

  return data;
};

type AutoSyncEmiOptions = {
  autoLogin: boolean;
  bank: string;
  expectedDownloads: number;
};

const autoSyncEmiStatements = async (options: AutoSyncEmiOptions) => {
  const { data } = await api.post("/emi/auto-sync-emi-icici", options);

  return data;
};

export const useSynchronizeEmi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: synchronizeEmiIcici,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["emi-info"] });
      toast.success("EMI statement synchronized successfully!");
    },
    onError: (error) => {
      console.error("Error synchronizing EMI statement:", error);
      toast.error("Failed to synchronize EMI statement.");
    },
  });
};

export const useAutoSyncEmi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autoSyncEmiStatements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["emi-info"] });
      toast.success("EMI statements auto synchronized successfully!");
    },
    onError: (error) => {
      console.error("Error auto synchronizing EMI statements:", error);
      const message =
        axios.isAxiosError<{ error?: string }>(error) &&
        error.response?.data.error
          ? error.response.data.error
          : "Failed to auto synchronize EMI statements.";
      toast.error(message);
    },
  });
};
