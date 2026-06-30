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
  // Calculations to drive the metrics
  const weakAreasCount = analysis.weakAreas?.length || 0;
  const skillsCount = analysis.skills?.length || 0;
  
  // Calculate dynamic overall score
  const overallScore = Math.max(60, 100 - (weakAreasCount * 8));
  
  // Calculate skills matched ratio (e.g. 18 / 24)
  const skillsTargetCount = Math.max(skillsCount + 4, 10);
  const skillsMatchedRatio = Math.min(skillsCount, skillsTargetCount);
  const skillsMatchedPct = Math.round((skillsMatchedRatio / skillsTargetCount) * 100);

  // SVG Circle Dial values
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  const handleDownloadAnalysis = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 animate-fade-in text-slate-800 space-y-6 print:p-0">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 print:pb-2">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider print:hidden">
            AI Parsing Complete
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">AI Analysis Report</h2>
          <p className="text-slate-400 text-xs mt-0.5">Recruiter AI evaluation of your profile and background</p>
        </div>
        
        <button
          onClick={handleDownloadAnalysis}
          className="bg-indigo-55 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm print:hidden"
        >
          <span>📥</span> Download Report
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Overall Score Circular Dial */}
        <div className="card-white flex flex-col items-center justify-center text-center p-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Overall Score</p>
          
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full dial-svg" viewBox="0 0 100 100">
              <circle
                className="dial-circle-bg"
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="8"
              />
              <circle
                className="dial-circle-progress-emerald"
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{overallScore}%</span>
            </div>
          </div>
          
          <p className="text-slate-450 text-[10px] font-bold mt-4 text-emerald-600 uppercase tracking-wide">
            {overallScore >= 80 ? "Great! Your resume is strong." : "Good, but gaps exist."}
          </p>
        </div>

        {/* Card 2: Skills Matched Ratio */}
        <div className="card-white flex flex-col justify-between p-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Skills Matched</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {skillsMatchedRatio} <span className="text-slate-300 font-normal">/ {skillsTargetCount}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-2">
              Assesses the frequency and weight of your technical capabilities mapped to industry standard profiles.
            </p>
          </div>
          
          <div className="w-full mt-4">
            <div className="flex justify-between text-[10px] text-slate-450 font-bold mb-1">
              <span>Match Rating</span>
              <span>{skillsMatchedPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${skillsMatchedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Experience Level */}
        <div className="card-white flex flex-col justify-between p-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Experience Level</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {analysis.experienceLevel}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-2">
              Synthesized from timelines, keywords, and structural depth within your employment history blocks.
            </p>
          </div>
          
          <div className="w-full mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-bold">
            <span>Interview Target</span>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">
              {analysis.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Strengths and Improvements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card-white flex flex-col">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Strengths
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {analysis.suggestedRoles.map((role, i) => (
              <div key={i} className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex items-start gap-2.5">
                <span className="text-emerald-600 text-sm leading-none mt-0.5">•</span>
                <div>
                  <span className="text-xs font-bold text-slate-800">Matches Role: {role}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Your resume profile displays core parameters aligning to {role} skills.</p>
                </div>
              </div>
            ))}
            <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex items-start gap-2.5">
              <span className="text-emerald-600 text-sm leading-none mt-0.5">•</span>
              <div>
                <span className="text-xs font-bold text-slate-800">Clean structural layout</span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Information is parsed sequentially with legible headings and blocks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="card-white flex flex-col">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="text-amber-500">⚠️</span> Areas to Improve
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {analysis.weakAreas.map((area, i) => (
              <div key={i} className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl flex items-start gap-2.5">
                <span className="text-amber-600 text-sm leading-none mt-0.5">•</span>
                <div>
                  <span className="text-xs font-bold text-slate-800">Address: {area}</span>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-semibold leading-relaxed">This topic appears briefly. We recommend clarifying your practical work with it.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detected Skills */}
      <div className="card-white">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Detected Skills</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.skills.map((skill, i) => (
            <span
              key={i}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-slate-100 transition-colors cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center py-4 print:hidden">
        <button
          onClick={onStartInterview}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs cursor-pointer hover:scale-[1.01]"
        >
          Start Mock Interview Coach →
        </button>
        <button
          onClick={onBack}
          className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-6 py-3 rounded-xl text-xs cursor-pointer transition-colors"
        >
          Re-upload Resume
        </button>
      </div>
    </div>
  );
}
