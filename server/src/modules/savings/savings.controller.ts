import type { Request, Response } from "express";
import { AppError } from "../../middlewares/errorHandler.ts";
import { readFile, unlink } from "fs/promises";
import { PDFParse } from "pdf-parse";
import {
  extractinfoFromICICI_savingsStatement,
  getAllLatestSavingsTransactions,
  getSavingsAccountInfo,
} from "./savings.service.ts";

export const process_ICICI_Savings_Statement = async (
  req: Request,
  res: Response,
) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const filePath = req.file.path;
  const fileBuffer = await readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const pdfData = await parser.getText();
    const result = await extractinfoFromICICI_savingsStatement(pdfData.text);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    throw new AppError("Failed to process PDF", 500);
  } finally {
    await parser.destroy();
    await unlink(filePath).catch(() => undefined);
  }
};

export const getSavingsTransactions = async (req: Request, res: Response) => {
  const result = await getAllLatestSavingsTransactions();
  res.status(200).json(result);
};

export const getSavingsAccountInfoHandler = async (req: Request, res: Response) => {
  const result = await getSavingsAccountInfo();
  res.status(200).json(result);
};
