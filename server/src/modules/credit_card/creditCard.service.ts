import type {
  CreditCardTransaction,
  ParsedStatementResult,
} from "./creditCard.types.ts";
import db from "../../db/connection.ts";
import { creditCardTransactions } from "../../db/schema.ts";
import { and, eq, inArray } from "drizzle-orm";
import { PREFIXES_TO_EXCLUDE, CARD_DETAILS } from "../../config/constants.ts";

export const extractTransactionsFromPDF = async (
  pdfText: string,
): Promise<ParsedStatementResult> => {
  // Extract Credit Card Information
  // 1. Extract card holder details
  const cardDetailsRegex =
    /My Credit Card Details for\s+([\s\S]*?)-(\d{6}\*{6}\d{4})/;
  const cardDetailsMatch = cardDetailsRegex.exec(pdfText);
  if (!cardDetailsMatch) {
    throw new Error("Could not find card holder details in the PDF");
  }
  const cardHolderName = cardDetailsMatch[1]
    .replaceAll("\n", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  const cardNumber = cardDetailsMatch[2];

  // 2. Extract statement period
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

  // 3. Extract the transaction section (everything after the table header)
  const headerPattern =
    /Transaction Date\s+Details\s+Amount \(INR\)\s+Reference Number\n/;
  const headerMatch = headerPattern.exec(pdfText);
  if (headerMatch?.index == null) {
    throw new Error("Could not find transaction table header in the PDF");
  }

  let transactionText = pdfText.slice(
    headerMatch.index + headerMatch[0].length,
  );

  // 4. Remove page break markers (e.g. "-- 1 of 3 --")
  transactionText = transactionText.replaceAll(
    /\n--\s*\d+\s+of\s+\d+\s*--\n/g,
    "\n",
  );

  // 5. Parse individual transactions
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

    // 6. Exclude transactions with specific prefixes
    if (PREFIXES_TO_EXCLUDE.some((prefix) => details.startsWith(prefix))) {
      emiExcludedCount++;
      continue;
    }

    allTransactions.push({
      cardNumber,
      transactionDate: match[1],
      details,
      amount: Number.parseFloat(match[3].replaceAll(",", "")),
      type: match[4] === "Dr." ? "Dr" : "Cr",
      referenceNumber: match[5],
      statementStartDate,
      statementEndDate,
      bank:
        CARD_DETAILS.find((c) => c.cardNumber === cardNumber)?.bank ||
        "UNKNOWN",
    });
  }

  // 7. Deduplicate against existing DB records for this statement period
  const refNumbers = allTransactions.map((t) => t.referenceNumber);

  const existingRows = await db
    .select({ referenceNumber: creditCardTransactions.referenceNumber })
    .from(creditCardTransactions)
    .where(
      and(
        eq(
          creditCardTransactions.statementStartDate,
          statementStartDate.split("-").reverse().join("-"),
        ),
        inArray(creditCardTransactions.referenceNumber, refNumbers),
      ),
    );

  const existingRefs = new Set(existingRows.map((r) => r.referenceNumber));

  const newTransactions = allTransactions.filter(
    (t) => !existingRefs.has(t.referenceNumber),
  );
  const duplicateCount = allTransactions.length - newTransactions.length;

  // 8. Persist new transactions to the database
  if (newTransactions.length > 0) {
    await db.insert(creditCardTransactions).values(
      newTransactions.map((t) => ({
        transactionDate: t.transactionDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        details: t.details,
        amount: t.amount.toString(),
        type: t.type,
        referenceNumber: t.referenceNumber,
        statementStartDate: t.statementStartDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        statementEndDate: t.statementEndDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        bank:
          CARD_DETAILS.find((c) => c.cardNumber === t.cardNumber)?.bank ||
          "UNKNOWN",
      })),
    );
  }

  return {
    cardHolderName,
    cardNumber,
    statementStartDate,
    statementEndDate,
    totalAmountDue,
    newTransactions,
    duplicateCount,
    totalTransactionsParsed: allTransactions.length + emiExcludedCount,
    emiExcludedCount,
  };
};

export const getAllLatestTransactions = async () => {
  const latestTransaction = await db.query.creditCardTransactions.findFirst({
    columns: {
      statementStartDate: true,
      statementEndDate: true,
    },
    orderBy: (transactions, { desc }) => [desc(transactions.transactionDate)],
  });

  const transactions = await db.query.creditCardTransactions.findMany({
    columns: {
      id: true,
      transactionDate: true,
      details: true,
      amount: true,
      type: true,
      referenceNumber: true,
      statementStartDate: true,
      statementEndDate: true,
      bank: true,
    },
    where: (transactions, { eq }) =>
      eq(
        transactions.statementStartDate,
        latestTransaction?.statementStartDate || "",
      ),
    orderBy: (transactions, { desc }) => [desc(transactions.transactionDate)],
  });

  const totalDayPassed = latestTransaction
    ? Math.ceil(
        (new Date(latestTransaction.statementEndDate).getTime() -
          new Date(latestTransaction.statementStartDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 0;

  return { transactions, totalDayPassed };
};
