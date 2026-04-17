import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
  getCreditInfo,
  setCreditInfo,
  getCreditCardBankDetails,
} from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-icici",
  upload.single("file"),
  process_ICICIStatement,
);

router.get("/get-transactions", getTransactions);
router.get("/credit-info", getCreditInfo).post("/credit-info", setCreditInfo);
router.get("/get-credit-card-bank-details", getCreditCardBankDetails);

export default router;
