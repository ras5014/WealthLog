import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/errorHandler.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use(
  "/api/v1/credit-card",
  (await import("./modules/credit_card/creditCard.router.ts")).default,
);

app.use("/api/v1/emi", (await import("./modules/emi/emi.router.ts")).default);

app.use(errorHandler);
app.use(notFound);

export { app };

export default app;
