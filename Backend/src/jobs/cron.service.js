import cron from "node-cron";
import { fetchAndSyncAllJobs } from "./jobFetcher.service.js";
import db from "../database/models/index.js";

let activeCronTask = null;

/**
 * Parser to translate custom user strings (like "5.9 pm", "10:30 am", "Every 6 hours") 
 * or raw cron strings into standard cron expressions.
 */
export function parseFrequencyToCron(frequency) {
  if (!frequency) return "0 */6 * * *";

  const cleaned = frequency.trim().toLowerCase();

  // 1. If it's already a standard 5 or 6 field cron expression
  const cronRegex = /^(\S+\s+){4}\S+$/;
  if (cronRegex.test(cleaned)) {
    return cleaned;
  }

  // 2. Interval matching: e.g. "every 6 hours", "every 2 hours"
  const everyMatch = cleaned.match(/every\s+(\d+)\s*(hour|hr|minute|min|day|d)s?/);
  if (everyMatch) {
    const value = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    if (unit.startsWith("hour") || unit.startsWith("hr")) {
      return `0 */${value} * * *`;
    } else if (unit.startsWith("minute") || unit.startsWith("min")) {
      return `*/${value} * * * *`;
    } else if (unit.startsWith("day") || unit.startsWith("d")) {
      return `0 0 */${value} * *`;
    }
  }

  // 3. Time matching: e.g., "5.9 pm", "5:30 PM", "9 am, 5 pm", "5,9 pm", "17:30"
  // Split by commas in case the user specified multiple times
  const parts = cleaned.split(",");
  const cronTimes = parts.map(part => parseSingleTime(part)).filter(t => t !== null);

  if (cronTimes.length > 0) {
    // If multiple times are specified, we join hours/minutes.
    // E.g. "9 17,21 * * *" (runs at 5:09 PM and 9:09 PM)
    const minutes = [...new Set(cronTimes.map(ct => ct.minute))];
    const hours = [...new Set(cronTimes.map(ct => ct.hour))];
    
    return `${minutes.join(",")} ${hours.join(",")} * * *`;
  }

  // Fallback to default
  return "0 */6 * * *";
}

function parseSingleTime(timeStr) {
  const str = timeStr.trim().toLowerCase();
  
  const isPM = str.includes("pm");
  const isAM = str.includes("am");
  
  const cleanStr = str.replace(/(am|pm)/g, "").trim();
  
  // Matches "5:30", "5.30", "5.9", "5", "17", "17:30"
  const timeMatch = cleanStr.match(/^(\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (!timeMatch) return null;
  
  let hour = parseInt(timeMatch[1], 10);
  let minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  
  if (isPM) {
    if (hour < 12) hour += 12;
  } else if (isAM) {
    if (hour === 12) hour = 0;
  }
  
  if (hour < 0 || hour > 23) hour = 0;
  if (minute < 0 || minute > 59) minute = 0;
  
  return { hour, minute };
}

/**
 * Helper to estimate next run time in milliseconds
 */
function getIntervalMs(frequency) {
  const cleaned = frequency.trim().toLowerCase();
  const everyMatch = cleaned.match(/every\s+(\d+)\s*(hour|hr|minute|min|day|d)s?/);
  if (everyMatch) {
    const value = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    if (unit.startsWith("hour") || unit.startsWith("hr")) return value * 60 * 60 * 1000;
    if (unit.startsWith("minute") || unit.startsWith("min")) return value * 60 * 1000;
    if (unit.startsWith("day") || unit.startsWith("d")) return value * 24 * 60 * 60 * 1000;
  }
  return 6 * 60 * 60 * 1000; // default 6 hours
}

export async function startJobCron() {
  console.log("⏰ Setting up Dynamic Job Fetcher Cron...");

  if (activeCronTask) {
    console.log("⏰ Stopping existing cron task...");
    activeCronTask.stop();
    activeCronTask = null;
  }

  let settings = null;
  if (db.JobFetchSettings) {
    try {
      settings = await db.JobFetchSettings.findOne();
      if (!settings) {
        settings = await db.JobFetchSettings.create({
          fetchFrequency: "Every 6 hours",
          maxJobsPerRun: 500,
          status: "Active"
        });
      }
    } catch (err) {
      console.warn("⚠️ JobFetchSettings DB query error:", err.message);
      return;
    }
  }

  if (!settings) return;

  const statusLower = settings.status?.toLowerCase();
  if (statusLower === "stopped" || statusLower === "paused" || statusLower === "disabled") {
    console.log("⏰ Cron Status is STOPPED/PAUSED/DISABLED. Background job fetching is disabled.");
    return;
  }

  const cronExpression = parseFrequencyToCron(settings.fetchFrequency);
  console.log(`⏰ Starting Cron Task: Expression "${cronExpression}" (Frequency: "${settings.fetchFrequency}", Status: "${settings.status}")`);

  activeCronTask = cron.schedule(cronExpression, async () => {
    console.log("⏰ Scheduled Cron Execution Started: Fetching live jobs...");
    const startTime = new Date();
    try {
      await fetchAndSyncAllJobs();

      const nextTime = new Date(startTime.getTime() + getIntervalMs(settings.fetchFrequency));
      await settings.update({
        lastRun: startTime,
        nextRun: nextTime,
        status: "Active"
      });
      console.log(`⏰ Cron execution complete. Next run: ${nextTime.toLocaleString()}`);
    } catch (err) {
      console.error("❌ Job Fetch Execution Error:", err.message);
      await settings.update({ status: "Error" });
    }
  });
}

export async function initJobCron() {
  // Run on startup
  await startJobCron();

  // Run initial startup sync check
  setTimeout(async () => {
    try {
      let settings = null;
      if (db.JobFetchSettings) {
        settings = await db.JobFetchSettings.findOne();
      }

      // Check if background worker is disabled
      const statusLower = settings?.status?.toLowerCase();
      if (statusLower === "stopped" || statusLower === "paused" || statusLower === "disabled") {
        console.log("🌱 Jobs database table is empty but background crawler is disabled/stopped. Skipping boot sync.");
        return;
      }

      if (db.Job) {
        const count = await db.Job.count();
        if (count === 0) {
          console.log("🌱 Jobs database table is empty. Running initial sync on boot...");
          await fetchAndSyncAllJobs();
          
          if (settings) {
            const startTime = new Date();
            await settings.update({
              lastRun: startTime,
              nextRun: new Date(startTime.getTime() + getIntervalMs(settings.fetchFrequency)),
              status: "Active"
            });
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Initial startup job sync check:", err.message);
    }
  }, 5000);
}
