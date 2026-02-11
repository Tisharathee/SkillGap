const BUCKETS = {
    "dsa": ["arrays", "strings", "hashmap", "two pointers", "stack", "queue", "binary search", "recursion", "dp", "graphs"],
    "backend": ["node.js", "express", "rest api", "jwt", "authentication", "mongodb", "sql", "redis"],
    "frontend": ["react", "html", "css", "tailwind", "typescript", "redux"],
    "devops": ["docker", "ci/cd", "aws", "deployment"],
    "ml": ["python", "ml", "nlp", "pytorch", "tensorflow"]
  };
  
  function pickBucket(skill) {
    const s = skill.toLowerCase();
    for (const [bucket, items] of Object.entries(BUCKETS)) {
      if (items.some(x => s.includes(x))) return bucket;
    }
    return "misc";
  }
  
  export function buildRoadmap(missingSkills = []) {
    const buckets = { dsa: [], backend: [], frontend: [], devops: [], ml: [], misc: [] };
  
    for (const skill of missingSkills.slice(0, 12)) {
      buckets[pickBucket(skill)].push(skill);
    }
  
    // 4-week roadmap (looks clean in UI)
    const plan = [
      { week: 1, focus: [], tasks: [] },
      { week: 2, focus: [], tasks: [] },
      { week: 3, focus: [], tasks: [] },
      { week: 4, focus: [], tasks: [] }
    ];
  
    // Simple sequencing: Fundamentals → Projects → Polish
    if (buckets.dsa.length) {
      plan[0].focus.push("DSA fundamentals");
      plan[0].tasks.push(`Solve 25 problems on: ${buckets.dsa.slice(0, 5).join(", ")}`);
    }
  
    if (buckets.backend.length) {
      plan[1].focus.push("Backend core");
      plan[1].tasks.push(`Build APIs for: ${buckets.backend.slice(0, 4).join(", ")}`);
      plan[1].tasks.push("Implement JWT auth + role-based access");
    }
  
    if (buckets.frontend.length) {
      plan[2].focus.push("Frontend + state");
      plan[2].tasks.push(`Build UI modules for: ${buckets.frontend.slice(0, 4).join(", ")}`);
      plan[2].tasks.push("Add forms + validation + loading/error states");
    }
  
    plan[3].focus.push("Project + deployment");
    plan[3].tasks.push("Deploy frontend (Vercel) + backend (Render) + MongoDB Atlas");
    plan[3].tasks.push("Write strong README + add screenshots + record 2-min demo video");
  
    // Fill empty focus for a nice UI
    for (const w of plan) {
      if (!w.focus.length) w.focus.push("Core improvements");
      if (!w.tasks.length) w.tasks.push("Pick 2 missing skills and create a mini-project proving them.");
    }
  
    return plan;
  }
  