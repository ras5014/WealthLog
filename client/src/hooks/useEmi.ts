import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const getEmis = async () => {
  const response = await api.get("/emi/get-emi-info");
  return response.data;
};

export const useEmi = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["emis"],
    queryFn: getEmis,
  });

  return { data, isPending, isError };
};
