import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { readFile, unlink } from "node:fs/promises";
import {
  extractTransactionsFromPDF,
  getAllLatestTransactions,
} from "./creditCard.service.ts";
import { autoSyncIciciStatements } from "./iciciAutoSync.service.ts";
import db from "../../db/connection.ts";
import redisClient from "../../db/redis.ts";
import { creditCardBankInfo, creditCardInfo } from "../../db/schema.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

const TOTAL_SPENDS_TTL_SECONDS = 60 * 60 * 24 * 30;

const toDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const process_ICICIStatement = async (req: Request, res: Response) => {
  // Check if a file was uploaded
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }
  const filePath = req.file.path;
  const fileBuffer = await readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const pdfData = await parser.getText();

    // Here you would implement the logic to parse the PDF data and extract transactions
    const result = await extractTransactionsFromPDF(pdfData.text, req.body.bank);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (
      error instanceof Error &&
      error.message === "BANK_SELECTION_REQUIRED"
    ) {
      throw new AppError("BANK_SELECTION_REQUIRED", 400);
    }
    throw new AppError("Failed to process PDF", 500);
  } finally {
    await parser.destroy();
    await unlink(filePath).catch(() => undefined);
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  const result = await getAllLatestTransactions();
  res.status(200).json(result);
};

export const getCreditInfo = async (req: Request, res: Response) => {
  const result = await db
    .select({
      budget: creditCardInfo.budget,
    })
    .from(creditCardInfo)
    .limit(1);
  const row = result[0];
  res.status(200).json({
    budget: row?.budget ?? 0,
  });
};

export const setCreditInfo = async (req: Request, res: Response) => {
  const { amount } = req.body;
  const existingBudget = await db.select().from(creditCardInfo).limit(1);
  if (existingBudget.length > 0 && amount) {
    await db.update(creditCardInfo).set({
      budget: amount,
    });
  } else {
    await db.insert(creditCardInfo).values({
      budget: amount ?? 0,
    });
  }
  res.status(200).json({ message: "Budget set successfully" });
};

export const getCreditCardBankDetails = async (req: Request, res: Response) => {
  const result = await db.select().from(creditCardBankInfo);
  res.status(200).json(result);
};

export const cacheTotalSpends = async (req: Request, res: Response) => {
  const totalSpends = Number(req.body?.totalSpends ?? 0);
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const todayKey = toDateKey(today);
  const lastMonthKey = toDateKey(lastMonth);

  const [lastMonthSameTimeSpend] = await Promise.all([
    redisClient.get(lastMonthKey),
    redisClient.set(todayKey, String(totalSpends), "EX", TOTAL_SPENDS_TTL_SECONDS),
  ]);

  res.status(200).json({
    lastMonthSameTimeSpend: Number(lastMonthSameTimeSpend ?? 0),
  });
};

export const autoSync_ICICIStatements = async (req: Request, res: Response) => {
  try {
    const result = await autoSyncIciciStatements({
      autoLogin: req.body?.autoLogin === true,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message.includes("already running")) {
      throw new AppError(error.message, 409);
    }

    if (
      error instanceof Error &&
      error.message.includes("ICICI auto login is enabled")
    ) {
      throw new AppError(error.message, 400);
    }

    throw new AppError("Failed to auto sync ICICI statements", 500);
  }
};
