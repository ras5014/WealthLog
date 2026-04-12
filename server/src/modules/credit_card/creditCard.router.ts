import { Router } from "express";
import multer from "multer";
import {
  getTransactions,
  process_ICICIStatement,
  getCreditInfo,
  setCreditInfo,
  addToEMI,
  synchronizeEMI_ICICI,
  getEmiInfo,
} from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-icici",
  upload.single("file"),
  process_ICICIStatement,
);

router.post(
  "/synchronize-emi-icici",
  upload.single("file"),
  synchronizeEMI_ICICI,
);

router.get("/get-transactions", getTransactions);
router.get("/credit-info", getCreditInfo).post("/credit-info", setCreditInfo);

// TODO: Use with Transaction table "Add to EMI" button
router.post("/add-to-emi", addToEMI);

router.get("/get-emi-info", getEmiInfo);

export default router;
