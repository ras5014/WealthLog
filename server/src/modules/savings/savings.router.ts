import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post("/sync-savings-icici", upload.single("file"));

export default router;
