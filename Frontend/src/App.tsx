import React, { useState, useEffect, useRef } from "react";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import ModeSelection from "./pages/ModeSelection";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import Login from "./pages/Login";
import History from "./pages/History";
import Settings from "./pages/Settings";

type PageType = "home" | "analysis" | "mode_selection" | "interview" | "report" | "login" | "history" | "settings";

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
  feedback?: string;
  score?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  problemSolvingScore?: number;
}

interface LatestFeedback {
  feedback: string;
  score: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore?: number;
  problemSolvingScore?: number;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

export default function App() {
  const [page, setPage] = useState<PageType>("home");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [interviewMode, setInterviewMode] = useState<"text" | "voice">("text");
  const [dashboardTab, setDashboardTab] = useState<"overview" | "uploads">("overview");

  // User Auth States
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  
  // Loading & Error States
  const [loadingText, setLoadingText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis & Interview States
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [latestFeedback, setLatestFeedback] = useState<LatestFeedback | null>(null);
  const [report, setReport] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Session Persistence check on boot
  useEffect(() => {
    const checkUserSession = async () => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) return;

      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${storedToken}`,
          },
        });
        
        const resJson = await res.json();
        if (resJson.success) {
          setUser(resJson.data.user);
          setToken(storedToken);
          
          // Preload stored resume details if available
          if (resJson.data.user.resumeUrl) {
            setFileName("Saved Profile Resume.pdf");
            setSessionId(resJson.data.user.id);
            if (resJson.data.user.resumeAnalysis) {
              setAnalysis(resJson.data.user.resumeAnalysis);
            }
          }
        } else {
          // Attempt refresh
          await handleTokenRefresh();
        }
      } catch (err) {
        console.error("Session restore failed:", err);
      }
    };

    checkUserSession();
  }, []);

  // 2. Token refresh handler
  const handleTokenRefresh = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const resJson = await res.json();
      if (resJson.success) {
        const newToken = resJson.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        setToken(newToken);
        
        // Retrieve profile details with the new token
        const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${newToken}` },
        });
        const meJson = await meRes.json();
        if (meJson.success) {
          setUser(meJson.data.user);
          if (meJson.data.user.resumeUrl) {
            setFileName("Saved Profile Resume.pdf");
            setSessionId(meJson.data.user.id);
            if (meJson.data.user.resumeAnalysis) {
              setAnalysis(meJson.data.user.resumeAnalysis);
            }
          }
        }
      } else {
        handleLogoutLocal();
      }
    } catch (e) {
      handleLogoutLocal();
    }
  };

  // Auth Operations
  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem("accessToken", authToken);
    setAuthWarning(null);

    // Preload resume if they already have one
    if (authUser.resumeUrl) {
      setFileName("Saved Profile Resume.pdf");
      setSessionId(authUser.id);
      if (authUser.resumeAnalysis) {
        setAnalysis(authUser.resumeAnalysis);
        setPage("analysis");
        return;
      }
    }
    setPage("home");
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      handleLogoutLocal();
    }
  };

  const handleLogoutLocal = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("accessToken");
    handleRestart();
  };

  // Upload Handlers
  const handleUploadStart = (text: string) => {
    setLoadingText(text);
    setErrorMsg(null);
  };

  const handleUploadSuccess = (sId: string, name: string, analysisData: any) => {
    setSessionId(sId);
    setFileName(name);
    setAnalysis(analysisData);
    setLoadingText("");
    setPage("analysis");

    // Update user profile analysis state locally if logged in
    if (user) {
      setUser((prev: any) => ({
        ...prev,
        resumeUrl: "Updated", // placeholder to flag presence
        resumeAnalysis: analysisData,
      }));
    }
  };

  const handleUploadError = (msg: string) => {
    setLoadingText("");
    setErrorMsg(msg);
  };

  // Start Interview with Mode Configuration
  const handleStartInterview = async (mode: "text" | "voice") => {
    if (!sessionId) return;
    setInterviewMode(mode);
    setLoadingText("AI Interviewer is preparing your customized questions...");
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/start-interview`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, mode }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to start interview.");
      }

      const { question } = resJson.data;
      
      setChatMessages([
        {
          role: "interviewer",
          content: question,
        },
      ]);
      setLatestFeedback(null);
      setPage("interview");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not start the interview session.");
    } finally {
      setLoadingText("");
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async (voiceAnswer?: string) => {
    if (!sessionId || isSubmittingAnswer) return;

    const answer = (typeof voiceAnswer === "string" ? voiceAnswer : userAnswer).trim();
    if (!answer) return;

    setUserAnswer("");
    setIsSubmittingAnswer(true);
    setErrorMsg(null);

    // Append user answer immediately to display
    setChatMessages((prev) => [...prev, { role: "candidate", content: answer }]);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/chat-interview`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, answer }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to submit answer.");
      }

      const data = resJson.data;

      // Attach grades to the user message in local state
      setChatMessages((prev) => {
        const updated = [...prev];
        const lastMsgIndex = updated.length - 1;
        if (updated[lastMsgIndex] && updated[lastMsgIndex].role === "candidate") {
          updated[lastMsgIndex] = {
            ...updated[lastMsgIndex],
            feedback: data.feedback,
            score: data.score,
            technicalScore: data.technicalScore,
            communicationScore: data.communicationScore,
            confidenceScore: data.confidenceScore,
            problemSolvingScore: data.problemSolvingScore,
          };
        }
        return updated;
      });

      // Update scoring panel
      setLatestFeedback({
        feedback: data.feedback,
        score: data.score,
        technicalScore: data.technicalScore,
        communicationScore: data.communicationScore,
        confidenceScore: data.confidenceScore,
        problemSolvingScore: data.problemSolvingScore,
      });

      // Append next AI question
      setChatMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          content: data.nextQuestion,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not submit your answer. Please try again.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // End Interview & Fetch Final Report
  const handleEndInterview = async () => {
    if (!sessionId) return;
    setLoadingText("AI Panel is generating your final performance report...");
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/end-interview`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to generate report.");
      }

      const reportData = resJson.data;
      setReport(reportData);
      setPage("report");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to compile the final interview report.");
    } finally {
      setLoadingText("");
    }
  };

  // Reset/Restart session
  const handleRestart = () => {
    setSessionId(null);
    setFileName("");
    setAnalysis(null);
    setChatMessages([]);
    setLatestFeedback(null);
    setReport(null);
    setPage("home");
    setErrorMsg(null);

    // If logged in, reload profile saved resume details if available
    if (user && user.resumeUrl) {
      setFileName("Saved Profile Resume.pdf");
      setSessionId(user.id);
      if (user.resumeAnalysis) {
        setAnalysis(user.resumeAnalysis);
        setPage("analysis");
      }
    }
  };

  const handleStartInterviewClick = () => {
    if (!user) {
      setAuthWarning("Please login to start your AI Mock Interview.");
      setPage("login");
    } else {
      setPage("mode_selection");
    }
  };

  const handleLoadResume = (resume: any) => {
    setSessionId(resume.id);
    setFileName(resume.fileName);
    setAnalysis(resume.resumeAnalysis);
    setPage("analysis");
  };

  const handleViewReport = (reportData: any) => {
    setReport(reportData);
    setPage("report");
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 font-sans antialiased flex flex-col">
      {/* Loading Overlay */}
      {loadingText && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 print:hidden">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mb-4" />
          <h3 className="text-sm font-bold text-white text-center">{loadingText}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Please keep this tab open</p>
        </div>
      )}

      {/* ── CASE 1: LANDING PAGE FOR GUEST ── */}
      {page === "home" && !user ? (
        <div className="flex-1 flex flex-col bg-white">
          <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleRestart}>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                  AI
                </div>
                <span className="text-sm font-black tracking-wider text-slate-900 uppercase">
                  ResumeAI.Coach
                </span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500">
                <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
                <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
                <a href="#blog" className="hover:text-slate-900 transition-colors">Blog</a>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthWarning(null);
                    setPage("login");
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthWarning(null);
                    setPage("login");
                  }}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            </div>
          </nav>

          <main className="flex-1 flex flex-col justify-center">
            {errorMsg && (
              <div className="max-w-4xl mx-auto w-full px-4 mt-6">
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                  <span className="text-sm">⚠️</span>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold">System Alert</h4>
                    <p className="mt-0.5 text-red-600">{errorMsg}</p>
                  </div>
                  <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                </div>
              </div>
            )}
            <Home
              onUploadStart={handleUploadStart}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              token={token}
              user={user}
              activeTab={dashboardTab}
              setActiveTab={setDashboardTab}
              onLoadResume={handleLoadResume}
              onStartInterview={handleStartInterviewClick}
            />
          </main>

          <footer className="border-t border-slate-100 py-8 bg-slate-50 text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-black uppercase tracking-wider text-slate-500">ResumeAI.Coach</span>
              <span>© {new Date().getFullYear()} ResumeAI. All rights reserved.</span>
              <span>Built for premium MVP presentation</span>
            </div>
          </footer>
        </div>
      ) : page === "login" ? (
        /* ── CASE 2: LOGIN / REGISTER CARD ── */
        <div className="flex-1 flex flex-col justify-center py-12 px-4 bg-slate-50">
          <div className="max-w-md mx-auto w-full flex items-center justify-center gap-2 mb-6 cursor-pointer" onClick={handleRestart}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              AI
            </div>
            <span className="text-base font-black tracking-wider text-slate-900 uppercase">
              ResumeAI.Coach
            </span>
          </div>
          <Login
            onAuthSuccess={handleAuthSuccess}
            onBack={() => setPage(analysis ? "analysis" : "home")}
            redirectWarning={authWarning}
          />
        </div>
      ) : (
        /* ── CASE 3: AUTHENTICATED APP / SIDEBAR VIEW ── */
        <div className="flex-1 flex min-h-screen text-slate-800">
          {/* Left Sidebar Layout */}
          <aside className="w-64 bg-[#0F111A] text-slate-400 flex flex-col justify-between p-4 flex-shrink-0 border-r border-slate-900 print:hidden">
            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={handleRestart}>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                  AI
                </div>
                <span className="text-sm font-black tracking-wider text-white uppercase">
                  ResumeAI.Coach
                </span>
                <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              </div>

              {/* Navigation Menu */}
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    if (!user) {
                      setAuthWarning("Please login to view dashboard stats.");
                      setPage("login");
                    } else {
                      setDashboardTab("overview");
                      setPage("home");
                    }
                  }}
                  className={`sidebar-link ${page === "home" && dashboardTab === "overview" ? "sidebar-link-active" : ""}`}
                >
                  <span className="text-sm">📊</span>
                  <span>Dashboard</span>
                  {!user && <span className="ml-auto text-[9px]">🔒</span>}
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthWarning("Please login to view your resumes.");
                      setPage("login");
                    } else {
                      setDashboardTab("uploads");
                      setPage("home");
                    }
                  }}
                  className={`sidebar-link ${page === "home" && dashboardTab === "uploads" ? "sidebar-link-active" : ""}`}
                >
                  <span className="text-sm">📁</span>
                  <span>My Resumes</span>
                  {!user && <span className="ml-auto text-[9px]">🔒</span>}
                </button>

                <button
                  onClick={() => {
                    if (analysis) setPage("analysis");
                  }}
                  disabled={!analysis}
                  className={`sidebar-link ${page === "analysis" ? "sidebar-link-active" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-sm">⚡</span>
                  <span>AI Analysis</span>
                </button>

                <button
                  onClick={() => {
                    if (analysis) {
                      setPage("mode_selection");
                    } else {
                      alert("Please upload your resume to start an interview session.");
                    }
                  }}
                  className={`sidebar-link ${page === "mode_selection" || page === "interview" ? "sidebar-link-active" : ""}`}
                >
                  <span className="text-sm">🎙️</span>
                  <span>Mock Interview</span>
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthWarning("Please login to access interview history.");
                      setPage("login");
                    } else {
                      setPage("history");
                    }
                  }}
                  className={`sidebar-link ${page === "history" ? "sidebar-link-active" : ""}`}
                >
                  <span className="text-sm">📅</span>
                  <span>Interview History</span>
                  {!user && <span className="ml-auto text-[9px]">🔒</span>}
                </button>

                <button
                  onClick={() => {
                    if (report) setPage("report");
                  }}
                  disabled={!report}
                  className={`sidebar-link ${page === "report" ? "sidebar-link-active" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-sm">💡</span>
                  <span>Reports</span>
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      setAuthWarning("Please login to access settings.");
                      setPage("login");
                    } else {
                      setPage("settings");
                    }
                  }}
                  className={`sidebar-link ${page === "settings" ? "sidebar-link-active" : ""}`}
                >
                  <span className="text-sm">⚙️</span>
                  <span>Account Settings</span>
                  {!user && <span className="ml-auto text-[9px]">🔒</span>}
                </button>
              </nav>
            </div>

            {/* Logout panel */}
            <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{user.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest">{user.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors font-bold cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPage("login")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs text-center cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Sign In
                </button>
              )}
            </div>
          </aside>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Header Panel */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 print:hidden">
              <h2 className="text-sm font-black text-slate-900 capitalize tracking-wide">
                {page === "home"
                  ? dashboardTab === "overview"
                    ? "Dashboard"
                    : "My Resumes"
                  : page === "mode_selection"
                  ? "Select Mock Mode"
                  : page === "interview"
                  ? "Live Mock Interview"
                  : page === "report"
                  ? "Interview Report"
                  : page === "history"
                  ? "Interview History"
                  : page === "settings"
                  ? "Profile Settings"
                  : page}
              </h2>

              <div className="flex items-center gap-4">
                <button className="bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors">
                  Upgrade Plan
                </button>

                {user && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs border border-slate-200">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">
                      {user.name}
                    </span>
                  </div>
                )}
              </div>
            </header>

            {/* Main Content Scroll Area */}
            <main className="flex-1 p-6 overflow-y-auto">
              {errorMsg && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 max-w-2xl mx-auto w-full print:hidden">
                  <span className="text-sm">⚠️</span>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold">System Alert</h4>
                    <p className="mt-0.5 text-red-600">{errorMsg}</p>
                  </div>
                  <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                </div>
              )}

              {/* Render View Components */}
              {page === "home" && (
                <Home
                  onUploadStart={handleUploadStart}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  token={token}
                  user={user}
                  activeTab={dashboardTab}
                  setActiveTab={setDashboardTab}
                  onLoadResume={handleLoadResume}
                  onStartInterview={handleStartInterviewClick}
                />
              )}

              {page === "analysis" && analysis && (
                <Analysis
                  analysis={analysis}
                  onStartInterview={handleStartInterviewClick}
                  onBack={handleRestart}
                />
              )}

              {page === "mode_selection" && (
                <ModeSelection
                  onStartInterview={handleStartInterview}
                  onBack={() => setPage("analysis")}
                />
              )}

              {page === "interview" && (
                <Interview
                  mode={interviewMode}
                  chatMessages={chatMessages}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                  isSubmittingAnswer={isSubmittingAnswer}
                  latestFeedback={latestFeedback}
                  onSubmitAnswer={handleSubmitAnswer}
                  onEndInterview={handleEndInterview}
                  chatEndRef={chatEndRef}
                />
              )}

              {page === "report" && report && (
                <Report
                  report={report}
                  onRestart={handleRestart}
                  isGuest={!user}
                />
              )}

              {page === "history" && (
                <History
                  token={token}
                  onViewReport={handleViewReport}
                  setPage={setPage}
                />
              )}

              {page === "settings" && (
                <Settings
                  token={token}
                  user={user}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
