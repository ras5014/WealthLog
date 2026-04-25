import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import type { EmiDashboardData, EmiInfoItem } from "@/features/emis/type";

const getEmiDashboard = async (): Promise<EmiDashboardData> => {
  const response = await api.get("/emi/get-emi-dashboard");
  return response.data;
};

const getEmiInfo = async (): Promise<EmiInfoItem[]> => {
  const response = await api.get("/emi/get-emi-info");
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
