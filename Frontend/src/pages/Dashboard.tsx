import { useState, useEffect, useRef } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface DashboardProps {
  token: string | null;
  user: any;
  onUploadStart: (text: string) => void;
  onUploadSuccess: (sessionId: string, fileName: string, analysisData: any) => void;
  onUploadError: (msg: string) => void;
  onNavigateToJobs?: () => void;
  onNavigateToInterviews?: () => void;
  onNavigateToResumes?: () => void;
}

export default function Dashboard({
  token,
  user,
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  onNavigateToJobs,
  onNavigateToInterviews,
  onNavigateToResumes
}: DashboardProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [resumesRes, interviewsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/resumes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/interviews`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const rJson = await resumesRes.json();
        const iJson = await interviewsRes.json();

        if (rJson.success) setResumes(rJson.data || []);
        if (iJson.success) setInterviews(iJson.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const processFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      onUploadError("Only PDF files are supported.");
      return;
    }

    setUploading(true);
    onUploadStart("Uploading & Extracting Resume PDF...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const uploadRes = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: "POST",
        headers,
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || "Failed to upload resume.");
      }

      const { sessionId } = uploadJson.data;

      const analyzeRes = await fetch(`${BACKEND_URL}/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });

      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok || !analyzeJson.success) {
        throw new Error(analyzeJson.message || "AI Analysis failed.");
      }

      onUploadSuccess(sessionId, file.name, analyzeJson.data);
    } catch (err: any) {
      console.error(err);
      onUploadError(err.message || "An unexpected error occurred during resume processing.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFileUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFileUpload(file);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full inline-block mb-3">
            ✦ AI RESUME ANALYZER & CAREER COPILOT
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || "Candidate"} 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
            Upload your resume to get instant ATS scores, technical weakness analysis, and AI job recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToJobs && (
            <button
              onClick={onNavigateToJobs}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              🎯 Find Recommended Jobs
            </button>
          )}
          {onNavigateToInterviews && (
            <button
              onClick={onNavigateToInterviews}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              🎙️ Start Mock Interview
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-white p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resumes Analyzed</span>
          <div className="text-3xl font-black text-slate-900">{resumes.length}</div>
        </div>

        <div className="card-white p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Interviews Completed</span>
          <div className="text-3xl font-black text-indigo-600">{interviews.length}</div>
        </div>

        <div className="card-white p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Candidate Level</span>
          <div className="text-2xl font-black text-emerald-600">Mid - Senior</div>
        </div>

        <div className="card-white p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Platform Status</span>
          <div className="text-2xl font-black text-violet-600">Active Pro</div>
        </div>
      </div>

      {/* Resume Upload Dropzone Card */}
      <div className="card-white p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Upload Resume for AI Analysis</h2>
            <p className="text-xs text-slate-500 mt-0.5">Supports PDF files up to 5MB.</p>
          </div>
          {onNavigateToResumes && (
            <button
              onClick={onNavigateToResumes}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              View My Saved Resumes →
            </button>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
              : "border-slate-200 hover:border-indigo-400 bg-slate-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
            📄
          </div>

          <h3 className="font-bold text-slate-800 text-sm">
            {uploading ? "Analyzing resume..." : "Click or Drag & Drop your Resume PDF here"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Our AI will parse your skills, extract candidate metadata, and match real company jobs.
          </p>

          {uploading && (
            <div className="mt-4 w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          )}
        </div>
      </div>
    </div>
  );
}
