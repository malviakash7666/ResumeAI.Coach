import React, { useState, useEffect, useRef } from "react";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import ModeSelection from "./pages/ModeSelection";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import Login from "./pages/Login";

type PageType = "home" | "analysis" | "mode_selection" | "interview" | "report" | "login";

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

const BACKEND_URL = "http://localhost:5000";

export default function App() {
  const [page, setPage] = useState<PageType>("home");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [interviewMode, setInterviewMode] = useState<"text" | "voice">("text");

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
        body: JSON.stringify({ sessionId }),
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

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans antialiased flex flex-col">
      
      {/* ── Navigation Header ── */}
      <nav className="sticky top-0 z-50 bg-[#0F172A]/85 backdrop-blur-md border-b border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleRestart}>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 text-transparent bg-clip-text">
              RESUMEAI.COACH
            </span>
            <span className="bg-violet-500/10 border border-violet-500/30 text-violet-400 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Authenticated user status */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-300 bg-slate-800/40 border border-white/5 px-3.5 py-1.5 rounded-xl">
                  👤 {user.name} ({user.role === "admin" ? "Admin" : "User"})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthWarning(null);
                    setPage("login");
                  }}
                  className="text-xs bg-violet-600/90 hover:bg-violet-600 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Sign In / Register
                </button>
              </div>
            )}

            {page !== "home" && (
              <button
                onClick={handleRestart}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 transition-colors px-3 py-1.5 rounded-xl font-medium cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Workspace ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center print:py-0">
        
        {/* Loading Overlay */}
        {loadingText && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 print:hidden">
            <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white text-center">{loadingText}</h3>
            <p className="text-sm text-slate-400 mt-1">Please keep this tab open</p>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-start gap-3 max-w-2xl mx-auto w-full print:hidden">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <h4 className="font-bold text-sm">System Alert</h4>
              <p className="text-xs text-red-300/90 mt-1">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-red-100 text-xs cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Stored resume notice card inside dashboard */}
        {user && user.resumeUrl && page === "home" && (
          <div className="mb-8 bg-violet-950/20 border border-violet-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto animate-fade-in">
            <span className="text-lg">📁</span>
            <h4 className="font-bold text-sm text-slate-200 mt-2">Resume Found on Profile</h4>
            <p className="text-xs text-slate-400 mt-1">We loaded your saved resume. You can jump directly to the analysis board or start a mock interview.</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPage("analysis")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                View Analysis
              </button>
              <button
                onClick={handleStartInterviewClick}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Start Interview
              </button>
            </div>
          </div>
        )}

        {/* Render View Components dynamically */}
        {page === "home" && (
          <Home
            onUploadStart={handleUploadStart}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            token={token}
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

        {page === "login" && (
          <Login
            onAuthSuccess={handleAuthSuccess}
            onBack={() => setPage(analysis ? "analysis" : "home")}
            redirectWarning={authWarning}
          />
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-slate-950/30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-black tracking-widest uppercase text-slate-400">ResumeAI.Coach</span>
          <span>© {new Date().getFullYear()} ResumeAI. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="text-slate-600">Built for MVP presentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
