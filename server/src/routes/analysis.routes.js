import { Router } from "express";
import upload from "../middlewares/upload.js";
import { createAnalysis, listAnalyses, getAnalysis } from "../controllers/analysis.controller.js";

const router = Router();

// POST /api/analysis  (upload file field name MUST be "resume")
router.post("/", upload.single("resume"), createAnalysis);

// GET /api/analysis  (history last 20)
router.get("/", listAnalyses);

// GET /api/analysis/:id (open one)
router.get("/:id", getAnalysis);

export default router;


