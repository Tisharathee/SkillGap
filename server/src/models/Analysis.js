import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema(
  {
    resumeText: { type: String, required: true },
    jdText: { type: String, required: true },
    githubUrl: { type: String, default: "" },

    extractedSkillsJD: [String],
    extractedSkillsResume: [String],

    missingSkills: [String],
    matchScore: { type: Number, default: 0 },     // 0-100
    evidenceScore: { type: Number, default: 0 },  // 0-100
    readinessScore: { type: Number, default: 0 }, // 0-100

    roadmap: [
      {
        week: Number,
        focus: [String],
        tasks: [String]
      }
    ],

    evidence: {
      repoCount: { type: Number, default: 0 },
      inferredTech: [String],
      matchedSkillEvidence: [
        {
          skill: String,
          repos: [String]
        }
      ]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", AnalysisSchema);
