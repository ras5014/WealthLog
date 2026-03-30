import { Router } from "express";
import multer from "multer";
import { process_ICICI_CORAL_Statement } from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize",
  upload.single("file"),
  process_ICICI_CORAL_Statement,
);

export default router;
