import { useState, useEffect } from "react";

interface InterviewData {
  id: string;
  fileName: string;
  mode: "text" | "voice";
  overallScore: number | null;
  createdAt: string;
}

interface HistoryProps {
  token: string | null;
  onViewReport: (reportData: any) => void;
  setPage: (page: any) => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

export default function History({ token, onViewReport, setPage }: HistoryProps) {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/interviews`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setInterviews(json.data);
        } else {
          setError(json.message || "Failed to load interviews.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const handleViewDetails = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interviews/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success && json.data.finalReport) {
        onViewReport(json.data.finalReport);
      } else {
        alert("Failed to retrieve final report for this interview.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading report details.");
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Interview History</h2>
          <p className="text-slate-500 text-xs mt-1">View all your past interviews and performance reviews</p>
        </div>
      </div>

      {loading ? (
        <div className="card-white flex flex-col items-center justify-center p-12 text-slate-400">
          <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin mb-4" />
          <p className="text-xs">Loading history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs text-center">
          ⚠️ {error}
        </div>
      ) : interviews.length === 0 ? (
        <div className="card-white flex flex-col items-center justify-center p-12 text-center text-slate-400">
          <span className="text-4xl mb-3">🎙️</span>
          <p className="text-sm font-bold text-slate-700">No Interviews Taken Yet</p>
          <p className="text-xs mt-1 text-slate-400">Analyze your resume and start a mock interview session to get started.</p>
          <button
            onClick={() => setPage("home")}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Start Now
          </button>
        </div>
      ) : (
        <div className="card-white p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Interview Profile</th>
                  <th className="px-6 py-4">Date Completed</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4 text-center">Overall Score</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {interviews.map((item) => {
                  const score = item.overallScore ? Number(item.overallScore) : null;
                  const scoreClass = score
                    ? score >= 8
                      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                      : score >= 6
                      ? "text-violet-600 bg-violet-50 border-violet-100"
                      : "text-amber-600 bg-amber-50 border-amber-100"
                    : "text-slate-400 bg-slate-50 border-slate-100";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 truncate max-w-xs">{item.fileName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Mock Tech Session</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200/50 text-slate-600 font-bold uppercase tracking-wider">
                          {item.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {score !== null ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${scoreClass}`}>
                            {score * 10}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Incomplete</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {score !== null && (
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors shadow-sm"
                          >
                            View Report
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
