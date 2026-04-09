import z from "zod";

export type CreditCardTransaction = {
  id: number;
  transactionDate: string;
  details: string;
  amount: string | number;
  type: "Dr" | "Cr";
  referenceNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  bank: string;
};

export type TransactionsResponse = {
  transactions: CreditCardTransaction[];
  totalDayPassed: number;
};

export type TotalSpentProps = {
  totalSpent?: number;
  burnRatePerDay?: number;
  lastMonthSameTimeSpend?: number;
  billingCycleStartDate?: string;
  billingCycleEndDate?: string;
  lastMonthBill?: number;
  dueDate?: string;
  lastMonthBillStatus?: "paid" | "pending" | "overdue";
};

export const CreditInfoSchema = z.object({
  amount: z.number().min(0, "Amount must be a positive number"),
});

export type CreditInfoType = z.infer<typeof CreditInfoSchema>;
