# SkillGap

SkillGap is a Full Stack AI-powered web application that:

- Analyzes Resume + Job Description
- Detects Skill Gaps
- Generates Match Score
- Calculates Readiness Score
- Provides 4-Week Improvement Roadmap
- Extracts GitHub Evidence

---

## Tech Stack

Frontend:
- React (Vite)
- Modern UI + Dark Mode
- Dashboard + History

Backend:
- Node.js
- Express
- MongoDB
- Multer (File Upload)
- GitHub API Integration

NLP Service:
- FastAPI
- Python
- Custom Skill Extraction Engine

---

## Features

- Resume upload (PDF/DOCX)
- Resume text paste option
- GitHub repo skill evidence
- Dashboard view
- History tracking
- Dark/Light mode
- Roadmap generator

---

## Local Setup

### 1. Start NLP Service

cd nlp-service
python3 -m uvicorn main:app --reload --port 8000

### 2. Start Backend

cd server
npm install
npm run dev

### 3. Start Frontend

cd client
npm install
npm run dev

---

##  Ports Used

Frontend: 5173  
Backend: 5001  
NLP: 8000  

---

## Author

Tanishka
