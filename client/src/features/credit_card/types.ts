import z from "zod";

export type CreditCardTransaction = {
  id: string;
  transactionDate: string;
  details: string;
  amount: string | number;
  type: "Dr" | "Cr";
  referenceNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  bank: string;
  description?: string;
  category?: string;
};

export type TransactionsResponse = {
  transactions: CreditCardTransaction[];
  totalDayPassed: number;
};

export type TotalSpentProps = {
  totalSpendsAllBanks?: number;
  totalSpent?: number;
  burnRatePerDay?: number;
  lastMonthSameTimeSpend?: number;
  billingCycleStartDate?: string;
  billingCycleEndDate?: string;
  lastMonthBill?: number;
  dueDate?: string;
  lastMonthBillStatus?: "paid" | "pending" | "overdue";
  totalEmiAmount?: number;
};

export const CreditInfoSchema = z.object({
  amount: z.number().min(0, "Amount must be a positive number"),
});

export type CreditInfoType = z.infer<typeof CreditInfoSchema>;

export type BankDetailSchema = {
  bank: string;
  totalAmountDue: number;
  billingCycleStartDate: string;
  billingCycleEndDate: string;
  paymentDueDate?: string;
  statementEndDate?: string;
};

export type AddToEMIType = {
  bank: string;
  referenceNumber: string;
  statementStartDate: string;
};

export type UpdateTransactionCategoryType = {
  id: string | number;
  category: string;
};
