import { useState, useEffect, useRef } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface ResumeData {
  id: string;
  fileName: string;
  resumeUrl: string;
  resumeAnalysis: any;
  createdAt: string;
}

interface InterviewData {
  id: string;
  fileName: string;
  mode: "text" | "voice";
  overallScore: number | null;
  createdAt: string;
}

interface HomeProps {
  onUploadStart: (text: string) => void;
  onUploadSuccess: (sessionId: string, fileName: string, analysisData: any) => void;
  onUploadError: (msg: string) => void;
  token: string | null;
  user: any;
  activeTab: "overview" | "uploads";
  setActiveTab: (tab: "overview" | "uploads") => void;
  onLoadResume: (resume: any) => void;
  onStartInterview: () => void;
}

export default function Home({
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  token,
  user,
  activeTab,
  setActiveTab,
  onLoadResume,
  onStartInterview,
}: HomeProps) {
  const [dragging, setDragging] = useState(false);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes and interviews if logged in
  const fetchUserData = async () => {
    if (!token) return;
    setLoadingLists(true);
    try {
      const [resumesRes, interviewsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/resumes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/interviews`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const resumesJson = await resumesRes.json();
      const interviewsJson = await interviewsRes.json();
      
      if (resumesJson.success) setResumes(resumesJson.data);
      if (interviewsJson.success) setInterviews(interviewsJson.data);
    } catch (err) {
      console.error("Failed to load user list data:", err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchUserData();
    }
  }, [token, user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const processFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      onUploadError("Please upload a PDF resume. Other formats are currently not supported.");
      return;
    }

    onUploadStart("Uploading resume and extracting text content...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const authHeaders: Record<string, string> = {};
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }

      // 1. Upload Resume
      const uploadRes = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const uploadResJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadResJson.success) {
        throw new Error(uploadResJson.message || "Failed to upload resume.");
      }

      const sId = uploadResJson.data.sessionId;

      // 2. Perform Analysis
      onUploadStart("Recruiter AI is analyzing your skills and experience...");
      const analyzeRes = await fetch(`${BACKEND_URL}/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ sessionId: sId }),
      });

      const analyzeResJson = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeResJson.success) {
        throw new Error(analyzeResJson.message || "Failed to analyze resume.");
      }

      const analysisData = analyzeResJson.data;
      
      // Reload lists if logged in
      if (token) {
        await fetchUserData();
      }

      onUploadSuccess(sId, file.name, analysisData);
    } catch (err: any) {
      console.error(err);
      onUploadError(err.message || "An unexpected error occurred during processing.");
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume? This will also remove any related interviews.")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/resumes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setResumes(prev => prev.filter(r => r.id !== id));
        fetchUserData(); // refresh list
      } else {
        alert(json.message || "Failed to delete resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting resume.");
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stats computation
  const resumesCount = resumes.length;
  const interviewsCount = interviews.length;
  const completedInterviews = interviews.filter(i => i.overallScore !== null);
  const reportsCount = completedInterviews.length;
  const averageScore = reportsCount > 0
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + Number(curr.overallScore || 0), 0) / reportsCount * 10)
    : 0;

  /* ==========================================
     RENDER CASE 1: LANDING PAGE FOR GUESTS
  ========================================== */
  if (!user) {
    return (
      <div className="w-full bg-white text-slate-800 animate-fade-in flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-6">
              ✦ AI-Powered Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-slate-900 mb-6">
              AI Resume Analyzer &
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                Mock Interview Coach
              </span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
              Get your resume analyzed by AI recruiters, map your key weaknesses, and practice live mock interviews (via text or voice) with instant real-time scores and roadmaps.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onStartInterview}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs cursor-pointer"
              >
                Get Started Free
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-8 py-3.5 rounded-xl transition-colors text-xs text-center"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right SVG Graphic */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[480px] bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              {/* Fake Dashboard Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="bg-slate-200/60 rounded px-4 py-1 text-[8px] text-slate-400 font-mono">resume-ai.coach/workspace</div>
              </div>
              
              {/* Graphic Body */}
              <div className="flex gap-4 items-stretch h-[240px]">
                {/* Left Mini Sidebar */}
                <div className="w-16 bg-slate-200/40 rounded-xl flex flex-col gap-2 p-2">
                  <div className="w-full h-4 bg-indigo-200/60 rounded-lg animate-pulse" />
                  <div className="w-8 h-2 bg-slate-300/60 rounded" />
                  <div className="w-10 h-2 bg-slate-300/60 rounded" />
                  <div className="w-7 h-2 bg-slate-300/60 rounded" />
                </div>
                
                {/* Right Interactive SVG Panel */}
                <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3 shadow-inner relative overflow-hidden">
                  <div className="w-16 h-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[8px] rounded px-1.5 flex items-center justify-center font-bold">ANALYZING...</div>
                  
                  {/* Skill Nodes Flow */}
                  <svg className="w-full h-32 text-slate-200" viewBox="0 0 200 100">
                    <path d="M 30,50 L 80,25 L 140,25" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3,3" />
                    <path d="M 30,50 L 80,75 L 140,75" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3,3" />
                    <path d="M 80,25 L 140,50" fill="none" stroke="#E2E8F0" strokeWidth="2" />
                    <path d="M 80,75 L 140,50" fill="none" stroke="#E2E8F0" strokeWidth="2" />
                    
                    {/* Circle Nodes */}
                    <circle cx="30" cy="50" r="12" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="2" />
                    <circle cx="80" cy="25" r="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                    <circle cx="80" cy="75" r="10" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
                    <circle cx="140" cy="50" r="12" fill="#EEF2F6" stroke="#94A3B8" strokeWidth="2" />
                    
                    <text x="30" y="52" fontSize="6" fontWeight="bold" fill="#4F46E5" textAnchor="middle">PDF</text>
                    <text x="80" y="27" fontSize="5" fontWeight="bold" fill="#10B981" textAnchor="middle">REACT</text>
                    <text x="80" y="77" fontSize="5" fontWeight="bold" fill="#F59E0B" textAnchor="middle">NODE</text>
                    <text x="140" y="52" fontSize="6" fontWeight="bold" fill="#475569" textAnchor="middle">AI</text>
                  </svg>
                  
                  {/* Bottom Text bar */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-3/4 h-2 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="w-full bg-slate-50 border-y border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-slate-900">10K+</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Resumes Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">5K+</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Interviews Conducted</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">95%</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">User Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">24/7</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">AI Availability</div>
            </div>
          </div>
        </section>

        {/* Quick Guest Upload Section */}
        <section className="w-full max-w-xl mx-auto px-4 py-16 flex flex-col gap-6" id="try-it-now">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900">Try it instantly as a Guest</h2>
            <p className="text-slate-500 text-xs mt-1">Upload a PDF resume below. No credit card or registration required.</p>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
              dragging
                ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                : "border-slate-200 hover:border-indigo-500/50 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-2xl text-indigo-600 shadow-inner">
              ☁️
            </div>
            
            <div className="text-center">
              <p className="font-bold text-slate-800 text-sm">Drag & drop your PDF resume</p>
              <p className="text-[10px] text-slate-400 mt-0.5">or click to browse local files</p>
            </div>
            
            <span className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] py-2 px-5 rounded-lg transition-colors shadow-sm cursor-pointer">
              Select File
            </span>
            
            <p className="text-[9px] text-slate-400">Supported format: PDF up to 5MB</p>
          </div>
        </section>
      </div>
    );
  }

  /* ==========================================
     RENDER CASE 2: MY RESUMES UPLOAD TAB
  ========================================== */
  if (activeTab === "uploads") {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 animate-fade-in text-slate-800 space-y-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Upload Resume</h2>
          <p className="text-slate-500 text-xs mt-1">Upload your latest resume to get AI-powered evaluation</p>
        </div>

        {/* Upload widget card */}
        <div className="card-white grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                dragging
                  ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
                  : "border-slate-200 hover:border-indigo-500/40 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl text-indigo-600">
                ☁️
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-xs">Drag & drop your PDF resume here</p>
                <p className="text-[10px] text-slate-400">or click to browse local files</p>
              </div>
              <p className="text-[9px] text-slate-400">Supported: PDF, DOC, DOCX (Max 5MB)</p>
            </div>
          </div>
          
          <div className="md:col-span-1 border-l border-slate-100 pl-6 space-y-4 h-full flex flex-col justify-center">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Analysis Benefits</h4>
            <ul className="space-y-2 text-[10px] text-slate-500 font-semibold">
              <li className="flex items-center gap-2">✅ Deep skills mapping</li>
              <li className="flex items-center gap-2">✅ Interview gaps diagnosis</li>
              <li className="flex items-center gap-2">✅ Customized study roadmap</li>
              <li className="flex items-center gap-2">✅ Dynamic role matches</li>
            </ul>
          </div>
        </div>

        {/* Resumes List Table */}
        <div className="card-white p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Your Uploaded Resumes</h3>
          </div>
          {loadingLists ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading resumes...</div>
          ) : resumes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No resumes uploaded yet. Upload one above!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Filename</th>
                    <th className="px-6 py-3.5">Upload Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {resumes.map((resume) => (
                    <tr key={resume.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>📄</span>
                          <span className="truncate max-w-sm">{resume.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(resume.createdAt)}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => onLoadResume(resume)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors shadow-sm"
                        >
                          View Analysis
                        </button>
                        <button
                          onClick={() => handleDeleteResume(resume.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors border border-red-200/50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER CASE 3: DASHBOARD OVERVIEW (LOGGED IN)
  ========================================== */
  return (
    <div className="w-full max-w-4xl mx-auto py-4 animate-fade-in text-slate-800 space-y-6">
      {/* Welcome Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900">Welcome back, {user.name}! 👋</h2>
        <p className="text-slate-500 text-xs mt-1">Ready to improve your interview skills today?</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Resumes */}
        <div className="card-white p-5 flex flex-col justify-between hover:border-indigo-300 transition-all cursor-pointer" onClick={() => setActiveTab("uploads")}>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resumes Uploaded</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-indigo-600">{resumesCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Active Profiles</span>
          </div>
        </div>

        {/* Card 2: Interviews */}
        <div className="card-white p-5 flex flex-col justify-between hover:border-violet-300 transition-all cursor-pointer">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interviews Taken</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-violet-600">{interviewsCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Sessions Completed</span>
          </div>
        </div>

        {/* Card 3: Score */}
        <div className="card-white p-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Score</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">{averageScore}%</span>
            <span className="text-[10px] text-slate-400 font-semibold">Target Level</span>
          </div>
        </div>

        {/* Card 4: Reports */}
        <div className="card-white p-5 flex flex-col justify-between hover:border-sky-300 transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reports Generated</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-sky-600">{reportsCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Roadmaps Created</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div
            onClick={() => setActiveTab("uploads")}
            className="card-white p-5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg text-indigo-600">📁</div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Upload Resume</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Upload your resume to get recruiter AI analysis.</p>
              <span className="text-[10px] text-indigo-600 font-bold hover:underline block mt-2">Upload Now →</span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={onStartInterview}
            className="card-white p-5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-lg text-violet-600">🎙️</div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Start Interview</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Begin a text or voice mock session with the coach.</p>
              <span className="text-[10px] text-violet-600 font-bold hover:underline block mt-2">Start Now →</span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => {
              if (reportsCount > 0) {
                // Load the first available report
                const completed = interviews.find(i => i.overallScore !== null);
                if (completed) {
                  // Fetch and load
                  fetch(`${BACKEND_URL}/interviews/${completed.id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(json => {
                      if (json.success) onLoadResume({ resumeAnalysis: json.data.finalReport }); // visually mocks it
                    });
                }
              } else {
                alert("No reports generated yet. Complete an interview first.");
              }
            }}
            className="card-white p-5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg text-emerald-600">💡</div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">View Reports</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Check your feedback and structured roadmap reviews.</p>
              <span className="text-[10px] text-emerald-600 font-bold hover:underline block mt-2">View Now →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Row: Recent Activity & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 card-white p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recent Activity</h3>
          </div>
          {loadingLists ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading activity...</div>
          ) : interviews.length === 0 && resumes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {interviews.slice(0, 3).map((item) => (
                <div key={item.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base">🎙️</span>
                    <div>
                      <div className="font-bold text-slate-900">Mock Session Completed</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{formatDate(item.createdAt)} • Mode: {item.mode}</div>
                    </div>
                  </div>
                  {item.overallScore ? (
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      Score: {Number(item.overallScore) * 10}%
                    </span>
                  ) : (
                    <span className="bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded text-[10px]">
                      Draft
                    </span>
                  )}
                </div>
              ))}
              {resumes.slice(0, 2).map((item) => (
                <div key={item.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-base">📄</span>
                    <div>
                      <div className="font-bold text-slate-900">Resume Uploaded & Analyzed</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{formatDate(item.createdAt)} • {item.fileName}</div>
                    </div>
                  </div>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tips */}
        <div className="lg:col-span-1 card-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Tips for You</h3>
            <ul className="space-y-4 text-[11px] text-slate-500 leading-relaxed font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="text-indigo-500 mt-0.5">💡</span>
                <span>Practice coding challenges daily to maintain technical fluency.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-indigo-500 mt-0.5">💡</span>
                <span>Speak slowly and map your architecture pattern before writing code.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-indigo-500 mt-0.5">💡</span>
                <span>Explain code trade-offs (time complexity, scaling bottlenecks) proactively.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-indigo-500 mt-0.5">💡</span>
                <span>Address system design edge cases such as network partitions and database locks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}