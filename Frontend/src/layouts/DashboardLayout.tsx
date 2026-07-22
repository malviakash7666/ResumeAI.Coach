import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

interface DashboardLayoutProps {
  user: any;
  analysis: any;
  report: any;
  onLogout: () => void;
  onRestart: () => void;
  setAuthWarning: (msg: string) => void;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

export default function DashboardLayout({
  user,
  analysis,
  report,
  onLogout,
  onRestart,
  setAuthWarning,
  errorMsg,
  setErrorMsg
}: DashboardLayoutProps) {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard": return "Dashboard Overview";
      case "/resumes": return "My Resumes";
      case "/analysis": return "AI Resume Analysis";
      case "/jobs": return "AI Recommended Jobs";
      case "/saved-jobs": return "Saved Jobs";
      case "/applications": return "Application Tracker";
      case "/profile": return "Candidate Profile";
      case "/interview/modes": return "Select Mock Mode";
      case "/interview/live": return "Live Mock Interview";
      case "/history": return "Interview History";
      case "/reports": return "Interview Report";
      case "/settings": return "Profile Settings";
      default: return "Dashboard";
    }
  };

  return (
    <div className="flex min-h-screen text-slate-800 bg-slate-50">
      {/* Left Sidebar */}
      <Sidebar
        user={user}
        analysis={analysis}
        report={report}
        onLogout={onLogout}
        onRestart={onRestart}
        setAuthWarning={setAuthWarning}
      />

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 print:hidden">
          <h2 className="text-sm font-black text-slate-900 capitalize tracking-wide">
            {getPageTitle(location.pathname)}
          </h2>

          <div className="flex items-center gap-4">
            <button className="bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer">
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

        {/* Main Content Area rendering Outlet */}
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

          <Outlet />
        </main>
      </div>
    </div>
  );
}
