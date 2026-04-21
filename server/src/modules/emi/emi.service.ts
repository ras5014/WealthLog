import { eq } from "drizzle-orm";
import db from "../../db/connection.ts";
import { creditCardBankInfo, emiInfo, emiRecords } from "../../db/schema.ts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function getCycleInfo(
  paymentDate: string,
  cycle: { startDay: number; endDay: number },
) {
  const date = new Date(paymentDate);
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();

  let cycleStartMonth: number;
  let cycleEndMonth: number;
  let payMonth: number;
  let payYear: number;

  if (day >= cycle.startDay) {
    cycleStartMonth = month;
    cycleEndMonth = (month + 1) % 12;
    payMonth = (month + 2) % 12;
    payYear = year + Math.floor((month + 2) / 12);
  } else {
    cycleStartMonth = (month - 1 + 12) % 12;
    cycleEndMonth = month;
    payMonth = (month + 1) % 12;
    payYear = year + Math.floor((month + 1) / 12);
  }

  const label = `${getOrdinalSuffix(cycle.startDay)} ${MONTHS[cycleStartMonth]} - ${getOrdinalSuffix(cycle.endDay)} ${MONTHS[cycleEndMonth]} (${MONTHS[payMonth]} ${payYear})`;
  const sortKey = payYear * 12 + payMonth;

  return { label, sortKey };
}

export const processAndSaveEmiRecords = async () => {
  const emis = await db.select().from(emiInfo);
  const bankInfos = await db.select().from(creditCardBankInfo);

  const bankCycleMap = new Map<string, { startDay: number; endDay: number }>();
  for (const bank of bankInfos) {
    const startDay = new Date(bank.billingCycleStartDate).getUTCDate();
    const endDay = new Date(bank.billingCycleEndDate).getUTCDate();
    bankCycleMap.set(bank.bank, { startDay, endDay });
  }

  const cycleMap = new Map<
    string,
    { items: { description: string; amount: number }[]; sortKey: number }
  >();

  for (const emi of emis) {
    const cycle = bankCycleMap.get(emi.bank);
    if (!cycle) continue;

    const description = emi.description || emi.merchant || "Unknown";

    for (const installment of emi.amortizationSchedule ?? []) {
      const { label, sortKey } = getCycleInfo(installment.paymentDate, cycle);

      const existing = cycleMap.get(label);
      if (existing) {
        existing.items.push({
          description,
          amount: installment.installmentAmount,
        });
      } else {
        cycleMap.set(label, {
          items: [{ description, amount: installment.installmentAmount }],
          sortKey,
        });
      }
    }
  }

  await db.delete(emiRecords);

  const records = Array.from(cycleMap.entries())
    .sort(([, a], [, b]) => a.sortKey - b.sortKey)
    .map(([label, { items }]) => ({
      label,
      totalAmount: items,
    }));

  if (records.length > 0) {
    await db.insert(emiRecords).values(records);
  }

  return records;
};

export const getEmiDashboardData = async () => {
  const emis = await db.select().from(emiInfo);
  const records = await db.select().from(emiRecords);

  const totalLoanAmount = emis.reduce(
    (total, emi) => total + Number(emi.totalAmount ?? 0),
    0,
  );

  const totalPaidAmount = emis.reduce(
    (total, emi) =>
      total +
      (emi.amortizationSchedule ?? []).reduce(
        (sum, inst) =>
          inst.paymentStatus === "paid" ? sum + inst.installmentAmount : sum,
        0,
      ),
    0,
  );

  return {
    emiRecords: records,
    totalLoanAmount: Math.round(totalLoanAmount * 100) / 100,
    totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
    remainingAmount:
      Math.round((totalLoanAmount - totalPaidAmount) * 100) / 100,
  };
};

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

  // Recompute emi_records after upsert
  await processAndSaveEmiRecords();

  return {
    merchant,
    totalAmount,
    emiCount: schedule.length,
    schedule,
    updated: !!existing,
  };
};
