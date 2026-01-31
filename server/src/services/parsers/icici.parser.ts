// src/services/parsers/icici.parser.ts

export interface ICICIStatementSummary {
  bank: "ICICI";
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

export const ICICIparseStatementSummary = (
  parsedData: ParsedStatementInput,
): ICICIStatementSummary => {
  /**
   * 1️⃣ Extract statement period
   * Example:
   * for the period November 01, 2025 - November 30, 2025
   */
  const periodRegex =
    /for the period\s+([A-Za-z]+\s+\d{2},\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{2},\s+\d{4})/i;

  const text =
    parsedData.text ??
    parsedData.pages?.map((page) => page.text ?? "").join("\n") ??
    "";

  const periodMatch = text.match(periodRegex);

  if (!periodMatch) {
    throw new Error("ICICI: Statement period not found");
  }

  const [, from, to] = periodMatch;

  /**
   * 2️⃣ Extract ALL balances from transaction rows
   *
   * Transaction rows end with:
   * <amount> <balance>
   * Example:
   * 237.00 54,680.36
   */
  const balanceRegex = /\s([\d,]+\.\d{2})\s*$/gm;

  const balances: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = balanceRegex.exec(text)) !== null) {
    balances.push(parseFloat(match[1].replace(/,/g, "")));
  }

  if (balances.length === 0) {
    throw new Error("ICICI: No balances found");
  }

  /**
   * ✅ Last balance = current balance
   */
  const currentBalance = balances[balances.length - 1];

  return {
    bank: "ICICI",
    statementPeriod: {
      from,
      to,
    },
    currentBalance,
  };
};
