import { useState, useEffect } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface ResumeData {
  id: string;
  fileName: string;
  resumeUrl: string;
  resumeAnalysis: any;
  createdAt: string;
}

interface MyResumesProps {
  token: string | null;
  user: any;
  onLoadResume: (resume: any) => void;
  onStartInterview: () => void;
  onNavigateToDashboard?: () => void;
}

export default function MyResumes({
  token,
  user,
  onLoadResume,
  onStartInterview,
  onNavigateToDashboard
}: MyResumesProps) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchResumes = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setResumes(json.data || []);
      } else {
        throw new Error(json.message || "Failed to load resumes.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not fetch saved resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [token]);

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/resumes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setResumes(prev => prev.filter(r => r.id !== id));
      } else {
        alert(json.message || "Failed to delete resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting resume.");
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (!token) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="text-4xl">📁</div>
        <h2 className="text-2xl font-black text-slate-900">My Resumes</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Please login to view and manage your uploaded resumes and past AI analysis reports.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Resumes</h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage your uploaded resume documents and view stored analysis data.
          </p>
        </div>
        {onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            + Upload New Resume
          </button>
        )}
      </div>

      {loading ? (
        <div className="card-white p-16 text-center text-slate-400 text-xs font-medium">Loading uploaded resumes...</div>
      ) : errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold">{errorMsg}</div>
      ) : resumes.length === 0 ? (
        <div className="card-white p-16 text-center space-y-3">
          <span className="text-3xl">📁</span>
          <h3 className="font-bold text-slate-800 text-sm">No uploaded resumes found</h3>
          <p className="text-xs text-slate-400">Upload your resume PDF from the Dashboard to see it listed here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="card-white flex flex-col justify-between space-y-4 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                      📄
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm truncate max-w-[220px]">{resume.fileName}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold">Uploaded on {formatDate(resume.createdAt)}</span>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px]">
                    Analyzed
                  </span>
                </div>

                {resume.resumeAnalysis && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Experience Level:</span>
                      <span className="text-indigo-600 font-black">{resume.resumeAnalysis.experienceLevel || "Mid Level"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(resume.resumeAnalysis.skills || []).slice(0, 5).map((skill: string, i: number) => (
                        <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDeleteResume(resume.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border border-red-200/50"
                >
                  Delete
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadResume(resume)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View Analysis
                  </button>
                  <button
                    onClick={onStartInterview}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Mock Interview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
