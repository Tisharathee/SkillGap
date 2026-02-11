import axios from "axios";
import fs from "fs";
import Analysis from "../models/Analysis.js";
import { getGithubEvidence } from "../services/github.service.js";
import { buildRoadmap } from "../services/roadmap.service.js";
import { extractResumeText } from "../utils/resumeExtractor.js";

export async function createAnalysis(req, res) {
  let uploadedPath = null;
  console.log("✅ /api/analysis hit");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body keys:", Object.keys(req.body || {}));
  console.log("Has file:", !!req.file);
  if (req.file) console.log("File:", { name: req.file.originalname, type: req.file.mimetype, size: req.file.size });


  try {
    const { jdText, githubUrl } = req.body;

    if (!jdText) {
      return res.status(400).json({ error: "jdText is required" });
    }

    let resumeText = req.body.resumeText;

    if (req.file) {
      uploadedPath = req.file.path;
      resumeText = await extractResumeText(req.file);
    }    
    console.log("resumeText length:", (resumeText || "").length);
    console.log("jdText length:", (jdText || "").length);


    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        error: "Upload a resume file OR provide resumeText"
      });
    }


    const nlpUrl = process.env.NLP_URL || "http://127.0.0.1:8000";
    console.log("NLP URL:", nlpUrl);

    const nlpResp = await axios.post(`${nlpUrl}/analyze`, { resumeText, jdText });

    const { skillsJD, skillsResume, matchScore, missingSkills } = nlpResp.data;

    const evidence = await getGithubEvidence(githubUrl, skillsJD);
    const evidenceScore = evidence?.score ?? 0;

    const readinessScore = Math.round(0.6 * matchScore + 0.4 * evidenceScore);

    const roadmap = buildRoadmap(missingSkills);

    const doc = await Analysis.create({
      resumeText,
      jdText,
      githubUrl: githubUrl || "",
      extractedSkillsJD: skillsJD,
      extractedSkillsResume: skillsResume,
      missingSkills,
      matchScore,
      evidenceScore,
      readinessScore,
      roadmap,
      evidence: evidence?.details ?? {}
    });

    return res.json(doc);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Analysis failed", details: e.message });
  } finally {
    if (uploadedPath) {
      try { fs.unlinkSync(uploadedPath); } catch {}
    }
  }
}

export async function listAnalyses(req, res) {
  const docs = await Analysis.find().sort({ createdAt: -1 }).limit(20);
  res.json(docs);
}

export async function getAnalysis(req, res) {
  const doc = await Analysis.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
}
