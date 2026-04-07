import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { readFile, unlink } from "node:fs/promises";
import {
  extractTransactionsFromPDF,
  getAllLatestTransactions,
} from "./creditCard.service.ts";
import db from "../../db/connection.ts";
import { creditCardBudget } from "../../db/schema.ts";

export const process_ICICIStatement = async (req: Request, res: Response) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
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
    res.status(500).json({ error: "Failed to process PDF" });
  } finally {
    await parser.destroy();
    await unlink(filePath).catch(() => undefined);
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const result = await getAllLatestTransactions();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const getBudget = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(creditCardBudget).limit(1);
    res.status(200).json(result[0] || { amount: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
};

export const setBudget = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== "number") {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const existingBudget = await db.select().from(creditCardBudget).limit(1);
    if (existingBudget.length > 0) {
      await db.update(creditCardBudget).set({ amount: amount.toString() });
    } else {
      await db.insert(creditCardBudget).values({ amount: amount.toString() });
    }
    res.status(200).json({ message: "Budget set successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to set budget" });
  }
};
