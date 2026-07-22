import db from "../database/models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/**
 * Get Tracked Applications for User
 */
export const getUserApplications = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    const applications = await db.Application.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Job,
          as: "job",
          attributes: ["id", "company", "title", "location", "source", "sourceUrl", "applyUrl"]
        }
      ],
      order: [["updatedAt", "DESC"]]
    });

    return res.status(200).json(new ApiResponse(200, applications, "Tracked applications retrieved successfully."));
  } catch (err) {
    next(err);
  }
};

/**
 * Track / Apply to a Job
 */
export const createApplication = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    const { jobId, status } = req.body;
    if (!jobId) {
      throw new ApiError(400, "jobId is required.");
    }

    const job = await db.Job.findByPk(jobId);
    if (!job) {
      throw new ApiError(404, "Job listing not found.");
    }

    const [application, created] = await db.Application.findOrCreate({
      where: {
        userId: req.user.id,
        jobId: jobId
      },
      defaults: {
        status: status || "Applied",
        appliedDate: new Date()
      }
    });

    if (!created && status) {
      await application.update({ status, appliedDate: new Date() });
    }

    const result = await db.Application.findByPk(application.id, {
      include: [{ model: db.Job, as: "job" }]
    });

    return res.status(200).json(new ApiResponse(200, result, "Application tracked successfully."));
  } catch (err) {
    next(err);
  }
};

/**
 * Update Application Status
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Saved", "Applied", "Interview", "Rejected", "Offer"];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const application = await db.Application.findOne({
      where: { id, userId: req.user.id }
    });

    if (!application) {
      throw new ApiError(404, "Application record not found.");
    }

    await application.update({ status });

    return res.status(200).json(new ApiResponse(200, application, `Application status updated to ${status}.`));
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Application Record
 */
export const deleteApplication = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Not authenticated.");
    }

    const { id } = req.params;
    const application = await db.Application.findOne({
      where: { id, userId: req.user.id }
    });

    if (!application) {
      throw new ApiError(404, "Application record not found.");
    }

    await application.destroy();

    return res.status(200).json(new ApiResponse(200, null, "Application record removed successfully."));
  } catch (err) {
    next(err);
  }
};
