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

/**
 * Safely extracts full text from parsed PDF
 */
const extractText = (parsedData: ParsedStatementInput): string => {
  if (parsedData?.text?.trim()) return parsedData.text;

  if (Array.isArray(parsedData?.pages)) {
    return parsedData.pages.map((page) => page?.text ?? "").join("\n");
  }

  return "";
};

/**
 * Converts amount + CR/DR to signed number
 */
const parseSignedAmount = (amount: string, type: string): number => {
  const value = parseFloat(amount.replace(/,/g, ""));
  return type.toUpperCase() === "DR" ? -value : value;
};

export const SBIparseStatementSummary = (
  parsedData: ParsedStatementInput,
): SBIStatementSummary => {
  const text = extractText(parsedData);

  /* -----------------------------------------------------
   * 1️⃣ Extract statement period
   * Example:
   * Statement From : 01-01-2026 to 31-01-2026
   * --------------------------------------------------- */
  const periodRegex =
    /Statement\s+From\s*:\s*(\d{2}-\d{2}-\d{4})\s+to\s+(\d{2}-\d{2}-\d{4})/i;

  const periodMatch = text.match(periodRegex);

  if (!periodMatch) {
    throw new Error("SBI: Statement period not found");
  }

  const [, from, to] = periodMatch;

  /* -----------------------------------------------------
   * 2️⃣ Extract CURRENT balance (priority based)
   *
   * Priority:
   * 1. Clear Balance
   * 2. Closing Balance (₹)
   * 3. Last transaction balance (fallback)
   * --------------------------------------------------- */

  // ✅ Priority 1: Clear Balance (BEST & most reliable)
  const clearBalanceRegex = /Clear\s+Balance\s*:\s*([\d,]+\.\d{2})(CR|DR)/i;

  const clearBalanceMatch = text.match(clearBalanceRegex);

  if (clearBalanceMatch) {
    const [, amount, type] = clearBalanceMatch;

    return {
      bank: "SBI",
      statementPeriod: { from, to },
      currentBalance: parseSignedAmount(amount, type),
    };
  }

  // ✅ Priority 2: Closing Balance from summary table
  const closingBalanceRegex =
    /Closing\s+Balance\s*\(₹\)\s*([\d,]+\.\d{2})(CR|DR)/i;

  const closingBalanceMatch = text.match(closingBalanceRegex);

  if (closingBalanceMatch) {
    const [, amount, type] = closingBalanceMatch;

    return {
      bank: "SBI",
      statementPeriod: { from, to },
      currentBalance: parseSignedAmount(amount, type),
    };
  }

  // ✅ Priority 3: Last transaction balance (fallback)
  // Matches the LAST balance column value in the statement
  const balanceColumnRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})\s*$/gm;

  const allBalances = [...text.matchAll(balanceColumnRegex)];

  if (allBalances.length > 0) {
    const lastBalance = allBalances[allBalances.length - 1][1];

    return {
      bank: "SBI",
      statementPeriod: { from, to },
      currentBalance: parseFloat(lastBalance.replace(/,/g, "")),
    };
  }

  throw new Error("SBI: Unable to determine current balance");
};
