import type { Request, Response } from "express";
import { db } from "../../db/connection.ts";
import { creditCardTransactions, emiInfo } from "../../db/schema.ts";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { readFile, unlink } from "fs/promises";
import { PDFParse } from "pdf-parse";
import { extractEmisFromPDF, getEmiDashboardData } from "./emi.service.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

export const addToEMI = async (req: Request, res: Response) => {
  const { bank, referenceNumber, statementStartDate } = req.body;
  const row = await db
    .delete(creditCardTransactions)
    .where(
      eq(creditCardTransactions.bank, bank) &&
        eq(creditCardTransactions.referenceNumber, referenceNumber) &&
        eq(creditCardTransactions.statementStartDate, statementStartDate),
    )
    .returning();
  res
    .status(200)
    .json({ message: "Transaction added to EMI successfully", row });
};

export const getEmiInfo = async (req: Request, res: Response) => {
  const result = await db.select().from(emiInfo);
  res.status(200).json(result);
};
export const getEmiDashboard = async (req: Request, res: Response) => {
  const result = await getEmiDashboardData();
  res.status(200).json(result);
};

export const synchronizeEMI_ICICI = async (req: Request, res: Response) => {
  // Check if a file was uploaded
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }
  const filePath = req.file.path;
  const fileBuffer = await readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const bank = req.body.bank;
    const pdfData = await parser.getText();

    const result = await extractEmisFromPDF(pdfData.text, bank);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    throw new AppError("Failed to synchronize EMI data", 500);
  } finally {
    await parser.destroy();
    await unlink(filePath).catch(() => undefined);
  }
};
