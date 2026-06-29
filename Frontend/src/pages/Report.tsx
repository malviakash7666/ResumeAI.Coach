import React, { useState } from "react";

interface RoadmapItem {
  topic: string;
  actionableSteps: string[];
  estimatedTime: string;
}

interface IdealAnswer {
  question: string;
  idealAnswer: string;
}

interface FinalReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  weakTopics: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  idealAnswers: IdealAnswer[];
  studyRoadmap: RoadmapItem[];
}

interface ReportProps {
  report: FinalReport;
  onRestart: () => void;
  isGuest?: boolean;
}

export default function Report({ report, onRestart, isGuest = false }: ReportProps) {
  const [completedRoadmapSteps, setCompletedRoadmapSteps] = useState<Record<string, boolean>>({});

  // Toggle study checklist step
  const toggleRoadmapStep = (topicIndex: number, stepIndex: number) => {
    const key = `${topicIndex}-${stepIndex}`;
    setCompletedRoadmapSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4 space-y-8 animate-fade-in print:p-0 print:space-y-6">
      
      {/* Header */}
      <div className="text-center print:text-left print:border-b print:pb-4 print:border-slate-300">
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider print:hidden">
          Interview Completed
        </span>
        <h2 className="text-4xl font-black mt-3 print:text-2xl print:text-slate-900 print:mt-0">
          Interview Performance Evaluation Report
        </h2>
        <p className="text-slate-400 text-sm mt-1 print:text-slate-600 print:text-xs">
          Comprehensive review of your technical competency, communication delivery, strengths, and study roadmap
        </p>
      </div>

      {/* Scorecard Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        {/* Card 1: Overall Score */}
        <div className="bg-glass-card rounded-2xl p-5 border border-white/5 flex flex-col items-center text-center justify-center hover:border-violet-500/20 transition-all duration-300 print:bg-white print:border-slate-300 print:text-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 print:text-slate-500 print:text-[10px]">Overall Score</p>
          <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 flex items-center justify-center mb-1 shadow-lg shadow-violet-900/20 print:border-violet-600 print:shadow-none">
            <span className="text-2xl font-black text-violet-300 print:text-violet-600">{report.overallScore}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 print:text-slate-500">Scale of 1.0 – 10.0</span>
        </div>

        {/* Card 2: Tech Score */}
        <div className="bg-glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 print:bg-white print:border-slate-300 print:text-slate-800">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1 print:text-slate-500 print:text-[10px]">Technical Accuracy</p>
            <h3 className="text-xl font-black text-indigo-400 print:text-indigo-600">{report.technicalScore} / 10</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 print:text-slate-600">
              Assesses architectural correctness, pattern implementation, and logic systems.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden mt-3 print:bg-slate-200">
            <div className="h-full rounded-full bg-indigo-500 print:bg-indigo-600" style={{ width: `${report.technicalScore * 10}%` }} />
          </div>
        </div>

        {/* Card 3: Comm Score */}
        <div className="bg-glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300 print:bg-white print:border-slate-300 print:text-slate-800">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1 print:text-slate-500 print:text-[10px]">Communication</p>
            <h3 className="text-xl font-black text-emerald-400 print:text-emerald-600">{report.communicationScore} / 10</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 print:text-slate-600">
              Measures response structure, articulation speed, and trade-off explanations.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden mt-3 print:bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 print:bg-emerald-600" style={{ width: `${report.communicationScore * 10}%` }} />
          </div>
        </div>

        {/* Card 4: Confidence Score */}
        <div className="bg-glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-sky-500/20 transition-all duration-300 print:bg-white print:border-slate-300 print:text-slate-800">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1 print:text-slate-500 print:text-[10px]">Confidence</p>
            <h3 className="text-xl font-black text-sky-400 print:text-sky-600">{report.confidenceScore} / 10</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 print:text-slate-600">
              Measures assertiveness, pacing, speaking fluidness, and composure.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden mt-3 print:bg-slate-200">
            <div className="h-full rounded-full bg-sky-500 print:bg-sky-600" style={{ width: `${report.confidenceScore * 10}%` }} />
          </div>
        </div>

      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Strengths */}
        <div className="bg-glass rounded-2xl p-6 border border-white/5 flex flex-col print:bg-white print:border-slate-300 print:text-slate-800">
          <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-emerald-400 print:text-emerald-700">
            <span>✓</span> Key Strengths & Assets
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {report.strengths?.map((item, i) => (
              <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-start gap-2.5 print:bg-slate-50 print:border-slate-200">
                <span className="text-emerald-500 text-sm mt-0.5">•</span>
                <span className="text-xs font-semibold text-slate-300 leading-relaxed print:text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-glass rounded-2xl p-6 border border-white/5 flex flex-col print:bg-white print:border-slate-300 print:text-slate-800">
          <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-red-400 print:text-red-700">
            <span>✕</span> Areas of Improvement
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {report.weaknesses?.map((item, i) => (
              <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex items-start gap-2.5 print:bg-slate-50 print:border-slate-200">
                <span className="text-red-500 text-sm mt-0.5">•</span>
                <span className="text-xs font-semibold text-slate-300 leading-relaxed print:text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Topics & Weak Topics */}
      <div className="bg-glass rounded-2xl p-6 border border-white/5 print:bg-white print:border-slate-300 print:text-slate-800">
        <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-violet-400 print:text-violet-700">
          <span>◈</span> Recommended Topics to Revise
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {report.recommendedTopics?.map((topic, i) => (
            <span key={i} className="bg-slate-800 border border-white/15 text-slate-200 text-xs px-3 py-1.5 rounded-lg print:bg-slate-100 print:text-slate-800 print:border-slate-300">
              {topic}
            </span>
          ))}
          {report.weakTopics?.map((topic, i) => (
            <span key={`weak-${i}`} className="bg-slate-800 border border-white/15 text-slate-200 text-xs px-3 py-1.5 rounded-lg print:bg-slate-100 print:text-slate-800 print:border-slate-300">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Ideal Answers Comparison */}
      {report.idealAnswers && report.idealAnswers.length > 0 && (
        <div className="bg-glass rounded-2xl p-6 border border-white/5 print:bg-white print:border-slate-300 print:text-slate-800 print:page-break-before">
          <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-sky-400 print:text-sky-700">
            <span>💡</span> Interview Questions & Ideal Answers
          </h4>
          <div className="space-y-4">
            {report.idealAnswers.map((item, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-xl p-4 space-y-2 print:bg-slate-50 print:border-slate-200">
                <h5 className="text-xs font-bold text-slate-300 print:text-slate-800">
                  Q{idx + 1}: {item.question}
                </h5>
                <p className="text-xs text-slate-400 leading-relaxed italic print:text-slate-600">
                  <span className="font-semibold text-sky-400 print:text-sky-600 not-italic block mb-0.5">Ideal Response:</span>
                  "{item.idealAnswer}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Study Roadmap */}
      <div className="bg-glass rounded-2xl p-6 border border-white/5 print:bg-white print:border-slate-300 print:text-slate-800 print:page-break-before">
        <div className="mb-6">
          <h4 className="font-bold text-base flex items-center gap-2 text-violet-400 print:text-violet-700">
            <span>◈</span> Personalized Study Roadmap
          </h4>
          <p className="text-slate-400 text-xs mt-1 print:text-slate-600">AI-generated checklist steps to patch your knowledge gaps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
          {report.studyRoadmap?.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between hover:border-violet-500/10 transition-colors print:bg-slate-50 print:border-slate-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider print:text-slate-500">{item.estimatedTime}</span>
                  <span className="bg-violet-500/15 text-violet-400 font-bold border border-violet-500/10 px-2 py-0.5 rounded text-[9px] uppercase print:bg-violet-100 print:text-violet-700">
                    Phase {idx + 1}
                  </span>
                </div>
                
                <h5 className="font-bold text-sm text-slate-200 mb-3 print:text-slate-800">{item.topic}</h5>
                
                <div className="space-y-2 mt-2">
                  {item.actionableSteps.map((step, stepIdx) => {
                    const isDone = completedRoadmapSteps[`${idx}-${stepIdx}`];
                    return (
                      <div
                        key={stepIdx}
                        onClick={() => toggleRoadmapStep(idx, stepIdx)}
                        className="flex items-start gap-2 cursor-pointer group text-left print:pointer-events-none"
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors print:hidden ${
                          isDone
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-600 group-hover:border-slate-400"
                        }`}>
                          {isDone && <span className="text-[10px] text-white font-bold">✓</span>}
                        </div>
                        <span className={`text-xs select-none transition-colors ${
                          isDone ? "text-slate-500 line-through print:text-slate-400" : "text-slate-400 group-hover:text-slate-300 print:text-slate-600"
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA / Operations Buttons */}
      <div className="flex flex-col items-center gap-4 py-4 print:hidden">
        {isGuest && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-6 py-2.5 rounded-xl text-center leading-relaxed max-w-md mb-2">
            🔒 Register or Login to save your session and download this high-fidelity PDF evaluation report.
          </div>
        )}

        <div className="flex items-center gap-4 justify-center">
          {!isGuest ? (
            <button
              onClick={handlePrintPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/30 text-sm hover:scale-[1.02] cursor-pointer"
            >
              Download Report as PDF
            </button>
          ) : (
            <button
              disabled
              className="bg-slate-800 text-slate-500 border border-white/5 font-bold px-8 py-3.5 rounded-xl text-sm cursor-not-allowed"
              title="Authentication required to download report"
            >
              Download Report (Locked)
            </button>
          )}

          <button
            onClick={onRestart}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-violet-600/30 text-sm hover:scale-[1.02] cursor-pointer"
          >
            Upload Another Resume
          </button>
        </div>
      </div>

      {/* Printable Custom Style Block */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: #1e293b !important;
            font-size: 12px !important;
          }
          /* Hide non-printable items */
          .print\\:hidden {
            display: none !important;
          }
          /* Expand printable elements to full screen width */
          .max-w-4xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Card backgrounds and borders */
          .bg-glass, .bg-glass-card, .bg-slate-900\\/60, .bg-slate-950\\/40 {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #1e293b !important;
            box-shadow: none !important;
          }
          h2, h3, h4, h5, span, p, li {
            color: #0f172a !important;
          }
          .text-violet-300, .text-violet-400, .text-indigo-400, .text-emerald-400, .text-sky-400, .text-amber-400 {
            color: #4f46e5 !important; /* fallback print color (dark indigo) */
          }
          /* Custom page break rules */
          .print\\:page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
