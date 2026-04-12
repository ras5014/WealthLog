import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { readFile, unlink } from "node:fs/promises";
import {
  extractTransactionsFromPDF,
  getAllLatestTransactions,
} from "./creditCard.service.ts";
import db from "../../db/connection.ts";
import { creditCardInfo, creditCardTransactions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

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

export const getCreditInfo = async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        budget: creditCardInfo.budget,
        totalAmountDue: creditCardInfo.totalAmountDue,
      })
      .from(creditCardInfo)
      .limit(1);
    res.status(200).json(result[0] || { budget: 0, totalAmountDue: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch credit info" });
  }
};

export const setCreditInfo = async (req: Request, res: Response) => {
  try {
    const existingBudget = await db.select().from(creditCardInfo).limit(1);
    if (existingBudget.length > 0 && req.body.amount) {
      await db.update(creditCardInfo).set({
        budget: req?.body?.amount?.toString(),
      });
    } else if (existingBudget.length > 0 && req.body.totalAmountDue) {
      await db.update(creditCardInfo).set({
        totalAmountDue: req?.body?.totalAmountDue?.toString(),
      });
    } else {
      await db.insert(creditCardInfo).values({
        budget: req?.body?.amount?.toString() ?? "0",
        totalAmountDue: req?.body?.totalAmountDue?.toString() ?? "0",
      });
    }
    res.status(200).json({ message: "Budget set successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to set budget" });
  }
};

export const addToEMI = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add transaction to EMI" });
  }
};
