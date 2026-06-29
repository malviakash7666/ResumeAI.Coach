import { v2 as cloudinary } from "cloudinary";

// Initialize configuration
const hasCloudinarySecrets =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name_here";

if (hasCloudinarySecrets) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️ Cloudinary successfully configured");
} else {
  console.warn("⚠️ Cloudinary secrets are missing in environment variables. Falling back to local simulated file URL mode.");
}

class CloudinaryService {
  // Helper: Extract public ID from Cloudinary URL
  getPublicIdFromUrl(url) {
    if (!url) return null;
    try {
      // Example URL: https://res.cloudinary.com/cloudname/image/upload/v12345/resumes/my_resume_id.pdf
      const parts = url.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1) return null;

      // Slice all elements after 'upload/' (excluding version tag if present)
      const afterUpload = parts.slice(uploadIndex + 1);
      if (afterUpload[0].startsWith("v") && !isNaN(Number(afterUpload[0].substring(1)))) {
        afterUpload.shift(); // remove version segment
      }

      // Re-join and strip extension (e.g. resumes/my_resume_id.pdf -> resumes/my_resume_id)
      const pathWithExtension = afterUpload.join("/");
      const lastDotIndex = pathWithExtension.lastIndexOf(".");
      return lastDotIndex !== -1 ? pathWithExtension.substring(0, lastDotIndex) : pathWithExtension;
    } catch (e) {
      console.error("❌ Failed to parse public ID from URL:", e);
      return null;
    }
  }

  // Upload file buffer to Cloudinary
  async uploadResume(fileBuffer, originalName) {
    if (!hasCloudinarySecrets) {
      console.warn("⚠️ Using simulated Cloudinary upload");
      // Return a simulated cloud URL
      const mockId = `resumes/simulated_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      return {
        secure_url: `https://res.cloudinary.com/simulated_cloud/image/upload/${mockId}.pdf`,
        public_id: mockId,
      };
    }

    return new Promise((resolve, reject) => {
      const options = {
        folder: "resumes",
        resource_type: "raw", // use raw for PDFs/non-image assets
        public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, "")}`, // strip extension from filename
      };

      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      });
      stream.end(fileBuffer);
    });
  }

  // Delete file from Cloudinary
  async deleteResume(publicId) {
    if (!hasCloudinarySecrets) {
      console.warn(`⚠️ Simulated Cloudinary delete for ID: ${publicId}`);
      return { result: "ok" };
    }

    if (!publicId) return null;

    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch (error) {
      console.error("❌ Cloudinary delete failed for ID:", publicId, error);
      throw error;
    }
  }

  // Replace file: upload new and delete old
  async replaceResume(oldUrl, newFileBuffer, originalName) {
    // 1. Upload new file
    const uploadResult = await this.uploadResume(newFileBuffer, originalName);

    // 2. Delete old file if present
    if (oldUrl) {
      const oldPublicId = this.getPublicIdFromUrl(oldUrl);
      if (oldPublicId) {
        try {
          await this.deleteResume(oldPublicId);
        } catch (e) {
          console.warn("⚠️ Non-blocking warning: Failed to delete old Cloudinary asset during replacement:", e.message);
        }
      }
    }

    return uploadResult;
  }
}

export default new CloudinaryService();
