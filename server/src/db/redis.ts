import Redis from "ioredis";
import { env } from "../config/env.ts";

const redisClient = new Redis(env.REDIS_URL);
export default redisClient;
