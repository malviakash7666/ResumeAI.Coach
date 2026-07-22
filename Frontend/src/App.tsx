import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import ModeSelection from "./pages/ModeSelection";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import Login from "./pages/Login";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import SavedJobs from "./pages/SavedJobs";
import Dashboard from "./pages/Dashboard";
import MyResumes from "./pages/MyResumes";
import DashboardLayout from "./layouts/DashboardLayout";

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
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [interviewMode, setInterviewMode] = useState<"text" | "voice">("text");
  const [dashboardTab, setDashboardTab] = useState<"overview" | "uploads">("overview");

  // Landing page navigation state
  const [activeLandingSection, setActiveLandingSection] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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

  // Smooth scroll handler without URL hash changes for landing page
  const scrollToLandingSection = (sectionId: string) => {
    setActiveLandingSection(sectionId);
    setMobileMenuOpen(false);
    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      const navOffset = 70;
      const elementPosition = elem.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: "smooth"
      });
    }
  };

  // Check user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      const storedToken = localStorage.getItem("accessToken");

      try {
        const headers: Record<string, string> = {};
        if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;

        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        const resJson = await res.json();
        if (resJson.success) {
          setUser(resJson.data.user);
          setToken(storedToken || resJson.data.accessToken || null);

          if (resJson.data.user.resumeUrl) {
            setFileName("Saved Profile Resume.pdf");
            setSessionId(resJson.data.user.id);
            if (resJson.data.user.resumeAnalysis) {
              setAnalysis(resJson.data.user.resumeAnalysis);
            }
          }
        } else {
          await handleTokenRefresh();
        }
      } catch (err) {
        console.error("Session restore failed:", err);
      }
    };

    checkUserSession();
  }, []);

  const handleTokenRefresh = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const res = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
        credentials: "include",
      });

      const resJson = await res.json();
      if (resJson.success) {
        const newToken = resJson.data.accessToken;
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          setToken(newToken);
        }
        if (resJson.data.refreshToken) {
          localStorage.setItem("refreshToken", resJson.data.refreshToken);
        }

        const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: newToken ? { "Authorization": `Bearer ${newToken}` } : {},
          credentials: "include",
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

  const handleAuthSuccess = (authUser: any, authToken: string, authRefreshToken?: string) => {
    setUser(authUser);
    setToken(authToken);
    if (authToken) localStorage.setItem("accessToken", authToken);
    if (authRefreshToken) localStorage.setItem("refreshToken", authRefreshToken);
    setAuthWarning(null);

    if (authUser.resumeUrl && authUser.resumeAnalysis) {
      setFileName("Saved Profile Resume.pdf");
      setSessionId(authUser.id);
      setAnalysis(authUser.resumeAnalysis);
      navigate("/analysis");
      return;
    }
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        credentials: "include",
      });
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

  const handleUploadStart = (text: string) => {
    setLoadingText(text);
    setErrorMsg(null);
  };

  const handleUploadSuccess = (sId: string, name: string, analysisData: any) => {
    setSessionId(sId);
    setFileName(name);
    setAnalysis(analysisData);
    setLoadingText("");
    navigate("/analysis");

    if (user) {
      setUser((prev: any) => ({
        ...prev,
        resumeUrl: "Updated",
        resumeAnalysis: analysisData,
      }));
    }
  };

  const handleUploadError = (msg: string) => {
    setLoadingText("");
    setErrorMsg(msg);
  };

  const handleStartInterview = async (mode: "text" | "voice", overrideSessionId?: string) => {
    const activeSessionId = overrideSessionId || sessionId;
    if (!activeSessionId) return;
    if (overrideSessionId) {
      setSessionId(overrideSessionId);
    }
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
        body: JSON.stringify({ sessionId: activeSessionId, mode }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to start interview.");
      }

      const { question, chatHistory } = resJson.data;

      if (chatHistory && chatHistory.length > 0) {
        setChatMessages(chatHistory);
      } else {
        setChatMessages([
          {
            role: "interviewer",
            content: question,
          },
        ]);
      }
      setLatestFeedback(null);
      navigate("/interview/live");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not start the interview session.");
    } finally {
      setLoadingText("");
    }
  };

  const handleSubmitAnswer = async (voiceAnswer?: string) => {
    if (!sessionId || isSubmittingAnswer) return;

    const answer = (typeof voiceAnswer === "string" ? voiceAnswer : userAnswer).trim();
    if (!answer) return;

    setUserAnswer("");
    setIsSubmittingAnswer(true);
    setErrorMsg(null);

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

      setLatestFeedback({
        feedback: data.feedback,
        score: data.score,
        technicalScore: data.technicalScore,
        communicationScore: data.communicationScore,
        confidenceScore: data.confidenceScore,
        problemSolvingScore: data.problemSolvingScore,
      });

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
      navigate("/reports");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to compile the final interview report.");
    } finally {
      setLoadingText("");
    }
  };

  const handleRestart = () => {
    setSessionId(null);
    setFileName("");
    setAnalysis(null);
    setChatMessages([]);
    setLatestFeedback(null);
    setReport(null);
    setErrorMsg(null);

    if (user && user.resumeUrl) {
      setFileName("Saved Profile Resume.pdf");
      setSessionId(user.id);
      if (user.resumeAnalysis) {
        setAnalysis(user.resumeAnalysis);
        navigate("/analysis");
        return;
      }
    }
    navigate("/");
  };

  const handleStartInterviewClick = () => {
    if (!user) {
      setAuthWarning("Please login to start your AI Mock Interview.");
      navigate("/login");
    } else {
      navigate("/interview/modes");
    }
  };

  const handleLoadResume = (resume: any) => {
    setSessionId(resume.id);
    setFileName(resume.fileName);
    setAnalysis(resume.resumeAnalysis);
    navigate("/analysis");
  };

  const handleViewReport = (reportData: any) => {
    setReport(reportData);
    navigate("/reports");
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

      <Routes>
        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="flex-1 flex flex-col bg-white">
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80 transition-all">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToLandingSection("home")}>
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-600/20">
                        AI
                      </div>
                      <span className="text-sm font-black tracking-wider text-slate-900 uppercase">
                        ResumeAI.Coach
                      </span>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs font-bold">
                      {[
                        { id: "home", label: "Home" },
                        { id: "features", label: "Features" },
                        { id: "how-it-works", label: "How It Works" },
                        { id: "resume-templates", label: "Resume Templates" },
                        { id: "faq", label: "FAQ" },
                        { id: "contact", label: "Contact" },
                      ].map((link) => (
                        <button
                          key={link.id}
                          onClick={() => scrollToLandingSection(link.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeLandingSection === link.id
                              ? "text-indigo-600 bg-indigo-50/80 font-black shadow-xs"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Right Side Buttons & Hamburger */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setAuthWarning(null);
                          navigate("/login");
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors cursor-pointer"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setAuthWarning(null);
                          navigate("/login");
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Get Started
                      </button>

                      {/* Mobile Hamburger Button */}
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
                        aria-label="Toggle navigation menu"
                      >
                        {mobileMenuOpen ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Nav Menu Dropdown */}
                  {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1.5 animate-slide-down shadow-lg">
                      {[
                        { id: "home", label: "Home" },
                        { id: "features", label: "Features" },
                        { id: "how-it-works", label: "How It Works" },
                        { id: "resume-templates", label: "Resume Templates" },
                        { id: "faq", label: "FAQ" },
                        { id: "contact", label: "Contact" },
                      ].map((link) => (
                        <button
                          key={link.id}
                          onClick={() => scrollToLandingSection(link.id)}
                          className={`block w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeLandingSection === link.id
                              ? "text-indigo-600 bg-indigo-50/80 font-black"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}
                </nav>

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
                  onScrollToSection={scrollToLandingSection}
                />
              </div>
            )
          }
        />

        {/* Auth Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="flex-1 flex flex-col justify-center py-12 px-4 bg-slate-50 min-h-screen">
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
                  onBack={() => navigate(analysis ? "/analysis" : "/")}
                  redirectWarning={authWarning}
                />
              </div>
            )
          }
        />

        {/* Dashboard Layout with Nested Routes */}
        <Route
          element={
            user ? (
              <DashboardLayout
                user={user}
                analysis={analysis}
                report={report}
                onLogout={handleLogout}
                onRestart={handleRestart}
                setAuthWarning={setAuthWarning}
                errorMsg={errorMsg}
                setErrorMsg={setErrorMsg}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/dashboard"
            element={
              <Dashboard
                token={token}
                user={user}
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                onNavigateToJobs={() => navigate("/jobs")}
                onNavigateToInterviews={() => navigate("/interview/modes")}
                onNavigateToResumes={() => navigate("/resumes")}
              />
            }
          />

          <Route
            path="/resumes"
            element={
              <MyResumes
                token={token}
                user={user}
                onLoadResume={handleLoadResume}
                onStartInterview={handleStartInterviewClick}
                onNavigateToDashboard={() => navigate("/dashboard")}
              />
            }
          />

          <Route
            path="/analysis"
            element={
              analysis ? (
                <Analysis
                  analysis={analysis}
                  onStartInterview={handleStartInterviewClick}
                  onBack={handleRestart}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/jobs"
            element={
              <Jobs
                token={token}
                user={user}
                onNavigateToProfile={() => navigate("/profile")}
                onNavigateToApplications={() => navigate("/applications")}
                onNavigateToSaved={() => navigate("/saved-jobs")}
              />
            }
          />

          <Route
            path="/saved-jobs"
            element={
              <SavedJobs
                token={token}
                setPage={(page) => navigate(`/${page}`)}
              />
            }
          />

          <Route
            path="/applications"
            element={
              <Applications
                token={token}
                setPage={(page) => navigate(`/${page}`)}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile
                token={token}
                user={user}
              />
            }
          />

          <Route
            path="/interview/modes"
            element={
              analysis || (user && user.resumeUrl) ? (
                <ModeSelection
                  onStartInterview={handleStartInterview}
                  onBack={() => navigate("/analysis")}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/interview/live"
            element={
              analysis || (user && user.resumeUrl) ? (
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
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/history"
            element={
              <History
                token={token}
                onViewReport={handleViewReport}
                setPage={(page) => {
                  if (page === "home") {
                    if (analysis || (user && user.resumeUrl)) {
                      navigate("/interview/modes");
                    } else {
                      navigate("/dashboard");
                    }
                  } else {
                    navigate(`/${page}`);
                  }
                }}
              />
            }
          />

          <Route
            path="/reports"
            element={
              report ? (
                <Report
                  report={report}
                  onRestart={handleRestart}
                  isGuest={!user}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/settings"
            element={
              <Settings
                token={token}
                user={user}
                onUpdateUser={handleUpdateUser}
              />
            }
          />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
