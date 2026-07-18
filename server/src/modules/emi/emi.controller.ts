import type { Request, Response } from "express";
import { db } from "../../db/connection.ts";
import {
  creditCardTransactions,
  emiInfo,
  tempEmiRecords,
} from "../../db/schema.ts";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { and } from "drizzle-orm";
import { readFile, unlink } from "fs/promises";
import { PDFParse } from "pdf-parse";
import {
  createCustomEmi,
  deleteEmiById,
  extractEmisFromPDF,
  getEmiDashboardData,
} from "./emi.service.ts";
import { autoSyncEmiStatements } from "./emiAutoSync.service.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

export const addToEMI = async (req: Request, res: Response) => {
  const { bank, referenceNumber, statementStartDate } = req.body;
  // Delete the transaction from transactions table and return the deleted row
  const row = await db
    .delete(creditCardTransactions)
    .where(
      and(
        eq(creditCardTransactions.bank, bank),
        eq(creditCardTransactions.referenceNumber, referenceNumber),
        eq(creditCardTransactions.statementStartDate, statementStartDate),
      ),
    )
    .returning();
  // Add the deleted row to temp emi table
  await db.insert(tempEmiRecords).values(row);
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

export const addCustomEmi = async (req: Request, res: Response) => {
  const result = await createCustomEmi(req.body);
  res.status(201).json(result);
};

export const deleteEmi = async (req: Request, res: Response) => {
  const emiId = req.params.id;
  if (typeof emiId !== "string") {
    throw new AppError("Invalid EMI id", 400);
  }

  const result = await deleteEmiById(emiId);
  if (!result) {
    throw new AppError("EMI not found", 404);
  }

  res.status(200).json({ message: "EMI deleted successfully", id: result.id });
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

export const autoSync_EMI_ICICI = async (req: Request, res: Response) => {
  try {
    const { autoLogin, bank, expectedDownloads } = req.body;

    if (!bank) {
      throw new AppError("Bank is required for EMI auto sync", 400);
    }

    const result = await autoSyncEmiStatements({
      autoLogin: autoLogin === true,
      bank,
      expectedDownloads,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.message.includes("already running")) {
      throw new AppError(error.message, 409);
    }

    if (
      error instanceof Error &&
      error.message.includes("ICICI auto login is enabled")
    ) {
      throw new AppError(error.message, 400);
    }

    throw new AppError("Failed to auto sync EMI statements", 500);
  }
};
