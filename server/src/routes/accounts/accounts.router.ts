import { Router } from "express";
import multer from "multer";
import path from "path";
import { fetchBalance, uploadStatement } from "./accounts.controller";

// Initialize multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const accountsRouter = Router();

accountsRouter.post(
  "/statements/upload",
  upload.single("statement"),
  uploadStatement,
);
accountsRouter.get("/balances", fetchBalance);

export default accountsRouter;
