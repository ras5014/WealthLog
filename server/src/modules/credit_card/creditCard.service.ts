import type {
  CreditCardTransaction,
  ParsedStatementResult,
} from "./creditCard.types.ts";
import db from "../../db/connection.ts";
import {
  creditCardBankInfo,
  creditCardTransactions,
  tempEmiRecords,
} from "../../db/schema.ts";
import { and, eq, inArray } from "drizzle-orm";
import { PREFIXES_TO_EXCLUDE, CARD_DETAILS } from "../../config/constants.ts";
import { calculateBillingCycleDates } from "../../lib/utils.ts";
import { categorizeTransactions } from "../../lib/categorization.ts";
import type { TransactionCategory } from "../../lib/categorization.ts";

export const extractTransactionsFromPDF = async (
  pdfText: string,
  selectedBank?: string,
): Promise<ParsedStatementResult> => {
  const isPreviousMonthStatement = pdfText
    .trimStart()
    .startsWith("VIEW LAST STATEMENT");

  if (isPreviousMonthStatement && !selectedBank) {
    throw new Error("BANK_SELECTION_REQUIRED");
  }

  // Extract Credit Card Information
  // 1. Extract card holder details
  const cardDetailsRegex =
    /My Credit Card Details for\s+([\s\S]*?)-(\d{6}\*{6}\d{4})/;
  const cardDetailsMatch = cardDetailsRegex.exec(pdfText);
  if (!cardDetailsMatch && !selectedBank) {
    throw new Error("Could not find card holder details in the PDF");
  }
  const selectedCardDetails = selectedBank
    ? CARD_DETAILS.find((c) => c.bank === selectedBank)
    : undefined;
  if (selectedBank && !selectedCardDetails) {
    throw new Error(`Bank not found: ${selectedBank}`);
  }

  const cardHolderName =
    cardDetailsMatch?.[1]
      .replaceAll("\n", " ")
      .replaceAll(/\s+/g, " ")
      .trim() ?? "";
  const cardNumber = selectedCardDetails?.cardNumber ?? cardDetailsMatch![2];
  const matchedCardDetails =
    selectedCardDetails ??
    CARD_DETAILS.find((c) => c.cardNumber === cardNumber);
  if (!matchedCardDetails?.bank) {
    throw new Error(`Bank not found for card number: ${cardNumber}`);
  }
  const bank = matchedCardDetails.bank;

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

  const paymentDueDateMatch = /Payment Due Date\s+(\d{2}-\d{2}-\d{4})/.exec(
    pdfText,
  );
  const minimumAmountDueMatch =
    /Minimum Amount Due\s+(?:INR\s+)?([\d,]+(?:\.\d{1,2})?)/.exec(pdfText);

  if (isPreviousMonthStatement && !paymentDueDateMatch) {
    throw new Error("Could not find Payment Due Date in the PDF");
  }
  if (isPreviousMonthStatement && !minimumAmountDueMatch) {
    throw new Error("Could not find Minimum Amount Due in the PDF");
  }

  const paymentDueDate = paymentDueDateMatch?.[1];
  const minimumAmountDue = minimumAmountDueMatch
    ? Number.parseFloat(minimumAmountDueMatch[1].replaceAll(",", ""))
    : undefined;

  // 3. Extract the transaction section (everything after the table header)
  const headerPattern =
    /Transaction Date\s+Details\s+Amount \(INR\)\s+(?:Reward Points\s+)?Reference Number\s*\n/;
  let headerMatch = headerPattern.exec(pdfText);
  if (headerMatch?.index == null) {
    const altHeaderPattern = /Transaction\s+Details/i;
    headerMatch = altHeaderPattern.exec(pdfText);
  }

  if (headerMatch?.index == null) {
    // More helpful error message with debugging info
    const textPreview = pdfText.substring(0, 800);
    console.error("PDF text preview (first 800 chars):", textPreview);
    console.error("Looking for transaction table header with patterns:");
    console.error(
      "1. Primary: Transaction Date...Details...Amount (INR)...Reference Number",
    );
    console.error("2. Fallback: Transaction Details");
    throw new Error(
      `Could not find transaction table header in the PDF. Expected format: "Transaction Date Details Amount (INR) Reference Number"`,
    );
  }

  let transactionText = pdfText.slice(
    headerMatch.index + headerMatch[0].length,
  );

  console.log("Header match found:", headerMatch[0]);
  console.log("Transaction text length:", transactionText.length);

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
      bank,
    });
  }

  console.log(
    `Parsed ${allTransactions.length} transactions, ${emiExcludedCount} EMI transactions excluded`,
  );
  if (allTransactions.length === 0) {
    console.warn(
      "No transactions found in statement. Transaction text preview:",
    );
    console.warn(transactionText.substring(0, 500));
  }

  // 7. Deduplicate against existing DB records for this statement period
  const refNumbers = allTransactions.map((t) => t.referenceNumber);
  const normalizedStatementStartDate = statementStartDate
    .split("-")
    .reverse()
    .join("-");

  // If transaction exists in tempEmiRecords, it means it's added to EMI, so we should exclude it from new transactions and not count it as duplicate
  const emiRows = refNumbers.length
    ? await db
        .select({ referenceNumber: tempEmiRecords.referenceNumber })
        .from(tempEmiRecords)
        .where(
          and(
            eq(tempEmiRecords.bank, bank),
            eq(tempEmiRecords.statementStartDate, normalizedStatementStartDate),
            inArray(tempEmiRecords.referenceNumber, refNumbers),
          ),
        )
    : [];

  const emiRefs = new Set(emiRows.map((r) => r.referenceNumber));
  const transactionsForDedup = allTransactions.filter(
    (t) => !emiRefs.has(t.referenceNumber),
  );
  const refsForDedup = transactionsForDedup.map((t) => t.referenceNumber);

  const existingRows = refsForDedup.length
    ? await db
        .select({ referenceNumber: creditCardTransactions.referenceNumber })
        .from(creditCardTransactions)
        .where(
          and(
            eq(
              creditCardTransactions.statementStartDate,
              normalizedStatementStartDate,
            ),
            inArray(creditCardTransactions.referenceNumber, refsForDedup),
          ),
        )
    : [];

  const existingRefs = new Set(existingRows.map((r) => r.referenceNumber));

  const newTransactions = transactionsForDedup.filter(
    (t) => !existingRefs.has(t.referenceNumber),
  );
  const duplicateCount = transactionsForDedup.length - newTransactions.length;
  const categorizedNewTransactions =
    await categorizeTransactions(newTransactions);

  // 8. Persist new transactions to the database
  if (categorizedNewTransactions.length > 0) {
    await db.insert(creditCardTransactions).values(
      categorizedNewTransactions.map((t) => ({
        transactionDate: t.transactionDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        details: t.details,
        amount: t.amount.toString(),
        type: t.type,
        referenceNumber: t.referenceNumber,
        statementStartDate: t.statementStartDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        statementEndDate: t.statementEndDate.split("-").reverse().join("-"), // DD-MM-YYYY -> YYYY-MM-DD
        bank,
        description: t.description,
        category: t.category,
      })),
    );
  }

  const billingEndDateStr = calculateBillingCycleDates(statementStartDate);
  const bankInfoPayload = {
    bank,
    totalAmountDue: totalAmountDue.toString(),
    billingCycleStartDate: statementStartDate.split("-").reverse().join("-"),
    billingCycleEndDate: billingEndDateStr,
    statementEndDate: statementEndDate.split("-").reverse().join("-"),
    paymentDueDate: paymentDueDate
      ? paymentDueDate.split("-").reverse().join("-")
      : null,
    minimumAmountDue: minimumAmountDue ? minimumAmountDue.toString() : null,
  };

  const existingBankInfo = await db.query.creditCardBankInfo.findFirst({
    where: (creditCardBank, { eq }) => eq(creditCardBank.bank, bank),
  });

  if (existingBankInfo) {
    const bankInfoUpdatePayload = isPreviousMonthStatement
      ? {
          totalAmountDue: bankInfoPayload.totalAmountDue,
          paymentDueDate: bankInfoPayload.paymentDueDate,
          minimumAmountDue: bankInfoPayload.minimumAmountDue,
        }
      : {
          totalAmountDue: bankInfoPayload.totalAmountDue,
          billingCycleStartDate: bankInfoPayload.billingCycleStartDate,
          billingCycleEndDate: bankInfoPayload.billingCycleEndDate,
          statementEndDate: bankInfoPayload.statementEndDate,
        };

    await db
      .update(creditCardBankInfo)
      .set(bankInfoUpdatePayload)
      .where(eq(creditCardBankInfo.bank, existingBankInfo.bank));
  } else {
    await db.insert(creditCardBankInfo).values(bankInfoPayload);
  }

  return {
    cardHolderName,
    cardNumber,
    statementStartDate,
    statementEndDate,
    totalAmountDue,
    ...(paymentDueDate && { paymentDueDate }),
    ...(minimumAmountDue != null && { minimumAmountDue }),
    newTransactions: categorizedNewTransactions,
    duplicateCount,
    totalTransactionsParsed: allTransactions.length + emiExcludedCount,
    emiExcludedCount,
  };
};

export const getAllLatestTransactions = async () => {
  const billingCycleDates = await db.query.creditCardBankInfo.findMany({
    columns: {
      bank: true,
      billingCycleStartDate: true,
      billingCycleEndDate: true,
    },
  });

  // This is to know till which date statement is uploaded, crucial to find no. of days passed and burn rate
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
      description: true,
      category: true,
    },
    where: (transactions, { eq }) =>
      eq(
        transactions.statementStartDate,
        billingCycleDates[0].billingCycleStartDate,
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

export const updateTransactionCategory = async (
  transactionId: string,
  category: TransactionCategory,
) => {
  const [transaction] = await db
    .update(creditCardTransactions)
    .set({ category })
    .where(eq(creditCardTransactions.id, transactionId))
    .returning({
      id: creditCardTransactions.id,
      category: creditCardTransactions.category,
    });

  return transaction;
};
