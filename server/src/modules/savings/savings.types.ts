export type SavingsTransactionType = "Withdrawal" | "Deposit" | "Unknown";

export type SavingsTransaction = {
  serialNumber: number;
  transactionDate: string;
  transactionDateIso: string;
  chequeNumber: string | null;
  transactionRemarks: string;
  withdrawalAmount: number | null;
  depositAmount: number | null;
  balance: number;
  transactionType: SavingsTransactionType;
  referenceNumber: string | null;
};

export type SavingsStatementInfo = {
  accountNumber: string;
  currency: string;
  statementStartDate: string;
  statementEndDate: string;
  accountHolderName: string | null;
  accountHolderAddress: string[];
  baseBranch: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  totalWithdrawals: number;
  totalDeposits: number;
};

export type ParsedSavingsStatementResult = {
  statementInfo: SavingsStatementInfo;
  transactions: SavingsTransaction[];
  transactionCount: number;
  insertedTransactionCount: number;
  duplicateTransactionCount: number;
};
