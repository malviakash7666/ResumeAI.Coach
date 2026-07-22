import { useState, useEffect } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface ApplicationItem {
  id: string;
  userId: string;
  jobId: string;
  status: "Saved" | "Applied" | "Interview" | "Rejected" | "Offer";
  appliedDate: string;
  updatedAt: string;
  job: {
    id: string;
    company: string;
    title: string;
    location: string;
    source: string;
    sourceUrl: string;
    applyUrl: string;
  };
}

interface ApplicationsProps {
  token: string | null;
  setPage: (page: any) => void;
}

export default function Applications({ token, setPage }: ApplicationsProps) {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchApplications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setApplications(json.data || []);
      } else {
        throw new Error(json.message || "Failed to load applications.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not fetch application history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setApplications(prev =>
          prev.map(app => (app.id === id ? { ...app, status: newStatus as any } : app))
        );
      } else {
        alert(json.message || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating application status.");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to remove this application from tracking?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setApplications(prev => prev.filter(app => app.id !== id));
      } else {
        alert(json.message || "Failed to delete application.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting application.");
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

  const filteredApps = applications.filter(app => {
    if (statusFilter === "All") return true;
    return app.status === statusFilter;
  });

  const totalCount = applications.length;
  const appliedCount = applications.filter(a => a.status === "Applied").length;
  const interviewCount = applications.filter(a => a.status === "Interview").length;
  const offerCount = applications.filter(a => a.status === "Offer").length;

  if (!token) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="text-4xl">📌</div>
        <h2 className="text-2xl font-black text-slate-900">Application Tracker</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Please login to track your submitted job applications, interview schedules, and offers.
        </p>
        <button
          onClick={() => setPage("login")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
        >
          Login to Track Applications
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-slate-500 text-xs mt-1">Manage and track your job application pipeline status.</p>
        </div>
        <button
          onClick={() => setPage("jobs")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          + Find More Recommended Jobs
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-white p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tracked</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="card-white p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Applied</span>
          <div className="text-3xl font-black text-blue-600 mt-1">{appliedCount}</div>
        </div>

        <div className="card-white p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Interviews</span>
          <div className="text-3xl font-black text-violet-600 mt-1">{interviewCount}</div>
        </div>

        <div className="card-white p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Offers</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{offerCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-white p-2 flex flex-wrap gap-1">
        {["All", "Applied", "Interview", "Offer", "Saved", "Rejected"].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === st
                ? "bg-indigo-600 text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="card-white p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading applications...</div>
        ) : errorMsg ? (
          <div className="p-6 text-center text-red-600 text-xs font-bold">{errorMsg}</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <span className="text-3xl">📥</span>
            <h3 className="font-bold text-slate-800 text-sm">No applications found</h3>
            <p className="text-xs text-slate-400">Apply to jobs from the "Recommended Jobs" tab to track them here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Company & Role</th>
                  <th className="px-6 py-4">Source Board</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{app.job?.title || "Position"}</div>
                      <div className="text-xs text-indigo-600 font-semibold">{app.job?.company} • {app.job?.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {app.job?.source || "API"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer focus:outline-none ${
                          app.status === "Offer"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-black"
                            : app.status === "Interview"
                            ? "bg-violet-50 text-violet-700 border-violet-200 font-black"
                            : app.status === "Applied"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : app.status === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        <option value="Saved">Saved</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer 🎉</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{formatDate(app.appliedDate || app.updatedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.job?.applyUrl && (
                          <a
                            href={app.job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                          >
                            Open Link ↗
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer border border-red-200/50"
                        >
                          Remove
                        </button>
                      </div>
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
