import { eq } from "drizzle-orm";
import db from "../../db/connection.ts";
import { emiInfo } from "../../db/schema.ts";

export const extractEmisFromPDF = async (pdfText: string, bank: string) => {
  // 1. Extract merchant name
  const merchantRegex = /Selected Merchant\s*:(.*)/;
  const merchantMatch = merchantRegex.exec(pdfText);
  if (!merchantMatch) {
    throw new Error("Could not find merchant name in the PDF");
  }
  const merchant = merchantMatch[1].trim();

  // 2. Remove page break markers (e.g. "-- 1 of 1 --")
  const cleanedText = pdfText.replaceAll(/\n--\s*\d+\s+of\s+\d+\s*--\n/g, "\n");

  // 3. Parse amortization schedule rows
  const rowRegex =
    /(\d+)\s+(POST|NEW)\s+(\d{2}-\d{2}-\d{4})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;

  const schedule: {
    emiNo: number;
    transactionStatus: "POST" | "NEW";
    paymentDate: string;
    principalAmount: number;
    interestAmount: number;
    installmentAmount: number;
    paymentStatus: "paid" | "pending";
  }[] = [];

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(cleanedText)) !== null) {
    const paymentDate = rowMatch[3].split("-").reverse().join("-"); // DD-MM-YYYY -> YYYY-MM-DD
    schedule.push({
      emiNo: Number.parseInt(rowMatch[1]),
      transactionStatus: rowMatch[2] as "POST" | "NEW",
      paymentDate,
      principalAmount: Number.parseFloat(rowMatch[4]),
      interestAmount: Number.parseFloat(rowMatch[5]),
      installmentAmount: Number.parseFloat(rowMatch[6]),
      paymentStatus: rowMatch[2] === "POST" ? "paid" : "pending",
    });
  }

  if (schedule.length === 0) {
    throw new Error("Could not find any EMI rows in the PDF");
  }

  // 4. Calculate total amount
  const totalAmount = schedule.reduce(
    (sum, row) => sum + row.installmentAmount,
    0,
  );

  // 5. Upsert — update if merchant already exists, otherwise insert
  const existing = await db.query.emiInfo.findFirst({
    where: (emi, { eq }) => eq(emi.merchant, merchant),
  });

  if (existing) {
    await db
      .update(emiInfo)
      .set({
        bank,
        totalAmount: totalAmount.toFixed(2),
        amortizationSchedule: schedule,
      })
      .where(eq(emiInfo.id, existing.id));
  } else {
    await db.insert(emiInfo).values({
      bank,
      merchant,
      totalAmount: totalAmount.toFixed(2),
      amortizationSchedule: schedule,
    });
  }

  // TODO: Get all EMI and forecast for every month
  const emis = await db.select().from(emiInfo);

  return {
    merchant,
    totalAmount,
    emiCount: schedule.length,
    schedule,
    updated: !!existing,
  };
};
