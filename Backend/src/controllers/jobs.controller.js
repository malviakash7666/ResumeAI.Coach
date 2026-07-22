import { Op } from "sequelize";
import db from "../database/models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { fetchAndSyncAllJobs } from "../jobs/jobFetcher.service.js";
import { startJobCron } from "../jobs/cron.service.js";
import { matchJobsWithProfile } from "../jobs/matching.service.js";

const DEFAULT_PROFILE = {
  name: "Software Developer",
  skills: ["React", "TypeScript", "Node.js", "JavaScript", "PostgreSQL", "TailwindCSS"],
  experience: "Mid Level Software Engineer",
  education: "B.S. in Computer Science",
  preferredRoles: ["Frontend Engineer", "Full Stack Developer", "Software Engineer"],
  location: "Bangalore, India",
  preferredLocation: "Remote India",
  github: "https://github.com",
  linkedin: "https://linkedin.com"
};

/**
 * Get Recommended Jobs with Backend Pagination & Filters
 */
export const getRecommendedJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const country = req.query.country || "India";
    const workMode = req.query.workMode;
    const employmentType = req.query.employmentType;
    const source = req.query.source;
    const experienceLevel = req.query.experienceLevel;
    const search = req.query.search;

    let candidateProfile = null;
    let savedJobIds = [];

    // User authentication context check
    if (req.user && req.user.id) {
      candidateProfile = await db.CandidateProfile.findOne({
        where: { userId: req.user.id }
      });

      if (db.SavedJob) {
        const savedRecords = await db.SavedJob.findAll({
          where: { userId: req.user.id },
          attributes: ["jobId"]
        });
        savedJobIds = savedRecords.map(s => s.jobId);
      }
    }

    if (!candidateProfile) {
      candidateProfile = DEFAULT_PROFILE;
    }

    // Retrieve jobs from database
    let allJobs = await db.Job.findAll({
      order: [["createdAt", "DESC"]]
    });

    if (!allJobs || allJobs.length === 0) {
      let settings = null;
      if (db.JobFetchSettings) {
        try {
          settings = await db.JobFetchSettings.findOne();
        } catch (e) {
          console.warn("Could not read JobFetchSettings in getRecommendedJobs:", e.message);
        }
      }

      const isStopped = settings && (
        settings.status?.toLowerCase() === "stopped" ||
        settings.status?.toLowerCase() === "paused"
      );

      if (isStopped) {
        console.log("ℹ️ Database jobs table is empty but background crawler is disabled/stopped. Skipping auto-sync.");
        allJobs = [];
      } else {
        console.log("ℹ️ Database jobs table is empty. Syncing live jobs...");
        const synced = await fetchAndSyncAllJobs();
        allJobs = await db.Job.findAll({ order: [["createdAt", "DESC"]] });
        if (!allJobs || allJobs.length === 0) allJobs = synced;
      }
    }

    // Filter jobs by parameters
    let filtered = allJobs.map(j => (j.toJSON ? j.toJSON() : j));

    if (country && country !== "All") {
      filtered = filtered.filter(j => (j.country || "India").toLowerCase() === country.toLowerCase());
    }

    if (workMode && workMode !== "All") {
      filtered = filtered.filter(j => (j.workMode || "").toLowerCase() === workMode.toLowerCase());
    }

    if (employmentType && employmentType !== "All") {
      filtered = filtered.filter(j => (j.employmentType || "").toLowerCase() === employmentType.toLowerCase());
    }

    if (source && source !== "All") {
      filtered = filtered.filter(j => (j.source || "").toLowerCase() === source.toLowerCase());
    }

    if (experienceLevel && experienceLevel !== "All") {
      filtered = filtered.filter(j => (j.experienceLevel || "").toLowerCase() === experienceLevel.toLowerCase());
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        j =>
          (j.title || "").toLowerCase().includes(q) ||
          (j.company || "").toLowerCase().includes(q) ||
          (j.location || "").toLowerCase().includes(q) ||
          (j.skills || []).some(s => String(s).toLowerCase().includes(q))
      );
    }

    // Perform AI job matching & semantic scoring
    const matchedJobs = await matchJobsWithProfile(candidateProfile, filtered);

    // Apply Backend Pagination
    const totalJobs = matchedJobs.length;
    const totalPages = Math.ceil(totalJobs / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedJobs = matchedJobs.slice(startIndex, startIndex + limit);

    return res.status(200).json(
      new ApiResponse(200, {
        jobs: paginatedJobs,
        currentPage: page,
        totalPages,
        totalJobs,
        limit,
        profile: candidateProfile,
        savedJobIds
      }, "Recommended jobs fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Save / Bookmark a Job
 */
export const saveJob = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required to save jobs.");
    }

    const { jobId } = req.body;
    if (!jobId) {
      throw new ApiError(400, "jobId is required.");
    }

    const job = await db.Job.findByPk(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    const [savedRecord, created] = await db.SavedJob.findOrCreate({
      where: {
        userId: req.user.id,
        jobId
      }
    });

    return res.status(200).json(
      new ApiResponse(200, { savedRecord, isSaved: true }, created ? "Job saved successfully." : "Job already saved.")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Remove / Unsave a Job
 */
export const unsaveJob = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }

    const { jobId } = req.params;
    const deleted = await db.SavedJob.destroy({
      where: {
        userId: req.user.id,
        jobId
      }
    });

    return res.status(200).json(new ApiResponse(200, { isSaved: false }, "Job removed from saved jobs."));
  } catch (err) {
    next(err);
  }
};

/**
 * Get User's Saved Jobs List
 */
export const getSavedJobs = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }

    const savedRecords = await db.SavedJob.findAll({
      where: { userId: req.user.id },
      include: [{ model: db.Job, as: "job" }],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json(new ApiResponse(200, savedRecords, "Saved jobs retrieved successfully."));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Job Fetch Settings Details
 */
export const getJobFetchSettings = async (req, res, next) => {
  try {
    let settings = null;
    if (db.JobFetchSettings) {
      settings = await db.JobFetchSettings.findOne();
    }

    if (!settings) {
      settings = {
        fetchFrequency: "Every 6 hours",
        maxJobsPerRun: 500,
        status: "Active",
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000)
      };
    }

    return res.status(200).json(new ApiResponse(200, settings, "Job fetch settings retrieved."));
  } catch (err) {
    next(err);
  }
};

/**
 * Update Job Fetch Settings
 */
export const updateJobFetchSettings = async (req, res, next) => {
  try {
    const { fetchFrequency, maxJobsPerRun, status } = req.body;

    let settings = null;
    if (db.JobFetchSettings) {
      const [record] = await db.JobFetchSettings.findOrCreate({
        where: {},
        defaults: {
          fetchFrequency: fetchFrequency || "Every 6 hours",
          maxJobsPerRun: maxJobsPerRun ? parseInt(maxJobsPerRun, 10) : 500,
          status: status || "Active",
          lastRun: new Date(),
          nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000)
        }
      });
      settings = record;

      await settings.update({
        ...(fetchFrequency && { fetchFrequency }),
        ...(maxJobsPerRun && { maxJobsPerRun: parseInt(maxJobsPerRun, 10) }),
        ...(status && { status })
      });

      // Reload/reschedule the background cron job dynamically
      await startJobCron();
    }

    return res.status(200).json(new ApiResponse(200, settings, "Job fetch settings updated successfully."));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Candidate Profile
 */
export const getCandidateProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    let profile = await db.CandidateProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!profile) {
      profile = await db.CandidateProfile.create({
        userId: req.user.id,
        name: req.user.name || "Candidate",
        ...DEFAULT_PROFILE
      });
    }

    return res.status(200).json(new ApiResponse(200, profile, "Candidate profile retrieved."));
  } catch (err) {
    next(err);
  }
};

