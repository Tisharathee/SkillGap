import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5001/api/analysis";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function prettyDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ScoreRing({ label, value = 0 }) {
  const v = clamp(Number(value) || 0, 0, 100);
  const dash = `${v} ${100 - v}`;

  return (
    <div className="ringCard">
      <div className="ring">
        <svg viewBox="0 0 36 36" className="ringSvg" aria-hidden="true">
          <path
            className="ringBg"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="ringFg"
            strokeDasharray={dash}
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="ringValue">{v}%</div>
      </div>
      <div className="ringLabel">{label}</div>
    </div>
  );
}

function Tag({ text }) {
  return <span className="tag">{text}</span>;
}

function EmptyState({ title, desc }) {
  return (
    <div className="empty">
      <div className="emptyTitle">{title}</div>
      <div className="emptyDesc">{desc}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skeleton">
      <div className="skLine w60" />
      <div className="skLine w90" />
      <div className="skLine w80" />
      <div className="skLine w70" />
    </div>
  );
}

export default function App() {
  // Tabs: Analyze | History
  const [page, setPage] = useState("analyze");
  

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("sg_theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sg_theme", theme);
  }, [theme]);

  // Analyze form state
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [githubUrl, setGithubUrl] = useState("https://github.com/");
  const [resumeFile, setResumeFile] = useState(null);
  const [activeTab, setActiveTab] = useState("upload"); // upload | paste

  // Results + loading
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [data, setData] = useState(null);
  

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyErr, setHistoryErr] = useState("");

  const fileInputRef = useRef(null);

  const fileMeta = useMemo(() => {
    if (!resumeFile) return null;
    const sizeKB = Math.round(resumeFile.size / 1024);
    return `${resumeFile.name} • ${sizeKB} KB`;
  }, [resumeFile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadHistory() {
    try {
      setHistoryErr("");
      setHistoryLoading(true);
      const res = await axios.get(API);
      setHistory(res.data || []);
    } catch (e) {
      setHistoryErr(e?.response?.data?.error || "Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Load history when user opens History tab
  useEffect(() => {
    if (page === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onPickFile(f) {
    if (!f) return;
    setResumeFile(f);
    setActiveTab("upload");
    setResumeText("");
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  }

  function clearFile() {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function analyze() {
    setErr("");
    setData(null);

    if (!jdText.trim()) {
      setErr("Please paste a Job Description.");
      return;
    }

    if (activeTab === "paste" && !resumeText.trim()) {
      setErr("Please paste your resume text or switch to Upload.");
      return;
    }

    if (activeTab === "upload" && !resumeFile) {
      setErr("Please upload a resume (PDF/DOCX) or switch to Paste.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("jdText", jdText);
      formData.append("githubUrl", githubUrl);

      if (activeTab === "upload" && resumeFile) {
        formData.append("resume", resumeFile); // MUST MATCH upload.single("resume")
      } else {
        formData.append("resumeText", resumeText);
      }

      const res = await axios.post(API, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setData(res.data);
      setToast("Analysis ready ✅");

      // refresh history silently (so it appears in History tab)
      loadHistory().catch(() => {});
    } catch (e) {
      setErr(e?.response?.data?.error || "Analysis failed. Check backend + NLP service.");
    } finally {
      setLoading(false);
    }
  }

  async function copyMissingSkills() {
    const missing = data?.missingSkills || [];
    if (!missing.length) {
      setToast("No missing skills 🎉");
      return;
    }
    const ok = await copyToClipboard(missing.join(", "));
    setToast(ok ? "Copied ✅" : "Copy failed");
  }

  async function openFromHistory(id) {
    try {
      setHistoryErr("");
      setLoading(true);
      const res = await axios.get(`${API}/${id}`);
      setData(res.data);
      setPage("analyze");
      setToast("Loaded from history ✅");
    } catch (e) {
      setHistoryErr(e?.response?.data?.error || "Failed to open analysis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg">
      <div className="topbar">
        <div className="brand">
          <div className="logo">SG</div>
          <div>
            <div className="brandTitle">SkillGap</div>
            <div className="brandSub">Resume + JD + GitHub → skill gaps + roadmap</div>
            


          </div>
        </div>

        <div className="topActions">
        <div className="seg">
  <button
    className={`segBtn ${page === "analyze" ? "active" : ""}`}
    onClick={() => setPage("analyze")}
  >
    Analyze
  </button>

  <button
    className={`segBtn ${page === "dashboard" ? "active" : ""}`}
    onClick={() => setPage("dashboard")}
  >
    Dashboard
  </button>

  <button
    className={`segBtn ${page === "history" ? "active" : ""}`}
    onClick={() => setPage("history")}
  >
    History
  </button>
</div>


          <button
            className="ghost"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            type="button"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>

          <div className="statusPill">
            <span className="statusDot" />
            Backend: 5001
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="container">
        {page === "history" ? (
          <section className="card">
            <div className="cardHead">
              <h3>History (Last 20)</h3>
              <button className="ghost" onClick={loadHistory} disabled={historyLoading} type="button">
                Refresh
              </button>
            </div>

            {historyErr && <div className="alert error">{historyErr}</div>}

            {historyLoading ? (
              <Skeleton />
            ) : history.length ? (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Created</th>
                      <th>Match</th>
                      <th>Readiness</th>
                      <th>Missing</th>
                      <th>GitHub</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id}>
                        <td className="mono">{prettyDate(h.createdAt)}</td>
                        <td>{h.matchScore ?? 0}%</td>
                        <td>{h.readinessScore ?? 0}%</td>
                        <td className="mono">{(h.missingSkills || []).slice(0, 4).join(", ") || "—"}</td>
                        <td className="mono">{(h.githubUrl || "").replace("https://github.com/", "") || "—"}</td>
                        <td className="right">
                          <button className="btnSmall" onClick={() => openFromHistory(h._id)} type="button">
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No history yet" desc="Run an analysis and it will appear here." />
            )}
          </section>
        ) : (
          <>
            <div className="grid2">
            

              {/* Resume */}
              <section className="card">
                <div className="cardHead">
                  <h3>Resume</h3>
                  <div className="tabs">
                    <button
                      className={`tab ${activeTab === "upload" ? "active" : ""}`}
                      onClick={() => setActiveTab("upload")}
                      type="button"
                    >
                      Upload
                    </button>
                    <button
                      className={`tab ${activeTab === "paste" ? "active" : ""}`}
                      onClick={() => setActiveTab("paste")}
                      type="button"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                {activeTab === "upload" ? (
                  <>
                    <div
                      className={`drop ${resumeFile ? "hasFile" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDrop}
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                      <div className="dropTitle">
                        Drag & drop your resume here <span className="muted">(PDF/DOCX)</span>
                      </div>
                      <div className="dropSub">or click to browse</div>

                      <input
                        ref={fileInputRef}
                        className="fileInput"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => onPickFile(e.target.files?.[0])}
                      />
                    </div>

                    {resumeFile ? (
                      <div className="fileRow">
                        <div className="fileChip">
                          <span className="fileIcon">📄</span>
                          <span className="fileText">{fileMeta}</span>
                        </div>
                        <button className="ghost" onClick={clearFile} type="button">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <EmptyState title="No file selected" desc="Upload your resume to auto-extract skills." />
                    )}
                  </>
                ) : (
                  <>
                    <textarea
                      className="textarea"
                      value={resumeText}
                      onChange={(e) => {
                        setResumeText(e.target.value);
                        if (resumeFile) setResumeFile(null);
                      }}
                      placeholder="Paste your resume text here..."
                    />
                    <div className="helper">Tip: Paste works well if PDF text extraction fails.</div>
                  </>
                )}
              </section>

              {/* JD */}
              <section className="card">
                <div className="cardHead">
                  <h3>Job Description</h3>
                  <span className="muted">Paste any JD</span>
                </div>

                <textarea
                  className="textarea"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description here..."
                />

                <div className="row">
                  <div className="field">
                    <label>GitHub (optional)</label>
                    <input
                      className="input"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>

                {err && <div className="alert error">{err}</div>}

                <div className="actions">
                  <button className="btn" onClick={analyze} disabled={loading} type="button">
                    {loading ? (
                      <>
                        <span className="spinner" /> Analyzing…
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </button>

                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setErr("");
                      setData(null);
                      setJdText("");
                      setResumeText("");
                      setResumeFile(null);
                      setActiveTab("upload");
                      setToast("Reset ✅");
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>

                {loading && (
                  <div className="loadingBlock">
                    <Skeleton />
                  </div>
                )}
              </section>
            </div>

            {/* Results */}
            <section className="card results">
              <div className="cardHead">
                <h3>Results</h3>
                {data?.missingSkills?.length ? (
                  <button className="btnSmall" onClick={copyMissingSkills} type="button">
                    Copy Missing Skills
                  </button>
                ) : (
                  <span className="muted">Skills extracted + gaps + roadmap</span>
                )}
              </div>

              {!data ? (
                <EmptyState title="No analysis yet" desc="Upload/paste a resume, add a JD, click Analyze." />
              ) : (
                <>
                  <div className="rings">
                    <ScoreRing label="Match Score" value={data.matchScore} />
                    <ScoreRing label="Evidence Score" value={data.evidenceScore} />
                    <ScoreRing label="Readiness" value={data.readinessScore} />
                  </div>

                  <div className="grid3">
                    <div className="miniCard">
                      <div className="miniHead">Extracted Skills (JD)</div>
                      <div className="tags">
                        {(data.extractedSkillsJD || []).length ? (
                          data.extractedSkillsJD.map((s) => <Tag key={s} text={s} />)
                        ) : (
                          <span className="muted">No skills detected</span>
                        )}
                      </div>
                    </div>

                    <div className="miniCard">
                      <div className="miniHead">Extracted Skills (Resume)</div>
                      <div className="tags">
                        {(data.extractedSkillsResume || []).length ? (
                          data.extractedSkillsResume.map((s) => <Tag key={s} text={s} />)
                        ) : (
                          <span className="muted">No skills detected</span>
                        )}
                      </div>
                    </div>

                    <div className="miniCard">
                      <div className="miniHead">Missing Skills</div>
                      <div className="tags">
                        {(data.missingSkills || []).length ? (
                          data.missingSkills.map((s) => <Tag key={s} text={s} />)
                        ) : (
                          <span className="muted">No major gaps 🎉</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="split">
                    <div className="miniCard">
                      <div className="miniHead">4-Week Roadmap</div>
                      <div className="roadmap">
                        {(data.roadmap || []).map((w) => (
                          <details className="week" key={w.week} open={w.week === 1}>
                            <summary className="weekSummary">
                              <div>
                                <strong>Week {w.week}</strong>
                                <span className="muted"> • {(w.focus || []).join(" • ")}</span>
                              </div>
                              <span className="chev">▾</span>
                            </summary>
                            <ul className="weekList">
                              {(w.tasks || []).map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </details>
                        ))}
                      </div>
                    </div>

                    <div className="miniCard">
                      <div className="miniHead">GitHub Evidence</div>
                      <div className="muted">Repos found: {data.evidence?.repoCount ?? 0}</div>
                      <div className="tags" style={{ marginTop: 10 }}>
                        {(data.evidence?.inferredTech || []).length ? (
                          data.evidence.inferredTech.map((t) => <Tag key={t} text={t} />)
                        ) : (
                          <span className="muted">No tech inferred yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <footer className="footer">
              <span className="muted">
                Tip: keep NLP on <strong>8000</strong> and backend on <strong>5001</strong>.
              </span>
            </footer>
          </>
        )}
        

{page === "history" && (
  <section className="card">
    {/* ✅ YOUR EXISTING HISTORY UI (unchanged) */}
  </section>
)}
      </div>
    </div>
  );
}
