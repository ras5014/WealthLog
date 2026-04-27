import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
  getCreditInfo,
  setCreditInfo,
  getCreditCardBankDetails,
} from "./creditCard.controller.ts";
import { validateBody } from "../../middlewares/validation.ts";
import { CreditCardInfoInsertSchema } from "../../db/schema.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-icici",
  upload.single("file"),
  process_ICICIStatement,
);

router.get("/get-transactions", getTransactions);
router.get("/credit-info", getCreditInfo).post(
  "/credit-info",
  // validateBody(CreditCardInfoInsertSchema),
  setCreditInfo,
);
router.get("/get-credit-card-bank-details", getCreditCardBankDetails);

export default router;
