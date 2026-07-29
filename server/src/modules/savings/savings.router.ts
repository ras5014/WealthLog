import { Router } from "express";
import multer from "multer";
import { process_ICICI_Savings_Statement } from "./savings.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/sync-savings-icici",
  upload.single("file"),
  process_ICICI_Savings_Statement,
);

export default router;
