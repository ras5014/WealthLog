export interface CreditCardTransaction {
  cardNumber: string; // Optional, used for deduplication and bank identification
  transactionDate: string;
  details: string;
  amount: number;
  type: "Dr" | "Cr";
  referenceNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  bank: string;
  description?: string;
  category?: string;
}

export interface ParsedStatementResult {
  cardHolderName: string;
  cardNumber: string;
  statementStartDate: string;
  statementEndDate: string;
  totalAmountDue: number;
  paymentDueDate?: string;
  minimumAmountDue?: number;
  newTransactions: CreditCardTransaction[];
  duplicateCount: number;
  totalTransactionsParsed: number;
  emiExcludedCount: number;
}
