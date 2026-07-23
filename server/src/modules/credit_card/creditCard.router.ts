import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
  getCreditInfo,
  setCreditInfo,
  getCreditCardBankDetails,
  autoSync_ICICIStatements,
  cacheTotalSpends,
  updateCreditCardTransactionCategory,
} from "./creditCard.controller.ts";
import { validateBody } from "../../middlewares/validation.ts";
import { z } from "zod";
import { CreditCardInfoInsertSchema } from "../../db/schema.ts";
import { TRANSACTION_CATEGORIES } from "../../lib/categorization.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-icici",
  upload.single("file"),
  process_ICICIStatement,
);

router.get("/get-transactions", getTransactions);
router.patch(
  "/transactions/:id/category",
  validateBody(
    z.object({
      category: z.enum(TRANSACTION_CATEGORIES),
    }),
  ),
  updateCreditCardTransactionCategory,
);
router.post("/total-spends-cache", cacheTotalSpends);
router.post("/auto-sync-icici", autoSync_ICICIStatements);
router.get("/credit-info", getCreditInfo).post(
  "/credit-info",
  // validateBody(CreditCardInfoInsertSchema),
  setCreditInfo,
);
router.get("/get-credit-card-bank-details", getCreditCardBankDetails);

export default router;
