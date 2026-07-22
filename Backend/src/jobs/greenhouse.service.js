/**
 * Greenhouse Job Board API Service
 * Fetches public job postings from Greenhouse API endpoints for tech companies.
 */

const DEFAULT_GREENHOUSE_BOARDS = [
  { company: "Stripe", boardToken: "stripe" },
  { company: "Figma", boardToken: "figma" },
  { company: "Vercel", boardToken: "vercel" },
  { company: "Cloudflare", boardToken: "cloudflare" },
  { company: "GitHub", boardToken: "github" },
  { company: "Discord", boardToken: "discord" }
];

export async function fetchGreenhouseJobs(boards = DEFAULT_GREENHOUSE_BOARDS) {
  const allJobs = [];

  for (const { company, boardToken } of boards) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });

      if (!res.ok) {
        console.warn(`⚠️ Greenhouse API warning for ${company} (${res.status})`);
        continue;
      }

      const data = await res.json();
      const rawJobs = data.jobs || [];

      for (const job of rawJobs) {
        const title = job.title || "Software Engineer";
        const location = job.location?.name || "Remote / US";
        const applyUrl = job.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`;
        const sourceUrl = job.absolute_url || `https://boards.greenhouse.io/${boardToken}`;

        // Basic description text extraction
        const rawContent = job.content || "";
        const cleanDescription = rawContent.replace(/<[^>]*>?/gm, " ").slice(0, 1500);

        // Infer common skills from title & description
        const skills = extractSkillsFromText(title + " " + cleanDescription);

        allJobs.push({
          company,
          title,
          description: cleanDescription || `${title} position at ${company}. Required skills: ${skills.join(", ")}`,
          location,
          employmentType: "Full-time",
          skills,
          source: "Greenhouse",
          sourceUrl,
          applyUrl,
          createdAt: job.updated_at || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`❌ Failed fetching Greenhouse jobs for ${company}:`, err.message);
    }
  }

  return allJobs;
}

// Skill extraction helper
function extractSkillsFromText(text) {
  const commonTech = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Golang",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "GraphQL", "REST",
    "TailwindCSS", "Next.js", "Java", "C++", "Rust", "Redis", "Kafka", "CI/CD",
    "System Design", "Distributed Systems", "SQL", "NoSQL", "GCP", "Azure"
  ];
  const found = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of commonTech) {
    if (lowerText.includes(skill.toLowerCase())) {
      found.add(skill);
    }
  }
  return Array.from(found);
}
