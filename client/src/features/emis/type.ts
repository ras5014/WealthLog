export type EmiScheduleItem = {
  paymentStatus: string;
  installmentAmount: number;
};

export type EmiItem = {
  totalAmount: string;
  amortizationSchedule: EmiScheduleItem[];
};

export type TotalLoanProps = Readonly<{
  totalLoanAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
}>;
