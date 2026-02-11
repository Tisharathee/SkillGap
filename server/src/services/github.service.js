import axios from "axios";

function normalizeGithubUrl(url = "") {
  // accepts: https://github.com/username or username
  if (!url) return "";
  if (!url.includes("github.com")) return `https://github.com/${url.replace("@", "")}`;
  return url.split("?")[0].replace(/\/$/, "");
}

function extractUsername(url) {
  const clean = normalizeGithubUrl(url);
  if (!clean) return "";
  const parts = clean.split("/");
  return parts[3] || "";
}

function inferTechFromRepo(repo) {
  const tech = new Set();
  if (repo.language) tech.add(repo.language.toLowerCase());

  const name = (repo.name || "").toLowerCase();
  const desc = (repo.description || "").toLowerCase();

  const hints = [
    ["react", "react"],
    ["next", "nextjs"],
    ["node", "nodejs"],
    ["express", "express"],
    ["mongo", "mongodb"],
    ["firebase", "firebase"],
    ["fastapi", "fastapi"],
    ["flask", "flask"],
    ["django", "django"],
    ["sql", "sql"],
    ["ml", "ml"],
    ["tensorflow", "tensorflow"],
    ["pytorch", "pytorch"]
  ];

  for (const [k, v] of hints) {
    if (name.includes(k) || desc.includes(k)) tech.add(v);
  }
  return [...tech];
}

export async function getGithubEvidence(githubUrl, skillsJD = []) {
  const username = extractUsername(githubUrl);
  if (!username) {
    return { score: 0, details: { repoCount: 0, inferredTech: [], matchedSkillEvidence: [] } };
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const reposResp = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
  const repos = reposResp.data || [];

  const inferred = new Set();
  for (const r of repos.slice(0, 20)) {
    inferTechFromRepo(r).forEach(t => inferred.add(t));
  }

  // Evidence: if JD skill appears in repo name/description/language across any repo
  const matched = [];
  const lowerSkills = (skillsJD || []).map(s => s.toLowerCase());

  for (const s of lowerSkills) {
    const matchedRepos = repos
      .filter(r => {
        const blob = `${r.name || ""} ${r.description || ""} ${r.language || ""}`.toLowerCase();
        return blob.includes(s);
      })
      .slice(0, 5)
      .map(r => r.name);

    if (matchedRepos.length) {
      matched.push({ skill: s, repos: matchedRepos });
    }
  }

  // Score formula (simple + explainable)
  // - repoCount (up to 40 points)
  // - matched skills evidence (up to 60 points)
  const repoCount = repos.length;
  const repoPoints = Math.min(40, Math.round(repoCount / 2)); // 80 repos => 40 points
  const evidencePoints = Math.min(60, matched.length * 6);    // 10 skills matched => 60 points
  const score = Math.min(100, repoPoints + evidencePoints);

  return {
    score,
    details: {
      repoCount,
      inferredTech: [...inferred].slice(0, 15),
      matchedSkillEvidence: matched
    }
  };
}
