import { useState, useEffect } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface JobItem {
  id: string;
  company: string;
  title: string;
  description: string;
  location: string;
  country: string;
  workMode: string;
  employmentType: string;
  experienceLevel: string;
  skills: string[];
  source: string;
  sourceUrl: string;
  applyUrl: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
  postedDate: string;
}

interface JobsProps {
  token: string | null;
  user: any;
  onNavigateToProfile?: () => void;
  onNavigateToApplications?: () => void;
  onNavigateToSaved?: () => void;
}

export default function Jobs({
  token,
  user,
  onNavigateToProfile,
  onNavigateToApplications,
  onNavigateToSaved
}: JobsProps) {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const limit = 10;

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("India");
  const [workModeFilter, setWorkModeFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");

  // Cron Settings Modal State
  const [showCronModal, setShowCronModal] = useState(false);
  const [fetchFrequency, setFetchFrequency] = useState("Every 6 hours");
  const [maxJobsPerRun, setMaxJobsPerRun] = useState(500);
  const [cronStatus, setCronStatus] = useState("Active");
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [nextRunTime, setNextRunTime] = useState<string | null>(null);
  const [savingCron, setSavingCron] = useState(false);
  const [clearing, setClearing] = useState(false);

  // View Source Modal state
  const [sourceModalJob, setSourceModalJob] = useState<JobItem | null>(null);

  // Saved Jobs tracking
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const fetchRecommendedJobs = async (pageToFetch = 1) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: String(limit),
        country: countryFilter,
        workMode: workModeFilter,
        experienceLevel: experienceFilter,
        source: sourceFilter,
        employmentType: jobTypeFilter,
        search: searchTerm
      });

      const res = await fetch(`${BACKEND_URL}/jobs/recommended?${params.toString()}`, { headers });
      const json = await res.json();

      if (json.success) {
        setJobs(json.data.jobs || []);
        setProfile(json.data.profile || null);
        setCurrentPage(json.data.currentPage || 1);
        setTotalPages(json.data.totalPages || 1);
        setTotalJobs(json.data.totalJobs || 0);

        if (Array.isArray(json.data.savedJobIds)) {
          setSavedJobIds(new Set(json.data.savedJobIds));
        }
      } else {
        throw new Error(json.message || "Failed to load job recommendations.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not connect to job recommendation service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCronSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/jobs/fetch-settings`);
      const json = await res.json();
      if (json.success && json.data) {
        setFetchFrequency(json.data.fetchFrequency || "Every 6 hours");
        setMaxJobsPerRun(json.data.maxJobsPerRun || 500);
        setCronStatus(json.data.status || "Active");
        setLastRunTime(json.data.lastRun ? new Date(json.data.lastRun).toLocaleString() : "Just now");
        setNextRunTime(json.data.nextRun ? new Date(json.data.nextRun).toLocaleString() : "In 6 hours");
      }
    } catch (e) {
      console.error("Failed fetching cron settings:", e);
    }
  };

  useEffect(() => {
    fetchRecommendedJobs(currentPage);
    fetchCronSettings();
  }, [token, countryFilter, workModeFilter, experienceFilter, sourceFilter, jobTypeFilter]);

  const handleSaveCronSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCron(true);
    try {
      const res = await fetch(`${BACKEND_URL}/jobs/fetch-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fetchFrequency, maxJobsPerRun, status: cronStatus })
      });
      const json = await res.json();
      if (json.success) {
        alert("Cron fetch settings updated successfully!");
        setShowCronModal(false);
      } else {
        alert(json.message || "Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSavingCron(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecommendedJobs(1);
  };

  const handleSyncJobs = async () => {
    setSyncing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/jobs/sync`, { method: "POST", headers });
      const json = await res.json();

      if (json.success) {
        await fetchRecommendedJobs(1);
      } else {
        alert(json.message || "Sync failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing job boards.");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearJobs = async () => {
    if (!window.confirm("Are you sure you want to delete all fetched job data? This will clear the job board list.")) {
      return;
    }
    setClearing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/jobs/clear`, { method: "DELETE", headers });
      const json = await res.json();

      if (json.success) {
        // Poll database to verify deletion progress
        let jobsRemaining = true;
        let attempts = 0;
        while (jobsRemaining && attempts < 15) {
          // Wait 1 second before polling
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const checkRes = await fetch(`${BACKEND_URL}/jobs/recommended?page=1&limit=1`, { headers });
          const checkJson = await checkRes.json();
          if (checkJson.success && (checkJson.data.totalJobs === 0 || checkJson.data.jobs?.length === 0)) {
            jobsRemaining = false;
          }
          attempts++;
        }

        alert("All fetched jobs deleted successfully!");
        await fetchRecommendedJobs(1);
      } else {
        alert(json.message || "Failed to clear jobs.");
      }
    } catch (err) {
      console.error(err);
      alert("Error clearing job data.");
    } finally {
      setClearing(false);
    }
  };

  const handleToggleSaveJob = async (jobId: string) => {
    if (!token) {
      alert("Please login to save jobs.");
      return;
    }

    const isCurrentlySaved = savedJobIds.has(jobId);
    try {
      if (isCurrentlySaved) {
        await fetch(`${BACKEND_URL}/jobs/saved/${jobId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await fetch(`${BACKEND_URL}/jobs/saved`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ jobId })
        });
        setSavedJobIds(prev => new Set(prev).add(jobId));
      }
    } catch (err) {
      console.error("Save job error:", err);
    }
  };

  const handleApplyNow = async (job: JobItem) => {
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    }

    if (token) {
      try {
        await fetch(`${BACKEND_URL}/applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ jobId: job.id, status: "Applied" })
        });
        setAppliedJobIds(prev => new Set(prev).add(job.id));
      } catch (e) {
        console.error("Auto tracking failed:", e);
      }
    }
  };

  // Build clean page numbers array (1, 2, 3, 4, 5, etc.)
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fade-in text-slate-800 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full">
              ✦ AI VERIFIED JOB DISCOVERY
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
              🇮🇳 INDIA JOBS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Verified Tech Career Portal</h1>
          <p className="text-slate-300 text-xs mt-1 font-medium max-w-xl">
            Authentic jobs directly fetched from Greenhouse, Lever, Ashby, Workable, and Company Career Pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCronModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Cron Settings</span>
          </button>
          <button
            onClick={handleSyncJobs}
            disabled={syncing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span className={syncing ? "animate-spin" : ""}>🔄</span>
            <span>{syncing ? "Syncing..." : "Sync Jobs"}</span>
          </button>
          <button
            onClick={handleClearJobs}
            disabled={clearing}
            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <span>🗑️</span>
            <span>{clearing ? "Clearing..." : "Clear Jobs"}</span>
          </button>
          {onNavigateToSaved && (
            <button
              onClick={onNavigateToSaved}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              ⭐ Saved Jobs
            </button>
          )}
        </div>
      </div>

      {/* Candidate Profile Bar */}
      {profile && (
        <div className="card-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50/50 border-indigo-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm">{profile.name || "Candidate Profile"}</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">
                {profile.experience || "Extracted Candidate"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Matched Skills:</span>
              {(profile.skills || []).slice(0, 8).map((skill: string, i: number) => (
                <span key={i} className="text-[10px] bg-white font-bold text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/60 px-3.5 py-2 rounded-xl transition-colors self-start md:self-auto border border-indigo-200 cursor-pointer"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card-white p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by job title, company, skills, location (e.g. React Developer Bangalore)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
            <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="India">🇮🇳 India Jobs</option>
              <option value="All">Global Jobs</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Work Mode</label>
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Modes</option>
              <option value="Remote / WFH">Remote / WFH</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Experience</label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Experience</option>
              <option value="Internship">Internship</option>
              <option value="0-1 Years">0-1 Years</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3+ Years">3+ Years</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Verified Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Sources</option>
              <option value="Company Career Page">Company Career Page</option>
              <option value="Greenhouse">Greenhouse</option>
              <option value="Lever">Lever</option>
              <option value="Ashby">Ashby</option>
              <option value="Workable">Workable</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Job Type</label>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Internship">Internship</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <div>
          Showing page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
          <span className="font-bold text-slate-900">{totalPages}</span> ({totalJobs} total jobs)
        </div>
      </div>

      {/* Scrollable Jobs Area */}
      <div className="max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
        {loading ? (
          <div className="card-white p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">AI Matching Jobs...</h3>
            <p className="text-xs text-slate-400">Filtering verified career sources based on your preferences.</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between text-xs font-bold">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => fetchRecommendedJobs(currentPage)} className="underline text-red-600 cursor-pointer">Retry</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card-white p-12 text-center space-y-3">
            <span className="text-3xl">🔍</span>
            <h3 className="font-bold text-slate-800 text-sm">No matching jobs found</h3>
            <p className="text-xs text-slate-400">Try resetting your filters or click "Sync Jobs" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const isTopMatch = job.matchScore >= 85;
              const isSaved = savedJobIds.has(job.id);
              const isApplied = appliedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  className="card-white flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-900 text-base mb-1">{job.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                          <span>🏢 {job.company}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">📍 {job.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 ${
                            isTopMatch
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                              : job.matchScore >= 70
                              ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span>⚡</span>
                          <span>{job.matchScore}% Match</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          {isTopMatch ? "High Compatibility" : "Good Fit"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                        🏢 Verified: {job.source}
                      </span>
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        💼 {job.workMode || "Hybrid"}
                      </span>
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        🎯 {job.experienceLevel || "1-3 Years"}
                      </span>
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        ⏱️ {job.employmentType || "Full Time"}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched Skills:</span>
                        {(job.matchedSkills || []).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1"
                          >
                            <span>✓</span>
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>

                      {(job.missingSkills || []).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing:</span>
                          {(job.missingSkills || []).slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-50 text-amber-700 border border-amber-200/80 font-medium px-2 py-0.5 rounded-md text-[10px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {job.reason && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 font-medium flex items-start gap-2">
                        <span className="text-amber-500 text-sm mt-0.5">💡</span>
                        <p className="leading-relaxed">{job.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSourceModalJob(job)}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        View Source
                      </button>
                      <button
                        onClick={() => handleToggleSaveJob(job.id)}
                        className={`font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                          isSaved
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {isSaved ? "⭐ Saved" : "Save Job"}
                      </button>
                    </div>

                    <button
                      onClick={() => handleApplyNow(job)}
                      className={`font-bold px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        isApplied
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                      }`}
                    >
                      <span>{isApplied ? "✓ Applied" : "Apply Now"}</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Pagination Bar (Previous, 1, 2, 3, 4, 5, Next) */}
      <div className="card-white p-3 flex items-center justify-between gap-4">
        <button
          onClick={() => fetchRecommendedJobs(currentPage - 1)}
          disabled={currentPage <= 1}
          className="border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => fetchRecommendedJobs(pg)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pg === currentPage
                  ? "bg-indigo-600 text-white font-black shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {pg}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchRecommendedJobs(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Cron Settings Control Modal */}
      {showCronModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCronSettings} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm">
                  ⚙️
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cron Job Fetch Settings</h3>
                  <p className="text-[10px] text-slate-400">Configure background fetcher schedule and limits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCronModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fetch Frequency</label>
                <input
                  type="text"
                  required
                  value={fetchFrequency}
                  onChange={(e) => setFetchFrequency(e.target.value)}
                  placeholder="e.g. 5.9 pm, 10:30 am, or Every 3 hours"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter a time like <code className="bg-slate-100 px-1 rounded text-slate-600">5.9 pm</code> or <code className="bg-slate-100 px-1 rounded text-slate-600">10:30 am</code>, comma-separated times, or an interval like <code className="bg-slate-100 px-1 rounded text-slate-600">Every 6 hours</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Background Crawler Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCronStatus(cronStatus === "Active" ? "Stopped" : "Active")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      cronStatus === "Active"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    {cronStatus === "Active" ? "🟢 Active (Running)" : "🔴 Stopped (Paused)"}
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Toggle to temporarily pause or resume the background job sync.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Jobs Per Run <span className="text-slate-400 font-normal">(Enter exact number of jobs to fetch)</span></label>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  step={10}
                  value={maxJobsPerRun}
                  onChange={(e) => setMaxJobsPerRun(Math.max(1, Number(e.target.value)))}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Cron Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded border ${
                    cronStatus === "Active" 
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200" 
                      : "text-rose-600 bg-rose-50 border-rose-200"
                  }`}>{cronStatus}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Last Execution:</span>
                  <span className="font-medium">{lastRunTime}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Next Scheduled Run:</span>
                  <span className="font-medium">{cronStatus === "Active" ? nextRunTime : "Suspended"}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCronModal(false)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCron}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {savingCron ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Source Modal */}
      {sourceModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm">
                  🔗
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Verified Source Transparency</h3>
                  <p className="text-[10px] text-slate-400">Official Company Board Integration</p>
                </div>
              </div>
              <button
                onClick={() => setSourceModalJob(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Role & Company</label>
                <div className="font-black text-slate-900 text-sm">{sourceModalJob.title}</div>
                <div className="text-indigo-600 font-bold">{sourceModalJob.company} • {sourceModalJob.location}</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Source Platform:</span>
                  <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {sourceModalJob.source} Verified
                  </span>
                </div>
                {sourceModalJob.sourceUrl && (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-600">Board Listing Endpoint:</span>
                    <a
                      href={sourceModalJob.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline truncate font-mono text-[11px]"
                    >
                      {sourceModalJob.sourceUrl}
                    </a>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="font-bold text-slate-600">Direct Application Page:</span>
                  <a
                    href={sourceModalJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate font-mono text-[11px]"
                  >
                    {sourceModalJob.applyUrl}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sourceModalJob.applyUrl);
                  alert("Application URL copied!");
                }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                📋 Copy Link
              </button>
              <button
                onClick={() => {
                  handleApplyNow(sourceModalJob);
                  setSourceModalJob(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Visit & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
