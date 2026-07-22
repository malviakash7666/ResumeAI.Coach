import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  user: any;
  analysis: any;
  report: any;
  onLogout: () => void;
  onRestart: () => void;
  setAuthWarning: (msg: string) => void;
}

export default function Sidebar({
  user,
  analysis,
  report,
  onLogout,
  onRestart,
  setAuthWarning
}: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-[#0F111A] text-slate-400 flex flex-col justify-between p-4 flex-shrink-0 border-r border-slate-900 print:hidden">
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={() => navigate("/")}>
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
          <NavLink
            to="/dashboard"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to view dashboard stats.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">📊</span>
            <span>Dashboard</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/resumes"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to view your resumes.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">📁</span>
            <span>My Resumes</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/analysis"
            onClick={(e) => {
              if (!analysis) {
                e.preventDefault();
                alert("Please upload your resume to view AI analysis.");
              }
            }}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""} ${!analysis ? "opacity-40 pointer-events-none" : ""}`
            }
          >
            <span className="text-sm">⚡</span>
            <span>AI Analysis</span>
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">🎯</span>
            <span>Recommended Jobs</span>
          </NavLink>

          <NavLink
            to="/saved-jobs"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to view saved jobs.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">⭐</span>
            <span>Saved Jobs</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/applications"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to access application tracker.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">📌</span>
            <span>Applications Tracker</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/profile"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to access candidate profile.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">👤</span>
            <span>Candidate Profile</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/interview/modes"
            onClick={(e) => {
              if (!analysis) {
                e.preventDefault();
                alert("Please upload your resume to start a mock interview.");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">🎙️</span>
            <span>Mock Interview</span>
          </NavLink>

          <NavLink
            to="/history"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to access interview history.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">📅</span>
            <span>Interview History</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>

          <NavLink
            to="/reports"
            onClick={(e) => {
              if (!report) {
                e.preventDefault();
                alert("No report available. Complete a mock interview first.");
              }
            }}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""} ${!report ? "opacity-40 pointer-events-none" : ""}`
            }
          >
            <span className="text-sm">💡</span>
            <span>Reports</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setAuthWarning("Please login to access settings.");
                navigate("/login");
              }
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm">⚙️</span>
            <span>Account Settings</span>
            {!user && <span className="ml-auto text-[9px]">🔒</span>}
          </NavLink>
        </nav>
      </div>

      {/* Logout / Login Footer */}
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
              onClick={onLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors font-bold cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs text-center cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
