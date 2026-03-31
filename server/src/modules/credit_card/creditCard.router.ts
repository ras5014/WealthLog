import { Router } from "express";
import multer from "multer";
import { process_ICICIStatement } from "./creditCard.controller.ts";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post("/synchronize", upload.single("file"), process_ICICIStatement);

export default router;
