import { Router } from "express";
import multer from "multer";
import {
  addToEMI,
  getEmiDashboard,
  getEmiInfo,
  synchronizeEMI_ICICI,
} from "./emi.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-emi-icici",
  upload.single("file"),
  synchronizeEMI_ICICI,
);

// TODO: Use with Transaction table "Add to EMI" button
router.post("/add-to-emi", addToEMI);

router.get("/get-emi-info", getEmiInfo);
router.get("/get-emi-dashboard", getEmiDashboard);

export default router;
