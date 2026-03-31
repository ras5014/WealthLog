import {
  pgTable,
  serial,
  varchar,
  numeric,
  date,
  uniqueIndex,
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
