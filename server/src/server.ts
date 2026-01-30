import http from "http";
import app from "./app";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const server = http.createServer(app);

async function startServer() {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
