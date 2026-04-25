import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { readFile, unlink } from "node:fs/promises";
import {
  extractTransactionsFromPDF,
  getAllLatestTransactions,
} from "./creditCard.service.ts";
import db from "../../db/connection.ts";
import { creditCardBankInfo, creditCardInfo } from "../../db/schema.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

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
    const result = await extractTransactionsFromPDF(pdfData.text);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
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
