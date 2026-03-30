export interface CreditCardTransaction {
  transactionDate: string;
  details: string;
  amount: number;
  type: "Dr" | "Cr";
  referenceNumber: string;
  statementPeriod: string;
}

export interface ParsedStatementResult {
  statementPeriod: string;
  statementStartDate: string;
  statementEndDate: string;
  totalAmountDue: number;
  newTransactions: CreditCardTransaction[];
  duplicateCount: number;
  totalTransactionsParsed: number;
  emiExcludedCount: number;
}
