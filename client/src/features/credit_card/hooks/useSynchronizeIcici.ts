import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const synchronizeIciciStatement = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    "/credit-card/synchronize-icici",
    formData,
  );

  return data;
};

export const useSynchronizeIcici = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: synchronizeIciciStatement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bankDetails"] });
      toast.success("Statement synchronized successfully!");
    },
    onError: (error) => {
      console.error("Error synchronizing ICICI statement:", error);
      toast.error("Failed to synchronize statement.");
    },
  });
};
