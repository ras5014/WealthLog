import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
  getCreditInfo,
  setCreditInfo,
  addToEMI,
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
router.post("/add-to-emi", addToEMI);

export default router;
