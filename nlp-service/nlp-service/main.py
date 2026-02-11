from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI(title="SkillGap NLP Service")

class AnalyzeRequest(BaseModel):
    resumeText: str
    jdText: str

# A curated skills list (expand over time — makes project better)
SKILLS = sorted(set([
    "python","java","c++","javascript","typescript",
    "react","next.js","node.js","express","mongodb","sql","postgresql","mysql",
    "rest api","graphql","jwt","authentication","firebase",
    "docker","aws","gcp","ci/cd",
    "machine learning","nlp","pytorch","tensorflow","scikit-learn",
    "data structures","algorithms","dp","graphs","system design",
    "html","css","tailwind","redux","git"
]))

def normalize(text: str) -> str:
    t = text.lower()

    # normalize common separators to spaces
    t = t.replace("/", " ").replace("-", " ").replace("_", " ")

    # normalize dot-variants like node.js / next.js
    t = t.replace("node.js", "node js").replace("next.js", "next js")

    # keep + and # for c++ / c#
    t = re.sub(r"[^a-z0-9\+\#\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


# Add aliases for skills that appear in multiple forms in JDs
ALIASES = {
    "node.js": ["node js", "nodejs", "node"],
    "next.js": ["next js", "nextjs"],
    "ci/cd": ["ci cd", "cicd", "ci"],
    "rest api": ["rest", "restful", "rest api"],
    "mongodb": ["mongo", "mongodb", "mongoose"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "postgresql": ["postgres", "postgresql"],
    "machine learning": ["machine learning", "ml"],
    "data structures": ["data structures", "dsa"],
}


def extract_skills(text: str):
    t = " " + normalize(text) + " "  # pad for boundary matching
    found = set()

    for s in SKILLS:
        variants = ALIASES.get(s, [s])

        for v in variants:
            v = normalize(v)
            # token boundary match: not inside a larger word
            if re.search(rf"(?<!\w){re.escape(v)}(?!\w)", t):
                found.add(s)
                break

    return sorted(found)


def score_match(skills_jd, skills_resume):
    if not skills_jd:
        return 0
    jd = set(skills_jd)
    rs = set(skills_resume)
    inter = jd.intersection(rs)
    return round((len(inter) / len(jd)) * 100)

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    skills_jd = extract_skills(req.jdText)
    skills_resume = extract_skills(req.resumeText)

    match = score_match(skills_jd, skills_resume)
    missing = sorted(list(set(skills_jd) - set(skills_resume)))

    return {
        "skillsJD": skills_jd,
        "skillsResume": skills_resume,
        "matchScore": match,
        "missingSkills": missing
    }
