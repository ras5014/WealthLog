import { createHash } from "node:crypto";
import db from "../../db/connection.ts";
import {
  savingsAccountInfo,
  savingsAccountTransactions,
} from "../../db/schema.ts";

import type {
  ParsedSavingsStatementResult,
  SavingsTransaction,
  SavingsTransactionType,
} from "./savings.types.ts";

const MONEY_PATTERN = /\d[\d,]*\.\d{2}/g;
const DATE_PATTERN = /\d{2}\.\d{2}\.\d{4}/;

const parseMoney = (value: string) =>
  Number.parseFloat(value.replaceAll(",", ""));

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < 0.01;

const normalizeWhitespace = (value: string) =>
  value.replaceAll(/\s+/g, " ").trim();

const buildTransactionKey = (
  accountNumber: string,
  transaction: SavingsTransaction,
  amount: number,
) =>
  createHash("sha256")
    .update(
      [
        accountNumber,
        transaction.transactionDateIso,
        transaction.referenceNumber ?? "",
        transaction.transactionType,
        amount.toFixed(2),
        transaction.balance.toFixed(2),
        transaction.transactionRemarks,
      ].join("|"),
    )
    .digest("hex");

const toIsoDateFromDotDate = (dateValue: string) => {
  const [day, month, year] = dateValue.split(".");
  return `${year}-${month}-${day}`;
};

