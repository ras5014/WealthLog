import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const getTransactions = async () => {
  const { data } = await axios.get(
    "http://localhost:8080/api/v1/credit-card/get-transactions",
  );
  return data;
};

export const useTransactions = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  return { data, isPending, isError };
};
