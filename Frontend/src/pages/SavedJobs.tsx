import { useState, useEffect } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface SavedJobRecord {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
  job: {
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
    postedDate: string;
  };
}

interface SavedJobsProps {
  token: string | null;
  setPage: (page: any) => void;
}

export default function SavedJobs({ token, setPage }: SavedJobsProps) {
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSavedJobs = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/jobs/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSavedJobs(json.data || []);
      } else {
        throw new Error(json.message || "Failed to load saved jobs.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not fetch saved jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [token]);

  const handleUnsave = async (jobId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/jobs/saved/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSavedJobs(prev => prev.filter(item => item.jobId !== jobId));
      } else {
        alert(json.message || "Failed to remove saved job.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing saved job.");
    }
  };

  const handleApplyNow = async (job: any) => {
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
      } catch (e) {
        console.error("Auto tracking error:", e);
      }
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="text-4xl">⭐</div>
        <h2 className="text-2xl font-black text-slate-900">Saved Jobs</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Please login to bookmark and organize your saved target jobs.
        </p>
        <button
          onClick={() => setPage("login")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
        >
          Login to View Saved Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saved Jobs</h1>
          <p className="text-slate-500 text-xs mt-1">Bookmarked career opportunities for quick reference.</p>
        </div>
        <button
          onClick={() => setPage("jobs")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          + Explore More Jobs
        </button>
      </div>

      {loading ? (
        <div className="card-white p-16 text-center text-slate-400 text-xs font-medium">Loading saved jobs...</div>
      ) : errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold">{errorMsg}</div>
      ) : savedJobs.length === 0 ? (
        <div className="card-white p-16 text-center space-y-3">
          <span className="text-3xl">⭐</span>
          <h3 className="font-bold text-slate-800 text-sm">No saved jobs yet</h3>
          <p className="text-xs text-slate-400">Click "Save Job" on any job card in the Recommended Jobs tab to add it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedJobs.map((record) => {
            const job = record.job;
            if (!job) return null;

            return (
              <div
                key={record.id}
                className="card-white flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-base mb-1">{job.title}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                        <span>🏢 {job.company}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">📍 {job.location || "India"}</span>
                      </div>
                    </div>

                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                      {job.source}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      💼 {job.workMode || "Hybrid"}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      🎯 {job.experienceLevel || "1-3 Years"}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {(job.skills || []).slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2 py-0.5 rounded text-[10px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleUnsave(job.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border border-red-200/50"
                  >
                    Remove
                  </button>

                  <button
                    onClick={() => handleApplyNow(job)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <span>Apply Now</span>
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
  );
}
