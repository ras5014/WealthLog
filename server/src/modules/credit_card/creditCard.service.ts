import type {
  CreditCardTransaction,
  ParsedStatementResult,
} from "./creditCard.types.ts";
import db from "../../db/connection.ts";
import { creditCardTransactions } from "../../db/schema.ts";
import { and, eq, inArray } from "drizzle-orm";

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
      statementPeriod: `${statementStartDate} TO ${statementEndDate}`,
      bank: "ICICI_CORAL",
    });
  }

  // 6. Deduplicate against existing DB records for this statement period
  const statementPeriod = `${statementStartDate} TO ${statementEndDate}`;
  const refNumbers = allTransactions.map((t) => t.referenceNumber);

  const existingRows = await db
    .select({ referenceNumber: creditCardTransactions.referenceNumber })
    .from(creditCardTransactions)
    .where(
      and(
        eq(creditCardTransactions.statementPeriod, statementPeriod),
        inArray(creditCardTransactions.referenceNumber, refNumbers),
      ),
    );

  const existingRefs = new Set(existingRows.map((r) => r.referenceNumber));

  const newTransactions = allTransactions.filter(
    (t) => !existingRefs.has(t.referenceNumber),
  );
  const duplicateCount = allTransactions.length - newTransactions.length;

  // 7. Persist new transactions to the database
  if (newTransactions.length > 0) {
    await db.insert(creditCardTransactions).values(
      newTransactions.map((t) => ({
        transactionDate: t.transactionDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        details: t.details,
        amount: t.amount.toString(),
        type: t.type,
        referenceNumber: t.referenceNumber,
        statementPeriod: t.statementPeriod,
        bank: "ICICI_CORAL",
      })),
    );
  }

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
