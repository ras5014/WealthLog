export type EmiScheduleItem = {
  paymentStatus: string;
  installmentAmount: number;
};

export type EmiItem = {
  totalAmount: string;
  amortizationSchedule: EmiScheduleItem[];
};

export type EmiRecord = {
  id: string;
  label: string;
  totalAmount: { description: string; amount: number }[] | null;
};

export type AmortizationScheduleItem = {
  emiNo: number;
  transactionStatus: "POST" | "NEW";
  paymentDate: string;
  principalAmount: number;
  interestAmount: number;
  installmentAmount: number;
  paymentStatus?: "paid" | "pending";
};

export type EmiInfoItem = {
  id: string;
  bank: string;
  description: string | null;
  merchant: string | null;
  totalAmount: string | null;
  amortizationSchedule: AmortizationScheduleItem[] | null;
};

export type CreateCustomEmiInput = {
  bank: string;
  description: string;
  merchant?: string;
  totalAmount: number;
  installmentAmount: number;
  installmentCount: number;
  firstPaymentDate: string;
  paidInstallments: number;
};

export type UpdateEmiDescriptionInput = {
  id: string;
  description: string;
};

export type EmiDashboardData = {
  emiRecords: EmiRecord[];
  totalLoanAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
};

export type TotalLoanProps = Readonly<{
  totalLoanAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
}>;
