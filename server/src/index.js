import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import analysisRoutes from "./routes/analysis.routes.js";

dotenv.config();

const app = express();

/* ✅ CORS — must be BEFORE routes */
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

/* ✅ JSON body parser */
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

/* ✅ Routes */
app.use("/api/analysis", analysisRoutes);


const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
  } catch (e) {
    console.error("❌ DB connection failed:", e.message);
    process.exit(1);
  }
}

start();
