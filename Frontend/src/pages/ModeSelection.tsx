import React, { useState } from "react";

interface ModeSelectionProps {
  onStartInterview: (mode: "text" | "voice") => void;
  onBack: () => void;
}

export default function ModeSelection({ onStartInterview, onBack }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<"text" | "voice">("text");

  return (
    <div className="max-w-2xl mx-auto w-full py-8 animate-fade-in text-center">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
          Step 2: Configuration
        </span>
        <h2 className="text-3xl font-black mt-4">Select Interview Mode</h2>
        <p className="text-slate-400 text-sm mt-2">Choose how you want to interact with our technical AI coach</p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Card 1: Text Chat */}
        <div
          onClick={() => setSelectedMode("text")}
          className={`bg-glass rounded-2xl p-6 border cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 text-center select-none ${
            selectedMode === "text"
              ? "border-violet-500 bg-violet-500/10 scale-[1.03] shadow-lg shadow-violet-500/10"
              : "border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border transition-colors ${
            selectedMode === "text"
              ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
              : "bg-slate-800/40 border-white/5 text-slate-400"
          }`}>
            💬
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Text Chat</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Standard ChatGPT-style text dialogue. The interviewer asks questions in text, and you type out your responses. Ideal for quiet spaces.
            </p>
          </div>
        </div>

        {/* Card 2: Voice Conversation */}
        <div
          onClick={() => setSelectedMode("voice")}
          className={`bg-glass rounded-2xl p-6 border cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 text-center select-none ${
            selectedMode === "voice"
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.03] shadow-lg shadow-emerald-500/10"
              : "border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border transition-colors ${
            selectedMode === "voice"
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-slate-800/40 border-white/5 text-slate-400"
          }`}>
            🎙️
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Voice Conversation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real-time speaking conversation. The AI reads questions out loud. You speak your answers naturally through your mic with automatic submission.
            </p>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <button
          onClick={() => onStartInterview(selectedMode)}
          className={`w-full sm:w-auto text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg text-sm hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 ${
            selectedMode === "voice"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-600/30"
          }`}
        >
          <span>Start Interview</span>
          <span className="text-lg">→</span>
        </button>

        <button
          onClick={onBack}
          className="w-full sm:w-auto text-slate-400 hover:text-white transition-colors text-xs font-semibold px-5 py-3 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
