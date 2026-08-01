import { Router } from "express";
import multer from "multer";
import {
  process_ICICI_Savings_Statement,
  getSavingsTransactions,
  getSavingsAccountInfoHandler,
} from "./savings.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/sync-savings-icici",
  upload.single("file"),
  process_ICICI_Savings_Statement,
);

router.get("/get-savings-transactions", getSavingsTransactions);
router.get("/get-Savings-account-info", getSavingsAccountInfoHandler);

export default router;
