import { Router } from "express";
import multer from "multer";
import {
  addToEMI,
  addCustomEmi,
  deleteEmi,
  getEmiDashboard,
  getEmiInfo,
  synchronizeEMI_ICICI,
  autoSync_EMI_ICICI,
  updateEmiDescription,
  updateEmiInstallmentStatus,
} from "./emi.controller.ts";
import { validateBody, validateParams } from "../../middlewares/validation.ts";
import { z } from "zod";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/synchronize-emi-icici",
  upload.single("file"),
  synchronizeEMI_ICICI,
);

router.post("/auto-sync-emi-icici", autoSync_EMI_ICICI);

// TODO: Use with Transaction table "Add to EMI" button
router.post("/add-to-emi", addToEMI);

router.post(
  "/custom-emi",
  validateBody(
    z
      .object({
        bank: z.string().trim().min(1).max(64),
        description: z.string().trim().min(1).max(512),
        merchant: z.string().trim().max(128).optional(),
        totalAmount: z.coerce.number().positive(),
        installmentAmount: z.coerce.number().positive(),
        installmentCount: z.coerce.number().int().min(1).max(120),
        firstPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        paidInstallments: z.coerce.number().int().min(0),
      })
      .refine((value) => value.paidInstallments <= value.installmentCount, {
        path: ["paidInstallments"],
        message: "Paid installments cannot exceed installment count",
      }),
  ),
  addCustomEmi,
);

router.get("/get-emi-info", getEmiInfo);
router.get("/get-emi-dashboard", getEmiDashboard);
router.patch(
  "/:id/description",
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(z.object({ description: z.string().trim().min(1).max(512) })),
  updateEmiDescription,
);
router.patch(
  "/:id/installments/:emiNo/status",
  validateParams(
    z.object({
      id: z.string().uuid(),
      emiNo: z.coerce.number().int().min(1),
    }),
  ),
  validateBody(z.object({ paymentStatus: z.enum(["paid", "pending"]) })),
  updateEmiInstallmentStatus,
);
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  deleteEmi,
);

export default router;
