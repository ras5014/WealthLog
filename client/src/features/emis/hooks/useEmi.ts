import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCustomEmiInput,
  EmiDashboardData,
  EmiInfoItem,
  UpdateEmiDescriptionInput,
} from "@/features/emis/type";
import toast from "react-hot-toast";

const getEmiDashboard = async (): Promise<EmiDashboardData> => {
  const response = await api.get("/emi/get-emi-dashboard");
  return response.data;
};

const getEmiInfo = async (): Promise<EmiInfoItem[]> => {
  const response = await api.get("/emi/get-emi-info");
  return response.data;
};

const createCustomEmi = async (input: CreateCustomEmiInput) => {
  const response = await api.post("/emi/custom-emi", input);
  return response.data;
};

const deleteEmi = async (id: string) => {
  const response = await api.delete(`/emi/${id}`);
  return response.data;
};

const updateEmiDescription = async ({
  id,
  description,
}: UpdateEmiDescriptionInput) => {
  const response = await api.patch(`/emi/${id}/description`, { description });
  return response.data;
};

export const useEmiDashboard = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["emi-dashboard"],
    queryFn: getEmiDashboard,
  });

  return { data, isPending, isError };
};

export const useEmiInfo = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["emi-info"],
    queryFn: getEmiInfo,
  });

  return { data, isPending, isError };
};

export const useCreateCustomEmi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomEmi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["emi-info"] });
      toast.success("Custom EMI added.");
    },
    onError: (error) => {
      console.error("Error creating custom EMI:", error);
      toast.error("Failed to add custom EMI.");
    },
  });
};

export const useDeleteEmi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["emi-info"] });
      toast.success("EMI deleted.");
    },
    onError: (error) => {
      console.error("Error deleting EMI:", error);
      toast.error("Failed to delete EMI.");
    },
  });
};

export const useUpdateEmiDescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmiDescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi-info"] });
      queryClient.invalidateQueries({ queryKey: ["emi-dashboard"] });
      toast.success("EMI description updated.");
    },
    onError: (error) => {
      console.error("Error updating EMI description:", error);
      toast.error("Failed to update EMI description.");
    },
  });
};
