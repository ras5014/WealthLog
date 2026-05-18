import app from "./server.ts";
import { env } from "./config/env.ts";
import redisClient from "./db/redis.ts";

app.listen(env.PORT, () => {
  // Test Redis connection
  redisClient
    .ping()
    .then(() => {
      console.log("Connected to Redis successfully");
    })
    .catch((err) => {
      console.error("Failed to connect to Redis:", err);
    });
  console.log(`Server is running on port ${env.PORT}`);
});
