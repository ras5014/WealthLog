import {
  pgTable,
  serial,
  varchar,
  numeric,
  date,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export const creditCardTransactions = pgTable(
  "credit_card_transactions",
  {
    id: serial("id").primaryKey(),
    transactionDate: date("transaction_date").notNull(),
    details: varchar("details", { length: 512 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: varchar("type", { length: 2, enum: ["Dr", "Cr"] }).notNull(),
    referenceNumber: varchar("reference_number", { length: 64 }).notNull(),
    statementStartDate: date("statement_start_date").notNull(),
    statementEndDate: date("statement_end_date").notNull(),
    bank: varchar("bank", { length: 64 }).notNull(),
    description: varchar("description", { length: 512 }),
  },
  (table) => [
    uniqueIndex("uq_ref_statement").on(
      table.referenceNumber,
      table.statementStartDate,
      table.bank,
    ),
  ],
);

export const creditCardInfo = pgTable("credit_card_info", {
  id: serial("id").primaryKey(),
  totalAmountDue: numeric("total_amount_due", {
    precision: 12,
    scale: 2,
  }).notNull(),
  budget: numeric("budget", { precision: 12, scale: 2 }).notNull(),
  billingCycleStartDate: date("billing_cycle_start_date"),
  billingCycleEndDate: date("billing_cycle_end_date"),
});

export const emiInfo = pgTable("emi_info", {
  id: serial("id").primaryKey(),
  bank: varchar("bank", { length: 64 }),
  merchant: varchar("merchant", { length: 128 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  // amortizationSchedule: jsonb("amortization_schedule"),
  amortizationSchedule: jsonb("amortization_schedule").$type<
    {
      emiNo: number;
      transactionStatus: "POST" | "NEW";
      paymentDate: string; // ISO date preferred
      principalAmount: number;
      interestAmount: number;
      installmentAmount: number;
      paymentStatus?: "paid" | "pending";
    }[]
  >(),
});
