import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Server started!" });
});

app.use(
  "/api/accounts/v1",
  require("./routes/accounts/accounts.router").default,
);

export default app;
