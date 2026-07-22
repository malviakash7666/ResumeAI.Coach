/**
 * Ashby Job Board API Service
 * Fetches public job postings from Ashby API / endpoints.
 */

const DEFAULT_ASHBY_COMPANIES = [
  { company: "Linear", boardName: "linear" },
  { company: "Replit", boardName: "replit" },
  { company: "Ramp", boardName: "ramp" },
  { company: "Notion", boardName: "notion" }
];

export async function fetchAshbyJobs(companies = DEFAULT_ASHBY_COMPANIES) {
  const allJobs = [];

  for (const { company, boardName } of companies) {
    try {
      // Ashby public board endpoint
      const url = `https://api.ashbyhq.com/posting-api/job-board/${boardName}?includeCompensation=true`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });

      if (!res.ok) {
        console.warn(`⚠️ Ashby API warning for ${company} (${res.status})`);
        continue;
      }

      const data = await res.json();
      const rawJobs = data.jobs || data.postings || [];

      for (const job of rawJobs) {
        const title = job.title || "Engineering Role";
        const location = job.locationName || job.location || "Remote";
        const applyUrl = job.jobUrl || `https://jobs.ashbyhq.com/${boardName}/${job.id}`;
        const sourceUrl = `https://jobs.ashbyhq.com/${boardName}`;

        const rawDescription = (job.descriptionHtml || "").replace(/<[^>]*>?/gm, " ").slice(0, 1500);
        const skills = extractSkillsFromText(title + " " + rawDescription);

        allJobs.push({
          company,
          title,
          description: rawDescription || `${title} at ${company}.`,
          location,
          employmentType: job.employmentType || "Full-time",
          skills,
          source: "Ashby",
          sourceUrl,
          applyUrl,
          createdAt: job.publishedAt || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`❌ Failed fetching Ashby jobs for ${company}:`, err.message);
    }
  }

  return allJobs;
}

function extractSkillsFromText(text) {
  const commonTech = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Golang",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "GraphQL", "REST",
    "TailwindCSS", "Next.js", "Java", "C++", "Rust", "Redis", "Kafka", "CI/CD"
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
