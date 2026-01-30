type ParsedStatementInput = {
  text?: string;
  pages?: Array<{ text?: string; num?: number }>;
};

type StatementSummary = {
  accountNumberMasked?: string;
  accountBalance?: number | null;
  statementPeriod?: { from?: string; to?: string };
};

const sanitizeNumber = (value?: string | null) => {
  if (!value) return null;
  const numeric = value.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return numeric ? Number(numeric[0]) : null;
};

const extractText = (parsedData: ParsedStatementInput) => {
  if (parsedData?.text && parsedData.text.trim()) return parsedData.text;
  if (Array.isArray(parsedData?.pages)) {
    return parsedData.pages.map((page) => page?.text ?? "").join("\n");
  }
  return "";
};

export const ICICIparseStatementSummary = (
  parsedData: ParsedStatementInput,
): StatementSummary => {
  const text = extractText(parsedData);

  const accountNumberMatch = text.match(/Savings\s+A\/c\s+([X\d]+)/i);
  const accountBalanceMatch = text.match(
    /ACCOUNT\s+BALANCE\s*\(I\)[\s\S]*?\n[^\n]*?\s([\d,]+(?:\.\d{2})?)/i,
  );
  const totalBalanceMatch = text.match(/TOTAL\s+([\d,]+(?:\.\d{2})?)/i);
  const periodMatch = text.match(
    /period\s+([A-Za-z]{3,}\s+\d{2},\s+\d{4})\s+-\s+([A-Za-z]{3,}\s+\d{2},\s+\d{4})/i,
  );

  return {
    accountNumberMasked: accountNumberMatch?.[1]?.trim(),
    accountBalance:
      sanitizeNumber(accountBalanceMatch?.[1]) ??
      sanitizeNumber(totalBalanceMatch?.[1]),
    statementPeriod: periodMatch
      ? { from: periodMatch[1].trim(), to: periodMatch[2].trim() }
      : undefined,
  };
};