/**
 * Update Candidate Profile
 */
export const updateCandidateProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    const { name, skills, experience, education, preferredRoles, location, preferredLocation, github, linkedin } = req.body;

    let [profile, created] = await db.CandidateProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        name: name || req.user.name || "Candidate",
        skills: Array.isArray(skills) ? skills : [],
        experience: experience || "",
        education: education || "",
        preferredRoles: Array.isArray(preferredRoles) ? preferredRoles : [],
        location: location || "",
        preferredLocation: preferredLocation || "",
        github: github || "",
        linkedin: linkedin || ""
      }
    });

    if (!created) {
      await profile.update({
        ...(name && { name }),
        ...(skills && { skills: Array.isArray(skills) ? skills : profile.skills }),
        ...(experience !== undefined && { experience }),
        ...(education !== undefined && { education }),
        ...(preferredRoles && { preferredRoles: Array.isArray(preferredRoles) ? preferredRoles : profile.preferredRoles }),
        ...(location !== undefined && { location }),
        ...(preferredLocation !== undefined && { preferredLocation }),
        ...(github !== undefined && { github }),
        ...(linkedin !== undefined && { linkedin })
      });
    }

    return res.status(200).json(new ApiResponse(200, profile, "Candidate profile updated."));
  } catch (err) {
    next(err);
  }
};

/**
 * Sync Jobs Manually
 */
export const syncJobsManual = async (req, res, next) => {
  try {
    const syncedJobs = await fetchAndSyncAllJobs();
    return res.status(200).json(new ApiResponse(200, { total: syncedJobs.length }, "Jobs synchronized successfully."));
  } catch (err) {
    next(err);
  }
};

/**
 * Clear All Fetched Jobs (performed in background in chunks of 5)
 */
export const clearFetchedJobs = async (req, res, next) => {
  try {
    // Start background chunked deletion process
    deleteJobsInChunksBackground();

    return res.status(200).json(new ApiResponse(200, {}, "Job deletion started in the background."));
  } catch (err) {
    next(err);
  }
};

async function deleteJobsInChunksBackground() {
  console.log("🧹 Background Job Deletion Started in chunks of 5...");
  try {
    let deletedCountTotal = 0;
    let hasMore = true;

    while (hasMore) {
      const jobs = await db.Job.findAll({
        limit: 5,
        attributes: ["id"]
      });

      if (jobs.length === 0) {
        hasMore = false;
        break;
      }

      const jobIds = jobs.map(j => j.id);

      const deleted = await db.Job.destroy({
        where: { id: jobIds }
      });

      deletedCountTotal += deleted;
      console.log(`🧹 Deleted a chunk of ${deleted} jobs. Total deleted so far: ${deletedCountTotal}`);

      // Small delay of 50ms to prevent database lockups
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`🧹 Background Job Deletion Complete. Total jobs deleted: ${deletedCountTotal}`);
  } catch (error) {
    console.error("❌ Error in background job deletion chunk loop:", error.message);
  }
}

/**
 * Get Job Source Details
 */
export const getJobSourceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await db.Job.findByPk(id);

    if (!job) {
      throw new ApiError(404, "Job listing not found.");
    }

    return res.status(200).json(
      new ApiResponse(200, {
        id: job.id,
        company: job.company,
        title: job.title,
        source: job.source,
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
        postedDate: job.postedDate || job.createdAt
      }, "Job source details retrieved.")
    );
  } catch (err) {
    next(err);
  }
};
