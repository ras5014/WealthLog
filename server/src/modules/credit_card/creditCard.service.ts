import type {
  CreditCardTransaction,
  ParsedStatementResult,
} from "./creditCard.types.ts";

// In-memory store for deduplication: statementPeriod -> Set of referenceNumbers
const processedTransactions = new Map<string, Set<string>>();

const EMI_PREFIXES = [
  "Principal Amount Amortization",
  "Interest Amount Amortization",
];

export const extractTransactionsFromPDF = async (
  pdfText: string,
): Promise<ParsedStatementResult> => {
  // 1. Extract statement period
  const periodRegex =
    /Statement Period\s+(\d{2}-\d{2}-\d{4})\s+TO\s+(\d{2}-\d{2}-\d{4})/;
  const periodMatch = periodRegex.exec(pdfText);
  if (!periodMatch) {
    throw new Error("Could not find statement period in the PDF");
  }

  const statementStartDate = periodMatch[1];
  const statementEndDate = periodMatch[2];
  const statementPeriod = `${statementStartDate} TO ${statementEndDate}`;

  // Extract Total Amount Due
  const totalDueRegex = /Total Amount Due\s+INR\s+([\d,]+(?:\.\d{1,2})?)/;
  const totalDueMatch = totalDueRegex.exec(pdfText);
  if (!totalDueMatch) {
    throw new Error("Could not find Total Amount Due in the PDF");
  }
  const totalAmountDue = Number.parseFloat(
    totalDueMatch[1].replaceAll(",", ""),
  );

  // 2. Extract the transaction section (everything after the table header)
  const headerPattern =
    /Transaction Date\s+Details\s+Amount \(INR\)\s+Reference Number\n/;
  const headerMatch = headerPattern.exec(pdfText);
  if (headerMatch?.index == null) {
    throw new Error("Could not find transaction table header in the PDF");
  }

  let transactionText = pdfText.slice(
    headerMatch.index + headerMatch[0].length,
  );

  // 3. Remove page break markers (e.g. "-- 1 of 3 --")
  transactionText = transactionText.replaceAll(
    /\n--\s*\d+\s+of\s+\d+\s*--\n/g,
    "\n",
  );

  // 4. Parse individual transactions
  // Each transaction: DATE  DETAILS(multiline)  AMOUNT Dr.|Cr. REFERENCE
  const txnRegex =
    /(\d{2}-\d{2}-\d{4})\s+([\s\S]*?)\s+(\d[\d,]*(?:\.\d{1,2})?)\s+(Dr\.|Cr\.)\s+(\d+)/g;

  const allTransactions: CreditCardTransaction[] = [];
  let emiExcludedCount = 0;
  let match: RegExpExecArray | null;

  while ((match = txnRegex.exec(transactionText)) !== null) {
    // Clean up multi-line details into a single string
    const details = match[2]
      .replaceAll("\n", " ")
      .replaceAll(/\s+/g, " ")
      .trim();

    // 5. Exclude EMI-related transactions
    if (EMI_PREFIXES.some((prefix) => details.startsWith(prefix))) {
      emiExcludedCount++;
      continue;
    }

    allTransactions.push({
      transactionDate: match[1],
      details,
      amount: Number.parseFloat(match[3].replaceAll(",", "")),
      type: match[4] === "Dr." ? "Dr" : "Cr",
      referenceNumber: match[5],
      statementPeriod,
    });
  }

  // 6. Deduplicate against previously processed transactions for this period
  if (!processedTransactions.has(statementPeriod)) {
    processedTransactions.set(statementPeriod, new Set());
  }
  // Safe: we just ensured the key exists above
  const existingRefs = processedTransactions.get(statementPeriod) ?? new Set();

  const newTransactions = allTransactions.filter(
    (t) => !existingRefs.has(t.referenceNumber),
  );
  const duplicateCount = allTransactions.length - newTransactions.length;

  // Record the new reference numbers so future uploads won't duplicate them
  for (const t of newTransactions) {
    existingRefs.add(t.referenceNumber);
  }

  // TODO: Persist newTransactions to the database
  // TODO: Once DB is set up, replace the in-memory deduplication above with a DB lookup

  return {
    statementPeriod,
    statementStartDate,
    statementEndDate,
    totalAmountDue,
    newTransactions,
    duplicateCount,
    totalTransactionsParsed: allTransactions.length + emiExcludedCount,
    emiExcludedCount,
  };
};
