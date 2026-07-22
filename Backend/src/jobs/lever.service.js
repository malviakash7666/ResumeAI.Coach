/**
 * Lever Job Board API Service
 * Fetches public job postings from Lever API endpoints.
 */

const DEFAULT_LEVER_COMPANIES = [
  { company: "Spotify", siteName: "spotify" },
  { company: "Twitch", siteName: "twitch" },
  { company: "Postman", siteName: "postman" },
  { company: "Palantir", siteName: "palantir" }
];

export async function fetchLeverJobs(companies = DEFAULT_LEVER_COMPANIES) {
  const allJobs = [];

  for (const { company, siteName } of companies) {
    try {
      const url = `https://api.lever.co/v0/postings/${siteName}?mode=json`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });

      if (!res.ok) {
        console.warn(`⚠️ Lever API warning for ${company} (${res.status})`);
        continue;
      }

      const postings = await res.json();
      if (!Array.isArray(postings)) continue;

      for (const job of postings) {
        const title = job.text || "Software Engineer";
        const location = job.categories?.location || "Remote";
        const commitment = job.categories?.commitment || "Full-time";
        const applyUrl = job.hostedUrl || `https://jobs.lever.co/${siteName}/${job.id}`;
        const sourceUrl = `https://jobs.lever.co/${siteName}`;

        const rawDescription = (job.descriptionPlain || job.additionalPlain || "").slice(0, 1500);
        const skills = extractSkillsFromText(title + " " + rawDescription);

        allJobs.push({
          company,
          title,
          description: rawDescription || `${title} position at ${company}.`,
          location,
          employmentType: commitment,
          skills,
          source: "Lever",
          sourceUrl,
          applyUrl,
          createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`❌ Failed fetching Lever jobs for ${company}:`, err.message);
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
