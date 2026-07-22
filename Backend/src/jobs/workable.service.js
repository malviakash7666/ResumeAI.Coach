/**
 * Workable Job Board API Service
 * Fetches public job postings from Workable API endpoints.
 */

const DEFAULT_WORKABLE_COMPANIES = [
  { company: "Razorpay", siteName: "razorpay" },
  { company: "Swiggy", siteName: "swiggy" },
  { company: "CRED", siteName: "cred" },
  { company: "BrowserStack", siteName: "browserstack" },
  { company: "PhonePe", siteName: "phonepe" }
];

export async function fetchWorkableJobs(companies = DEFAULT_WORKABLE_COMPANIES) {
  const allJobs = [];

  for (const { company, siteName } of companies) {
    try {
      const url = `https://apply.workable.com/api/v3/accounts/${siteName}/jobs`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query: "", location: [], department: [], worktype: [] })
      });

      if (!res.ok) {
        console.warn(`⚠️ Workable API warning for ${company} (${res.status})`);
        continue;
      }

      const data = await res.json();
      const rawJobs = data.results || [];

      for (const job of rawJobs) {
        const title = job.title || "Software Engineer";
        const city = job.location?.city || "Bangalore";
        const countryName = job.location?.country || "India";
        const location = `${city}, ${countryName}`;
        const applyUrl = `https://apply.workable.com/${siteName}/j/${job.shortcode}/`;
        const sourceUrl = `https://apply.workable.com/${siteName}/`;

        const skills = extractSkillsFromText(title);
        const workMode = inferWorkMode(title, location);
        const experienceLevel = inferExperienceLevel(title);

        allJobs.push({
          company,
          title,
          description: `${title} role at ${company} located in ${location}. Required skills: ${skills.join(", ")}`,
          location,
          country: "India",
          workMode,
          employmentType: job.type || "Full Time",
          experienceLevel,
          skills,
          source: "Workable",
          sourceUrl,
          applyUrl,
          postedDate: job.published ? new Date(job.published).toISOString() : new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`❌ Failed fetching Workable jobs for ${company}:`, err.message);
    }
  }

  return allJobs;
}

function inferWorkMode(title, location) {
  const text = (title + " " + location).toLowerCase();
  if (text.includes("remote") || text.includes("wfh") || text.includes("work from home")) return "Remote / WFH";
  if (text.includes("onsite") || text.includes("in-office")) return "Onsite";
  return "Hybrid";
}

function inferExperienceLevel(title) {
  const t = title.toLowerCase();
  if (t.includes("intern") || t.includes("trainee")) return "Internship";
  if (t.includes("junior") || t.includes("associate") || t.includes("fresh")) return "0-1 Years";
  if (t.includes("senior") || t.includes("lead") || t.includes("principal")) return "3+ Years";
  return "1-3 Years";
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
