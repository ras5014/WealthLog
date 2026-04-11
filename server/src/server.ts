import express from "express";
import cors from "cors";

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

export { app };

export default app;
