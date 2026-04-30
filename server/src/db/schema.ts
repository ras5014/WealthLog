import {
  pgTable,
  varchar,
  numeric,
  date,
  uniqueIndex,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod"; // For Zod schema generation

export const creditCardTransactions = pgTable(
  "credit_card_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  id: uuid("id").primaryKey().defaultRandom(),
  budget: numeric("budget", { precision: 12, scale: 2 }).notNull(),
});

export const creditCardBankInfo = pgTable("credit_card_bank_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  bank: varchar("bank", { length: 64 }).notNull().unique(),
  totalAmountDue: numeric("total_amount_due", {
    precision: 12,
    scale: 2,
  }).notNull(),
  billingCycleStartDate: date("billing_cycle_start_date").notNull(),
  billingCycleEndDate: date("billing_cycle_end_date").notNull(),
  statementEndDate: date("statement_end_date").notNull(),
});

export const emiInfo = pgTable("emi_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  bank: varchar("bank", { length: 64 }).notNull(),
  description: varchar("description", { length: 512 }),
  merchant: varchar("merchant", { length: 128 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
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

export const emiRecords = pgTable("emi_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 128 }).notNull(),
  totalAmount: jsonb("total_amount").$type<
    {
      description: string;
      amount: number;
    }[]
  >(),
});

// Zod Schemas for validation
export const CreditCardTransactionInsertSchema = createInsertSchema(
  creditCardTransactions,
);

export const CreditCardTransactionSelectSchema = createSelectSchema(
  creditCardTransactions,
);

export const CreditCardInfoInsertSchema = createInsertSchema(creditCardInfo);
export const CreditCardInfoSelectSchema = createSelectSchema(creditCardInfo);

export const CreditCardBankInfoInsertSchema =
  createInsertSchema(creditCardBankInfo);
export const CreditCardBankInfoSelectSchema =
  createSelectSchema(creditCardBankInfo);

export const EmiInfoInsertSchema = createInsertSchema(emiInfo);
export const EmiInfoSelectSchema = createSelectSchema(emiInfo);

export const EmiRecordsInsertSchema = createInsertSchema(emiRecords);
export const EmiRecordsSelectSchema = createSelectSchema(emiRecords);
