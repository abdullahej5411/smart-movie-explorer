// backend/config/db.js
import mongoose from "mongoose";
import Redis from "ioredis";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// ✅ Upstash Redis (TLS rediss://)
export const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {} // required for rediss://
});

redisClient.on("connect", () => console.log("Redis Connected ✅"));
redisClient.on("error", (err) =>
  console.error("Redis Error:", err.message)
);