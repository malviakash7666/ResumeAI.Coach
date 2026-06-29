import React from "react";

interface AnalysisData {
  skills: string[];
  experienceLevel: string;
  weakAreas: string[];
  suggestedRoles: string[];
  difficulty: string;
}

interface AnalysisProps {
  analysis: AnalysisData;
  onStartInterview: () => void;
  onBack: () => void;
}

export default function Analysis({ analysis, onStartInterview, onBack }: AnalysisProps) {
  return (
    <div className="max-w-4xl mx-auto w-full py-4 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
          Analysis Complete
        </span>
        <h2 className="text-3xl font-black mt-3">Your Resume Profile Overview</h2>
        <p className="text-slate-400 text-sm mt-1">Here is how AI recruiters evaluate your qualifications</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-glass-card rounded-2xl p-5 flex items-center justify-between hover:border-violet-500/30 transition-all duration-300 group">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Assessed Experience Level</p>
            <h3 className="text-xl font-black text-violet-300 mt-1">{analysis.experienceLevel}</h3>
          </div>
          <div className="text-2xl bg-violet-500/10 border border-violet-500/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform">⚡</div>
        </div>
        
        <div className="bg-glass-card rounded-2xl p-5 flex items-center justify-between hover:border-emerald-500/30 transition-all duration-300 group">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Target Interview Difficulty</p>
            <h3 className="text-xl font-black text-emerald-400 mt-1">{analysis.difficulty}</h3>
          </div>
          <div className="text-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform">🎯</div>
        </div>
      </div>

      {/* Deep Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Skills & Roles */}
        <div className="flex flex-col gap-6">
          {/* Skills Card */}
          <div className="bg-glass rounded-2xl p-6 border border-white/5 flex-1 hover:border-white/10 transition-colors">
            <h4 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="text-violet-400">✦</span> Identified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-white/5 transition-all hover:scale-[1.03] cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Roles Card */}
          <div className="bg-glass rounded-2xl p-6 border border-white/5 flex-1 hover:border-white/10 transition-colors">
            <h4 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="text-violet-400">◈</span> Recommended Roles
            </h4>
            <div className="flex flex-col gap-2">
              {analysis.suggestedRoles.map((role, i) => (
                <div
                  key={i}
                  className="bg-slate-800/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-200">{role}</span>
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Matches Profile</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Weak Areas */}
        <div className="bg-glass rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors">
          <h4 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="text-amber-400">⚠️</span> Detected Gaps & Weak Areas
          </h4>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            These topics are either missing or brief on your resume. We will focus on testing these during the mock interview.
          </p>
          <div className="flex-1 flex flex-col gap-3">
            {analysis.weakAreas.map((area, i) => (
              <div
                key={i}
                className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl flex items-start gap-2.5 hover:bg-amber-500/10 transition-colors"
              >
                <span className="text-amber-500 text-sm mt-0.5">•</span>
                <span className="text-xs font-medium text-amber-200/90 leading-relaxed">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <button
          onClick={onStartInterview}
          className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-violet-600/30 text-sm flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
        >
          <span>Start Mock Interview Coach</span>
          <span className="text-lg">→</span>
        </button>
        
        <button
          onClick={onBack}
          className="w-full sm:w-auto text-slate-400 hover:text-white transition-colors text-xs font-semibold px-5 py-3 cursor-pointer"
        >
          Re-upload Resume
        </button>
      </div>
    </div>
  );
}
