import { callGroqAPI } from "../modules/resume.controller.js";

/**
 * AI Job Matching Engine & Semantic Reasoning
 * Computes matchScore, matchedSkills, missingSkills, and AI rationale using candidate profile and job data.
 */
export async function matchJobsWithProfile(profile, jobs) {
  if (!jobs || jobs.length === 0) return [];

  const candidateSkills = (profile.skills || []).map(s => String(s).toLowerCase());
  const preferredRoles = (profile.preferredRoles || []).map(r => String(r).toLowerCase());

  // Step 1: Pre-rank jobs using keyword/semantic overlap score
  const scoredJobs = jobs.map(job => {
    const jobSkills = (job.skills || []).map(s => String(s).toLowerCase());
    const jobTitle = String(job.title || "").toLowerCase();
    const jobDesc = String(job.description || "").toLowerCase();

    // Check matched vs missing skills
    const matched = [];
    const missing = [];

    for (const skill of job.skills || []) {
      const lowerSkill = String(skill).toLowerCase();
      if (candidateSkills.some(cs => cs.includes(lowerSkill) || lowerSkill.includes(cs))) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    // Role alignment score
    let roleScore = 0;
    for (const prefRole of preferredRoles) {
      if (jobTitle.includes(prefRole) || prefRole.includes(jobTitle)) {
        roleScore += 40;
        break;
      }
    }

    // Skill overlap ratio
    const skillRatio = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 50 : 30;

    // Direct candidate skill presence in job description
    let textOverlapScore = 0;
    for (const cSkill of candidateSkills) {
      if (jobDesc.includes(cSkill) || jobTitle.includes(cSkill)) {
        textOverlapScore += 5;
      }
    }

    const rawMatchScore = Math.min(98, Math.max(45, Math.round(roleScore + skillRatio + textOverlapScore)));

    return {
      ...job.toJSON ? job.toJSON() : job,
      matchScore: rawMatchScore,
      matchedSkills: matched.length > 0 ? matched : (job.skills || []).slice(0, 3),
      missingSkills: missing,
      reason: `Your background in ${(profile.skills || []).slice(0, 3).join(", ")} aligns well with ${job.company}'s requirements for ${job.title}.`
    };
  });

  // Sort by highest match score
  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  // Step 2: Use Groq LLM reasoning to enhance top 5 job matches with deep AI explanations if Groq is available
  try {
    const topJobs = scoredJobs.slice(0, 5);
    const messages = [
      {
        role: "system",
        content: "You are an AI Career Advisor & Technical Recruiter. Evaluate job matches for a candidate profile and return concise JSON reasonings."
      },
      {
        role: "user",
        content: `Evaluate the following Candidate Profile against these 5 top Job Matches.

Candidate Profile:
- Skills: ${JSON.stringify(profile.skills || [])}
- Experience: ${profile.experience || "Software Engineer"}
- Preferred Roles: ${JSON.stringify(profile.preferredRoles || [])}

Jobs to evaluate:
${JSON.stringify(topJobs.map(j => ({ id: j.id, company: j.company, title: j.title, skills: j.skills })))}

Return a JSON object structured as:
{
  "evaluations": [
    {
      "id": "job_id",
      "matchScore": 92,
      "matchedSkills": ["Skill1", "Skill2"],
      "missingSkills": ["Skill3"],
      "reason": "Detailed 1-2 sentence explanation of why this candidate fits this role."
    }
  ]
}
Respond ONLY with the JSON object.`
      }
    ];

    const groqResponse = await callGroqAPI(messages, "json_object");
    const parsed = JSON.parse(groqResponse);

    if (parsed && Array.isArray(parsed.evaluations)) {
      for (const evalItem of parsed.evaluations) {
        const targetJobIndex = scoredJobs.findIndex(j => String(j.id) === String(evalItem.id));
        if (targetJobIndex !== -1) {
          scoredJobs[targetJobIndex].matchScore = Math.min(99, Math.max(50, evalItem.matchScore || scoredJobs[targetJobIndex].matchScore));
          scoredJobs[targetJobIndex].matchedSkills = evalItem.matchedSkills || scoredJobs[targetJobIndex].matchedSkills;
          scoredJobs[targetJobIndex].missingSkills = evalItem.missingSkills || scoredJobs[targetJobIndex].missingSkills;
          scoredJobs[targetJobIndex].reason = evalItem.reason || scoredJobs[targetJobIndex].reason;
        }
      }
    }
  } catch (groqErr) {
    console.warn("⚠️ Groq LLM reasoning fallback to heuristic matching:", groqErr.message);
  }

  return scoredJobs;
}
