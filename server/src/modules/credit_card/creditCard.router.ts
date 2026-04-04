import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
} from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post("/synchronize", upload.single("file"), process_ICICIStatement);
// TODO: Only fetch transaction for last 2 months but show only transaction for current billing cycle.
router.get("/get-transactions", getTransactions);

export default router;
