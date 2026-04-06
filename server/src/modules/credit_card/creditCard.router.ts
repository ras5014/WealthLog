import { Router } from "express";
import multer from "multer";
import {
  getBudget,
  getTransactions,
  process_ICICIStatement,
  setBudget,
} from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post("/synchronize", upload.single("file"), process_ICICIStatement);
router.get("/get-transactions", getTransactions);
router.get("/budget", getBudget).post("/budget", setBudget);

export default router;
