export interface CreditCardTransaction {
  transactionDate: string;
  details: string;
  amount: number;
  type: "Dr" | "Cr";
  referenceNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  bank: string;
  description?: string;
}

export interface ParsedStatementResult {
  statementStartDate: string;
  statementEndDate: string;
  totalAmountDue: number;
  newTransactions: CreditCardTransaction[];
  duplicateCount: number;
  totalTransactionsParsed: number;
  emiExcludedCount: number;
}
