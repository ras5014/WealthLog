import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { successResponse } from "../../utils/responses";
import { PDFParse } from "pdf-parse";
import { ICICIparseStatementSummary } from "../../services/parsers/icici.parser";
import { HDFCparseStatementSummary } from "../../services/parsers/hdfc.parser";
import { SBIparseStatementSummary } from "../../services/parsers/sbi.parser";

export const uploadStatement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let filePath: string | undefined;
  try {
    const bank = req.body.bank;
    const file = req.file;

    if (!file) {
      next(new Error("No file uploaded"));
      return;
    }

    filePath = file.path;

    // Read PDF
    const buffer = fs.readFileSync(file.path);
    const pdfData = new PDFParse({ data: buffer });
    const parsedData = await pdfData.getText();

    const result = {
      ICICI: {},
      HDFC: {},
      SBI: {},
    };

    if (bank === "ICICI") {
      const parsedStatement_ICICI = ICICIparseStatementSummary(parsedData);
      result.ICICI = parsedStatement_ICICI;
    } else if (bank === "HDFC") {
      const parsedStatement_HDFC = HDFCparseStatementSummary(parsedData);
      result.HDFC = parsedStatement_HDFC;
    } else if (bank === "SBI") {
      const parsedStatement_SBI = SBIparseStatementSummary(parsedData);
      result.SBI = parsedStatement_SBI;
    } else {
      next(new Error("Unsupported bank"));
      return;
    }

    //TODO: Save result to DB associated with user account

    successResponse(res, {
      message: "Statement uploaded and processed",
      data: result,
    });
  } catch (error) {
    next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const fetchBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};
