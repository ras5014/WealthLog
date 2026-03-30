import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import { readFile, unlink } from "node:fs/promises";
import { extractTransactionsFromPDF } from "./creditCard.service.ts";

export const process_ICICI_CORAL_Statement = async (
  req: Request,
  res: Response,
) => {
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
