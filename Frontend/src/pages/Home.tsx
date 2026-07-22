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
  onScrollToSection?: (sectionId: string) => void;
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
  onScrollToSection,
}: HomeProps) {
  const [dragging, setDragging] = useState(false);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
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
        {/* Section 1: Hero Section */}
        <section id="home" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-6 shadow-xs">
              ✦ AI-POWERED PLATFORM
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-slate-900 mb-6">
              Optimize Your Resume with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                AI
              </span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8 font-medium">
              Get ATS Score, identify missing keywords, improve your resume, and increase your interview chances.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  const elem = document.getElementById("upload-section");
                  if (elem) {
                    elem.scrollIntoView({ behavior: "smooth" });
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Analyze Resume</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-8 py-3.5 rounded-xl transition-colors text-xs text-center cursor-pointer"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right SVG AI SaaS Graphic */}
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
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[8px] rounded px-1.5 flex items-center justify-center font-bold uppercase tracking-wider">
                      ✨ ATS SCANNER
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      92/100
                    </span>
                  </div>
                  
                  {/* Skill Nodes Flow */}
                  <svg className="w-full h-32 text-slate-200" viewBox="0 0 200 100">
                    <path d="M 30,50 L 80,25 L 140,25" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3,3" />
                    <path d="M 30,50 L 80,75 L 140,75" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3,3" />
                    <path d="M 80,25 L 140,50" fill="none" stroke="#6366F1" strokeWidth="2" />
                    <path d="M 80,75 L 140,50" fill="none" stroke="#10B981" strokeWidth="2" />
                    
                    {/* Circle Nodes */}
                    <circle cx="30" cy="50" r="12" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="2" />
                    <circle cx="80" cy="25" r="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
                    <circle cx="80" cy="75" r="10" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
                    <circle cx="140" cy="50" r="14" fill="#EEF2F6" stroke="#6366F1" strokeWidth="2.5" />
                    
                    <text x="30" y="52" fontSize="6" fontWeight="bold" fill="#4F46E5" textAnchor="middle">PDF</text>
                    <text x="80" y="27" fontSize="5" fontWeight="bold" fill="#10B981" textAnchor="middle">REACT</text>
                    <text x="80" y="77" fontSize="5" fontWeight="bold" fill="#F59E0B" textAnchor="middle">NODE</text>
                    <text x="140" y="52" fontSize="7" fontWeight="bold" fill="#4F46E5" textAnchor="middle">AI ✦</text>
                  </svg>
                  
                  {/* Bottom Text bar */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="w-full h-2 bg-indigo-50 border border-indigo-100 rounded" />
                    <div className="w-3/4 h-2 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Guest Upload Widget Section */}
        <section id="upload-section" className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900">Upload Your Resume for Instant Analysis</h3>
            <p className="text-slate-500 text-xs mt-1">Select or drop a PDF file to analyze your ATS score & missing keywords.</p>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all bg-white ${
              dragging
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-lg"
                : "border-slate-200 hover:border-indigo-500/50 hover:bg-slate-50/50 shadow-sm"
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
              📄
            </div>
            
            <div className="text-center">
              <p className="font-bold text-slate-800 text-sm">Drag & drop your PDF resume here</p>
              <p className="text-[11px] text-slate-400 mt-0.5">or click to browse from your device</p>
            </div>
            
            <span className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-5 rounded-xl transition-colors shadow-sm cursor-pointer mt-1">
              Browse Resume
            </span>
            
            <p className="text-[10px] text-slate-400">Supported format: PDF up to 5MB</p>
          </div>
        </section>

        {/* Section 2: Features Section */}
        <section id="features" className="w-full bg-slate-50/60 border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                ✦ POWERFUL FEATURES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Everything You Need to Win Interviews
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium">
                Engineered with advanced AI algorithms to evaluate, score, and optimize your resume for modern applicant tracking systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl text-indigo-600 mb-4">
                    🎯
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">ATS Score Analysis</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Get an accurate ATS compatibility rating that shows how recruitment software parses your formatting, headers, and bullet points.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl text-violet-600 mb-4">
                    🤖
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">AI Resume Feedback</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Receive line-by-line feedback trained on top tech recruiter standards to refine impact phrasing and quantify achievements.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl text-emerald-600 mb-4">
                    🔍
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">Missing Keywords Detection</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Identify critical role-specific keywords and skill phrases missing from your profile that ATS screeners filter for.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl text-amber-600 mb-4">
                    📊
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">Skill Gap Analysis</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Uncover technical and soft skill gaps for targeted target roles, complete with actionable learning recommendations.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl text-blue-600 mb-4">
                    📝
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">Resume Summary</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Get clear executive summaries highlighting candidate strengths, experience level, and key selling points for recruiters.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="card-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl text-indigo-600 mb-4">
                    💡
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">Actionable AI Suggestions</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Get concrete, step-by-step suggestions on bullet point rewrites, active verbs, and layout fixes to maximize impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works Section */}
        <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
              ✦ STEP-BY-STEP PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium">
              Four simple steps to transform your resume into an ATS-optimized, interview-ready application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="card-white relative flex flex-col items-start gap-4 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/20">
                01
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <span>📄</span> Upload Resume
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Drag and drop your PDF resume into our secure platform to start instant processing.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-white relative flex flex-col items-start gap-4 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/20">
                02
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <span>⚡</span> AI Extracts Resume Data
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Our advanced AI engine parses skills, experience, bullet points, education, and structure.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-white relative flex flex-col items-start gap-4 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/20">
                03
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <span>🧠</span> ATS + AI Analysis
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Deep scanning against corporate hiring algorithms, keyword density, and formatting rules.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card-white relative flex flex-col items-start gap-4 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/20">
                04
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <span>📥</span> Download Detailed Report
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Get your full report with ATS scores, missing keyword lists, and actionable rewrite recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Resume Templates Section */}
        <section id="resume-templates" className="w-full bg-slate-50/60 border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                ✦ RESUME TEMPLATES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                ATS-Optimized Resume Templates
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium">
                Explore our upcoming gallery of professionally designed, ATS-friendly resume templates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Modern Tech", category: "Technology", color: "from-indigo-500 to-violet-600" },
                { name: "Executive Suite", category: "Leadership", color: "from-slate-700 to-slate-900" },
                { name: "Minimalist Pro", category: "General", color: "from-blue-500 to-indigo-600" },
                { name: "Creative Studio", category: "Design", color: "from-pink-500 to-rose-600" },
                { name: "Startup Founder", category: "Product", color: "from-amber-500 to-orange-600" },
                { name: "Academic & Research", category: "Education", color: "from-emerald-500 to-teal-600" },
              ].map((tmpl, idx) => (
                <div key={idx} className="card-white overflow-hidden p-0 hover:shadow-lg transition-all group">
                  {/* SVG Placeholder Preview */}
                  <div className={`h-44 bg-gradient-to-tr ${tmpl.color} p-4 relative flex items-center justify-center overflow-hidden`}>
                    <div className="w-4/5 h-full bg-white rounded-t-lg shadow-2xl p-3 transform group-hover:scale-105 transition-transform duration-300 flex flex-col gap-2">
                      <div className="w-1/2 h-2.5 bg-slate-800 rounded" />
                      <div className="w-1/3 h-1.5 bg-indigo-500 rounded" />
                      <div className="w-full h-[1px] bg-slate-100 my-1" />
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-slate-200 rounded" />
                        <div className="w-5/6 h-1.5 bg-slate-200 rounded" />
                        <div className="w-4/6 h-1.5 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{tmpl.name}</h4>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{tmpl.category}</span>
                    </div>
                    <span className="bg-amber-50 text-amber-700 border border-amber-200/80 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Section */}
        <section id="faq" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
              ✦ FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Got Questions? We Have Answers
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium">
              Everything you need to know about our AI resume evaluation platform.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What file formats are supported?",
                a: "We currently support PDF format resumes up to 5MB. PDF ensures your formatting, fonts, and layout are preserved accurately during AI text extraction and parsing."
              },
              {
                q: "Is my resume secure?",
                a: "Yes, absolutely. Your documents and data are encrypted in transit and at rest. We respect candidate privacy and never share or sell your resume information to third parties."
              },
              {
                q: "How is the ATS score calculated?",
                a: "Our algorithm evaluates keyword relevance, section hierarchy, quantifiable bullet point achievements, formatting rules, and readability based on real applicant tracking system standards."
              },
              {
                q: "Can I analyze multiple resumes?",
                a: "Yes! Registered users can upload and manage multiple resume versions, analyze different job targets, and track evaluation history in their personal dashboard."
              },
              {
                q: "Does AI rewrite my resume?",
                a: "The AI provides targeted suggestions, missing keyword recommendations, and actionable bullet point rewrites that you can easily copy into your master resume."
              },
              {
                q: "Is this free?",
                a: "Yes! You can analyze your resume for free as a guest instantly, or create an account for enhanced dashboard history and AI interview preparation."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="card-white p-0 overflow-hidden cursor-pointer transition-all border border-slate-200/80 hover:border-indigo-200"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="p-5 flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>{faq.q}</span>
                  <span className="text-indigo-600 text-lg transition-transform duration-200">
                    {openFaq === idx ? "−" : "+"}
                  </span>
                </div>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-0 text-slate-500 text-xs leading-relaxed border-t border-slate-100/80 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Contact Section */}
        <section id="contact" className="w-full bg-slate-50/60 border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-600 border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                ✦ GET IN TOUCH
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Contact Us
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium">
                Have questions, feedback, or need support? Reach out to our team anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Email */}
              <a href="mailto:support@resumeai.coach" className="card-white hover:-translate-y-1 hover:border-indigo-300 transition-all flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl mb-3">
                  ✉️
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Email Support</h4>
                <p className="text-slate-500 text-xs">support@resumeai.coach</p>
              </a>

              {/* GitHub */}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="card-white hover:-translate-y-1 hover:border-indigo-300 transition-all flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center text-xl mb-3">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">GitHub</h4>
                <p className="text-slate-500 text-xs">github.com/resumeai</p>
              </a>

              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="card-white hover:-translate-y-1 hover:border-indigo-300 transition-all flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xl mb-3">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">LinkedIn</h4>
                <p className="text-slate-500 text-xs">linkedin.com/company/resumeai</p>
              </a>

              {/* Twitter / X */}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="card-white hover:-translate-y-1 hover:border-indigo-300 transition-all flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center text-xl mb-3">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Twitter / X</h4>
                <p className="text-slate-500 text-xs">@resumeaicoach</p>
              </a>
            </div>
          </div>
        </section>

        {/* Section 7: CTA Section */}
        <section id="cta" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white rounded-3xl p-10 md:p-16 text-center border border-indigo-500/20 shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
            <div className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1.5 rounded-full">
              ✦ ELEVATE YOUR CAREER
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-2xl leading-tight">
              Ready to Improve Your Resume?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
              Join thousands of job seekers optimizing their resumes, uncovering missing keywords, and landing interviews faster.
            </p>
            <button
              onClick={() => {
                const elem = document.getElementById("upload-section");
                if (elem) {
                  elem.scrollIntoView({ behavior: "smooth" });
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-xs cursor-pointer flex items-center gap-2 mt-2"
            >
              <span>Analyze My Resume</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </section>

        {/* Section 8: Footer */}
        <footer className="w-full border-t border-slate-200 bg-slate-50 text-slate-500 text-xs py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Col 1 & 2: Logo & Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("home") : window.scrollTo({ top: 0, behavior: "smooth" })}>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-600/20">
                  AI
                </div>
                <span className="text-sm font-black tracking-wider text-slate-900 uppercase">
                  ResumeAI.Coach
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm font-medium">
                AI-Powered Resume Optimization & Mock Interview platform designed to help job seekers pass ATS filters and ace interviews.
              </p>
              <div className="flex items-center gap-3 pt-2 text-slate-400">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/></svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><button onClick={() => onScrollToSection ? onScrollToSection("home") : window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">Home</button></li>
                <li><button onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">Features</button></li>
                <li><button onClick={() => onScrollToSection ? onScrollToSection("how-it-works") : document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">How It Works</button></li>
                <li><button onClick={() => onScrollToSection ? onScrollToSection("resume-templates") : document.getElementById("resume-templates")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">Resume Templates</button></li>
                <li><button onClick={() => onScrollToSection ? onScrollToSection("faq") : document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">FAQ</button></li>
                <li><button onClick={() => onScrollToSection ? onScrollToSection("contact") : document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-indigo-600 transition-colors">Contact</button></li>
              </ul>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Features</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>ATS Score Analysis</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>AI Resume Feedback</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Missing Keywords</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("features") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Skill Gap Analysis</span></li>
              </ul>
            </div>

            {/* Resources & Legal */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Resources & Legal</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("faq") : document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>Privacy Policy</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("faq") : document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>Terms of Service</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={() => onScrollToSection ? onScrollToSection("faq") : document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>FAQ & Support</span></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
            <span>© {new Date().getFullYear()} ResumeAI.Coach. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </footer>
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