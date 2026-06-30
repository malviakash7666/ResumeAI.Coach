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

  // SVG circular gauge logic
  const overallScorePct = Math.round(report.overallScore * 10);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScorePct / 100) * circumference;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-6 animate-fade-in text-slate-800 font-semibold text-xs print:p-0 print:space-y-4">
      
      {/* Header */}
      <div className="text-center sm:text-left border-b border-slate-200 pb-4 print:border-slate-300">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider print:hidden">
          Evaluation Complete 🎉
        </span>
        <h2 className="text-3xl font-black text-slate-900 mt-3 print:text-xl print:mt-0">
          Mock Interview Evaluation Report
        </h2>
        <p className="text-slate-450 text-[11px] mt-0.5 leading-relaxed print:text-xs">
          Structured review of your technical execution, communication flow, confidence metrics, and study checklist
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        {/* Card 1: Overall score */}
        <div className="card-white flex flex-col items-center text-center justify-center p-5 print:bg-white print:border-slate-300">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Overall Score</p>
          <div className="relative w-22 h-22 flex items-center justify-center">
            <svg className="w-full h-full dial-svg" viewBox="0 0 100 100">
              <circle className="dial-circle-bg" cx="50" cy="50" r={radius} strokeWidth="8" />
              <circle
                className="dial-circle-progress"
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-indigo-600">{overallScorePct}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tech score */}
        <div className="card-white p-5 flex flex-col justify-between print:bg-white print:border-slate-300">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Technical Accuracy</p>
            <h3 className="text-xl font-black text-indigo-650">{report.technicalScore} <span className="text-slate-300 font-normal">/ 10</span></h3>
            <p className="text-[9px] text-slate-500 mt-1 font-semibold leading-relaxed">
              Assesses framework concepts, system layouts, and query setups.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${report.technicalScore * 10}%` }} />
          </div>
        </div>

        {/* Card 3: Comm score */}
        <div className="card-white p-5 flex flex-col justify-between print:bg-white print:border-slate-300">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Communication Flow</p>
            <h3 className="text-xl font-black text-emerald-600">{report.communicationScore} <span className="text-slate-300 font-normal">/ 10</span></h3>
            <p className="text-[9px] text-slate-500 mt-1 font-semibold leading-relaxed">
              Assesses structure, trade-off analysis, and greeting fluidness.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${report.communicationScore * 10}%` }} />
          </div>
        </div>

        {/* Card 4: Conf score */}
        <div className="card-white p-5 flex flex-col justify-between print:bg-white print:border-slate-300">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Confidence Metrics</p>
            <h3 className="text-xl font-black text-sky-600">{report.confidenceScore} <span className="text-slate-300 font-normal">/ 10</span></h3>
            <p className="text-[9px] text-slate-500 mt-1 font-semibold leading-relaxed">
              Assesses composure, speaking pacing, and assertiveness.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${report.confidenceScore * 10}%` }} />
          </div>
        </div>

      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Strengths */}
        <div className="card-white flex flex-col print:bg-white print:border-slate-300">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Key Strengths
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {report.strengths?.map((item, i) => (
              <div key={i} className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex items-start gap-2.5">
                <span className="text-emerald-600 text-sm leading-none mt-0.5">•</span>
                <span className="text-slate-650 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="card-white flex flex-col print:bg-white print:border-slate-300">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="text-red-500">✕</span> Areas to Improve
          </h4>
          <div className="flex-1 flex flex-col gap-3">
            {report.weaknesses?.map((item, i) => (
              <div key={i} className="bg-red-50/50 border border-red-100/50 p-3 rounded-xl flex items-start gap-2.5">
                <span className="text-red-600 text-sm leading-none mt-0.5">•</span>
                <span className="text-slate-650 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="card-white print:bg-white print:border-slate-300">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Recommended Revision Topics</h4>
        <div className="flex flex-wrap gap-2">
          {report.recommendedTopics?.map((topic, i) => (
            <span key={i} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg">
              {topic}
            </span>
          ))}
          {report.weakTopics?.map((topic, i) => (
            <span key={`weak-${i}`} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Ideal Answers */}
      {report.idealAnswers && report.idealAnswers.length > 0 && (
        <div className="card-white print:bg-white print:border-slate-300 print:page-break-before">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Questions & Ideal Answers</h4>
          <div className="space-y-4">
            {report.idealAnswers.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-slate-800">
                  Q{idx + 1}: {item.question}
                </h5>
                <p className="text-slate-500 leading-relaxed italic">
                  <span className="font-bold text-indigo-600 not-italic block mb-0.5 text-[9px] uppercase tracking-wide">Ideal Response</span>
                  "{item.idealAnswer}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Roadmap */}
      {report.studyRoadmap && report.studyRoadmap.length > 0 && (
        <div className="card-white print:bg-white print:border-slate-300 print:page-break-before">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Personalized Study Roadmap</h4>
            <p className="text-slate-450 text-[10px] mt-0.5 leading-normal">AI-generated roadmap steps to patch your detected gaps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {report.studyRoadmap.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{item.estimatedTime}</span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[8px] uppercase">
                      Phase {idx + 1}
                    </span>
                  </div>
                  
                  <h5 className="font-bold text-slate-850 mb-3">{item.topic}</h5>
                  
                  <div className="space-y-2.5 mt-2">
                    {item.actionableSteps.map((step, stepIdx) => {
                      const isDone = completedRoadmapSteps[`${idx}-${stepIdx}`];
                      return (
                        <div
                          key={stepIdx}
                          onClick={() => toggleRoadmapStep(idx, stepIdx)}
                          className="flex items-start gap-2 cursor-pointer group text-left"
                        >
                          <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                            isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 group-hover:border-slate-400 bg-white"
                          }`}>
                            {isDone && <span className="text-[9px] font-black">✓</span>}
                          </div>
                          <span className={`text-[11px] select-none transition-colors leading-relaxed ${
                            isDone ? "text-slate-400 line-through" : "text-slate-500 group-hover:text-slate-700"
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
      )}

      {/* Buttons */}
      <div className="flex flex-col items-center gap-4 py-4 print:hidden">
        {isGuest && (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs px-6 py-2.5 rounded-xl text-center leading-relaxed max-w-md font-bold mb-2">
            🔒 Register or Login to save your session and download this high-fidelity PDF evaluation report.
          </div>
        )}

        <div className="flex items-center gap-4 justify-center">
          {!isGuest ? (
            <button
              onClick={handlePrintPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 text-xs cursor-pointer hover:scale-[1.01]"
            >
              Download Report as PDF
            </button>
          ) : (
            <button
              disabled
              className="bg-slate-200 text-slate-400 border border-slate-300 font-bold px-8 py-3.5 rounded-xl text-xs cursor-not-allowed"
            >
              Download Report (Locked)
            </button>
          )}

          <button
            onClick={onRestart}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs cursor-pointer hover:scale-[1.01]"
          >
            Upload Another Resume
          </button>
        </div>
      </div>
    </div>
  );
}
