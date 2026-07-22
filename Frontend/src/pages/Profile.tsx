import { useState, useEffect } from "react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

interface ProfileProps {
  token: string | null;
  user: any;
}

export default function Profile({ token, user }: ProfileProps) {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("");
  const [location, setLocation] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/jobs/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          setName(p.name || user?.name || "");
          setSkills(Array.isArray(p.skills) ? p.skills.join(", ") : "");
          setExperience(p.experience || "");
          setEducation(p.education || "");
          setPreferredRoles(Array.isArray(p.preferredRoles) ? p.preferredRoles.join(", ") : "");
          setLocation(p.location || "");
          setPreferredLocation(p.preferredLocation || "");
          setGithub(p.github || "");
          setLinkedin(p.linkedin || "");
        }
      } catch (err) {
        console.error("Failed to load candidate profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
    const rolesArray = preferredRoles.split(",").map(r => r.trim()).filter(Boolean);

    try {
      const res = await fetch(`${BACKEND_URL}/jobs/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          skills: skillsArray,
          experience,
          education,
          preferredRoles: rolesArray,
          location,
          preferredLocation,
          github,
          linkedin
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Candidate Profile updated successfully!");
      } else {
        throw new Error(json.message || "Failed to update profile.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading candidate profile...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Candidate Profile</h1>
        <p className="text-slate-500 text-xs mt-1">
          Extracted from your AI resume analysis. Used by AI Job Recommendation Engine.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-white space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Technical & Core Skills <span className="text-slate-400 font-normal">(comma separated)</span>
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, AWS"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Target Roles & Preferred Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Job Roles <span className="text-slate-400 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              value={preferredRoles}
              onChange={(e) => setPreferredRoles(e.target.value)}
              placeholder="e.g. Frontend Engineer, Full Stack Developer"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Work Location</label>
            <input
              type="text"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="e.g. Remote / US"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Experience & Education */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Experience Summary</label>
            <textarea
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3+ years full stack web development experience building SaaS products."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Education</label>
            <textarea
              rows={3}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. B.S. in Computer Science, State University."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GitHub URL</label>
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/yourusername"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourusername"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {saving ? "Saving Profile..." : "Save Candidate Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
