import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import movieRoutes from "./routes/movie.js";
import chatRoutes from "./routes/chat.js";
// Add near the top with your other route imports:
import authRoutes from "./routes/auth.js";


dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://smart-movie-explorer.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      (origin && origin.endsWith("vercel.app")) // 👈 The magic fix
    ) {
      callback(null, true);
    } else {
      console.error("🚨 BLOCKED CORS ORIGIN:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

await connectDB();

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.use("/api/movies", movieRoutes);

const PORT = process.env.PORT || 5000;

app.use("/api/chat", chatRoutes);

// Add with your other app.use() calls:
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});