const toIsoDateFromLongDate = (dateValue: string) => {
  const parsed = new Date(`${dateValue} UTC`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Could not parse statement date: ${dateValue}`);
  }

  return parsed.toISOString().slice(0, 10);
};

const extractReferenceNumber = (remarks: string) => {
  const referenceMatch = /(?:^|\/)(\d{10,18})(?:\/|$)/.exec(remarks);
  return referenceMatch?.[1] ?? null;
};

const cleanPdfText = (pdfText: string) =>
  pdfText
    .replaceAll(/\r\n/g, "\n")
    .replaceAll(/\n--\s*\d+\s+of\s+\d+\s*--\n/g, "\n");

const extractStatementInfo = (pdfText: string) => {
  const statementMatch =
    /Statement of Transactions in Saving Account no\.\s*(\d+)\s+in\s+([A-Z]{3})\s+for the period\s+([A-Za-z]+ \d{1,2}, \d{4})\s+-\s+([A-Za-z]+ \d{1,2}, \d{4})/i.exec(
      pdfText,
    );

  if (!statementMatch) {
    throw new Error("Could not find savings account statement information");
  }

  const baseBranchMatch = /Your Base Branch:\s*([^\n]+)/i.exec(pdfText);
  const textBeforeStatement = pdfText.slice(0, statementMatch.index);
  const holderBlockMatch = /\b\d{6}\s*\n([\s\S]*?)$/i.exec(textBeforeStatement);
  const holderLines =
    holderBlockMatch?.[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !DATE_PATTERN.test(line)) ?? [];

  return {
    accountNumber: statementMatch[1],
    currency: statementMatch[2],
    statementStartDate: toIsoDateFromLongDate(statementMatch[3]),
    statementEndDate: toIsoDateFromLongDate(statementMatch[4]),
    accountHolderName: holderLines[0] ?? null,
    accountHolderAddress: holderLines.slice(1),
    baseBranch: baseBranchMatch?.[1].trim() ?? null,
  };
};

const findTransactionRowStarts = (pdfText: string) => {
  const rowStartRegex = /^(\d+)\s+(\d{2}\.\d{2}\.\d{4})\s+(.+)$/gm;
  const rowStarts: {
    index: number;
    serialNumber: number;
    transactionDate: string;
    firstRemarkLine: string;
  }[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowStartRegex.exec(pdfText)) !== null) {
    rowStarts.push({
      index: match.index,
      serialNumber: Number.parseInt(match[1], 10),
      transactionDate: match[2],
      firstRemarkLine: match[3].trim(),
    });
  }

  return rowStarts;
};

const extractTerminalMoneyValues = (rowText: string) => {
  const matches = Array.from(rowText.matchAll(MONEY_PATTERN));

  if (matches.length < 2) {
    throw new Error(`Could not find amount and balance in row: ${rowText}`);
  }

  const amountMatch = matches[matches.length - 2];
  const balanceMatch = matches[matches.length - 1];

  return {
    amount: parseMoney(amountMatch[0]),
    balance: parseMoney(balanceMatch[0]),
    amountIndex: amountMatch.index ?? 0,
  };
};

const classifyTransaction = (
  amount: number,
  balance: number,
  previousBalance: number | null,
): SavingsTransactionType => {
  if (previousBalance == null) {
    return "Withdrawal";
  }

  const balanceDelta = roundMoney(balance - previousBalance);

  if (nearlyEqual(balanceDelta, amount)) {
    return "Deposit";
  }

  if (nearlyEqual(balanceDelta, -amount)) {
    return "Withdrawal";
  }

  return "Unknown";
};

const parseTransactions = (pdfText: string): SavingsTransaction[] => {
  const rowStarts = findTransactionRowStarts(pdfText);
  const transactions: SavingsTransaction[] = [];

  if (rowStarts.length === 0) {
    throw new Error("Could not find any savings account transaction rows");
  }

  for (let index = 0; index < rowStarts.length; index += 1) {
    const rowStart = rowStarts[index];
    const nextRowStart = rowStarts[index + 1];
    const rowText = pdfText.slice(rowStart.index, nextRowStart?.index).trim();
    const firstLineLength = rowText.indexOf("\n");
    const rowBody =
      firstLineLength === -1 ? "" : rowText.slice(firstLineLength + 1);
    const { amount, balance, amountIndex } =
      extractTerminalMoneyValues(rowBody);
    const remarks = normalizeWhitespace(
      `${rowStart.firstRemarkLine} ${rowBody.slice(0, amountIndex)}`,
    );
    const previousBalance = transactions.at(-1)?.balance ?? null;
    const transactionType = classifyTransaction(
      amount,
      balance,
      previousBalance,
    );

    transactions.push({
      serialNumber: rowStart.serialNumber,
      transactionDate: rowStart.transactionDate,
      transactionDateIso: toIsoDateFromDotDate(rowStart.transactionDate),
      chequeNumber: null,
      transactionRemarks: remarks,
      withdrawalAmount: transactionType === "Withdrawal" ? amount : null,
      depositAmount: transactionType === "Deposit" ? amount : null,
      balance,
      transactionType,
      referenceNumber: extractReferenceNumber(remarks),
    });
  }

  return transactions;
};

export const extractinfoFromICICI_savingsStatement = async (
  pdfText: string,
): Promise<ParsedSavingsStatementResult> => {
  const cleanedText = cleanPdfText(pdfText);
  const statementInfo = extractStatementInfo(cleanedText);
  const transactions = parseTransactions(cleanedText);

  const totalWithdrawals = roundMoney(
    transactions.reduce(
      (total, transaction) => total + (transaction.withdrawalAmount ?? 0),
      0,
    ),
  );
  const totalDeposits = roundMoney(
    transactions.reduce(
      (total, transaction) => total + (transaction.depositAmount ?? 0),
      0,
    ),
  );
  const firstTransaction = transactions[0];
  const openingBalance =
    firstTransaction?.withdrawalAmount != null
      ? roundMoney(firstTransaction.balance + firstTransaction.withdrawalAmount)
      : firstTransaction?.depositAmount != null
        ? roundMoney(firstTransaction.balance - firstTransaction.depositAmount)
        : null;

  await db
    .insert(savingsAccountInfo)
    .values({
      bank: "ICICI",
      openingBalance: (openingBalance ?? 0).toString(),
      closingBalance: (transactions.at(-1)?.balance ?? 0).toString(),
      totalWithdrawals: totalWithdrawals.toString(),
      totalDeposits: totalDeposits.toString(),
    })
    .onConflictDoUpdate({
      target: savingsAccountInfo.bank,
      set: {
        openingBalance: (openingBalance ?? 0).toString(),
        closingBalance: (transactions.at(-1)?.balance ?? 0).toString(),
        totalWithdrawals: totalWithdrawals.toString(),
        totalDeposits: totalDeposits.toString(),
      },
    });

  const transactionsToInsert = transactions.map((transaction) => {
    const amount =
      transaction.withdrawalAmount ?? transaction.depositAmount ?? null;

    if (!amount || transaction.transactionType === "Unknown") {
      throw new Error(
        `Could not determine transaction amount/type for row ${transaction.serialNumber}`,
      );
    }

    return {
      serialNumber: transaction.serialNumber.toString(),
      transactionDate: transaction.transactionDateIso,
      remarks: transaction.transactionRemarks,
      accountNumber: statementInfo.accountNumber,
      referenceNumber: transaction.referenceNumber,
      type: transaction.transactionType,
      amount: amount.toString(),
      balance: transaction.balance.toString(),
      transactionKey: buildTransactionKey(
        statementInfo.accountNumber,
        transaction,
        amount,
      ),
    };
  });

  let insertedTransactionCount = 0;
  if (transactionsToInsert.length > 0) {
    const insertedTransactions = await db
      .insert(savingsAccountTransactions)
      .values(transactionsToInsert)
      .onConflictDoNothing({
        target: savingsAccountTransactions.transactionKey,
      })
      .returning({ id: savingsAccountTransactions.id });

    insertedTransactionCount = insertedTransactions.length;
  }

  return {
    statementInfo: {
      ...statementInfo,
      openingBalance,
      closingBalance: transactions.at(-1)?.balance ?? null,
      totalWithdrawals,
      totalDeposits,
    },
    transactions,
    transactionCount: transactions.length,
    insertedTransactionCount,
    duplicateTransactionCount: transactions.length - insertedTransactionCount,
  };
};
