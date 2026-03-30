import express from "express";

const app = express();

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
