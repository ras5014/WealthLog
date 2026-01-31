// src/services/parsers/sbi.parser.ts

export interface SBIStatementSummary {
  bank: "SBI";
  statementPeriod: {
    from: string;
    to: string;
  };
  currentBalance: number;
}

type ParsedStatementInput = {
  text?: string;
  pages?: Array<{ text?: string; num?: number }>;
};

const extractText = (parsedData: ParsedStatementInput) => {
  if (parsedData?.text && parsedData.text.trim()) return parsedData.text;
  if (Array.isArray(parsedData?.pages)) {
    return parsedData.pages.map((page) => page?.text ?? "").join("\n");
  }
  return "";
};

export const SBIparseStatementSummary = (
  parsedData: ParsedStatementInput,
): SBIStatementSummary => {
  const text = extractText(parsedData);
  /**
   * 1️⃣ Extract statement period
   * Example:
   * Statement From : 01-12-2025 to 31-12-2025
   */
  const periodRegex =
    /Statement\s+From\s*:\s*(\d{2}-\d{2}-\d{4})\s+to\s+(\d{2}-\d{2}-\d{4})/i;

  const periodMatch = text.match(periodRegex);

  if (!periodMatch) {
    throw new Error("SBI: Statement period not found");
  }

  const [, from, to] = periodMatch;

  /**
   * 2️⃣ Extract closing balance
   * Example:
   * Closing Balance
   * 6,620.62CR
   */
  const closingBalanceRegex = /Closing\s+Balance\s+([\d,]+\.\d{2})(CR|DR)/i;

  const closingBalanceMatch = text.match(closingBalanceRegex);

  if (!closingBalanceMatch) {
    throw new Error("SBI: Closing balance not found");
  }

  const amount = parseFloat(closingBalanceMatch[1].replace(/,/g, ""));

  const balanceType = closingBalanceMatch[2];

  const currentBalance = balanceType === "DR" ? -amount : amount;

  return {
    bank: "SBI",
    statementPeriod: {
      from,
      to,
    },
    currentBalance,
  };
};
