export interface HDFCStatementSummary {
  bank: "HDFC";
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

export const HDFCparseStatementSummary = (
  parsedData: ParsedStatementInput,
): HDFCStatementSummary => {
  /**
   * 1️⃣ Extract statement period
   * Example:
   * Statement From : 07/11/25 TO : 06/12/25
   */
  const periodRegex =
    /Statement\s+From\s*:\s*(\d{2}\/\d{2}\/\d{2})\s+TO\s*:\s*(\d{2}\/\d{2}\/\d{2})/i;

  const text = extractText(parsedData);
  const periodMatch = text.match(periodRegex);

  if (!periodMatch) {
    throw new Error("HDFC: Statement period not found");
  }

  const [, from, to] = periodMatch;

  /**
   * 2️⃣ Extract closing balance
   * Appears at the end as:
   * Closing Balance
   * 223.54
   */
  const closingBalanceRegex = /Closing\s+Balance\s*([\d,]+\.\d{2})/gi;

  let closingBalanceMatch;
  let lastMatch: RegExpExecArray | null = null;

  while ((closingBalanceMatch = closingBalanceRegex.exec(text)) !== null) {
    lastMatch = closingBalanceMatch;
  }

  if (!lastMatch) {
    throw new Error("HDFC: Closing balance not found");
  }

  const currentBalance = parseFloat(lastMatch[1].replace(/,/g, ""));

  return {
    bank: "HDFC",
    statementPeriod: {
      from,
      to,
    },
    currentBalance,
  };
};
