import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { successResponse } from "../../utils/responses";
import { PDFParse } from "pdf-parse";
import { ICICIparseStatementSummary } from "../../services/parsers/icici.parser";
import { HDFCparseStatementSummary } from "../../services/parsers/hdfc.parser";
import { SBIparseStatementSummary } from "../../services/parsers/sbi.parser";
import { prisma } from "../../lib/prisma";

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
      // if bankNamne already exists in Accounts table, update the balance else create new entry
      const existingAccount = await prisma.accounts.findUnique({
        where: { bankName: "ICICI" },
      });

      if (existingAccount) {
        await prisma.accounts.update({
          where: { bankName: "ICICI" },
          data: { accountBalance: parsedStatement_ICICI.currentBalance },
        });
      } else {
        await prisma.accounts.create({
          data: {
            bankName: "ICICI",
            accountBalance: parsedStatement_ICICI.currentBalance,
          },
        });
      }
    } else if (bank === "HDFC") {
      const parsedStatement_HDFC = HDFCparseStatementSummary(parsedData);
      result.HDFC = parsedStatement_HDFC;
      // if bankNamne already exists in Accounts table, update the balance else create new entry
      const existingAccount = await prisma.accounts.findUnique({
        where: { bankName: "HDFC" },
      });

      if (existingAccount) {
        await prisma.accounts.update({
          where: { bankName: "HDFC" },
          data: { accountBalance: parsedStatement_HDFC.currentBalance },
        });
      } else {
        await prisma.accounts.create({
          data: {
            bankName: "HDFC",
            accountBalance: parsedStatement_HDFC.currentBalance,
          },
        });
      }
    } else if (bank === "SBI") {
      const parsedStatement_SBI = SBIparseStatementSummary(parsedData);
      result.SBI = parsedStatement_SBI;
      // if bankNamne already exists in Accounts table, update the balance else create new entry
      const existingAccount = await prisma.accounts.findUnique({
        where: { bankName: "SBI" },
      });

      if (existingAccount) {
        await prisma.accounts.update({
          where: { bankName: "SBI" },
          data: { accountBalance: parsedStatement_SBI.currentBalance },
        });
      } else {
        await prisma.accounts.create({
          data: {
            bankName: "SBI",
            accountBalance: parsedStatement_SBI.currentBalance,
          },
        });
      }
    } else {
      next(new Error("Unsupported bank"));
      return;
    }

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
) => {
  try {
    const accounts = await prisma.accounts.findMany();
    successResponse(res, {
      message: "Accounts fetched successfully",
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};
