import React, { useState } from "react";

interface ModeSelectionProps {
  onStartInterview: (mode: "text" | "voice") => void;
  onBack: () => void;
}

export default function ModeSelection({ onStartInterview, onBack }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<"text" | "voice">("text");

  return (
    <div className="w-full max-w-2xl mx-auto py-8 animate-fade-in text-slate-800 text-center">
      {/* Header */}
      <div className="mb-10">
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Step 2: Configuration
        </span>
        <h2 className="text-3xl font-black text-slate-900 mt-4">Select Interview Mode</h2>
        <p className="text-slate-400 text-xs mt-2">Choose how you want to interact with our technical AI coach</p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Card 1: Text Chat */}
        <div
          onClick={() => setSelectedMode("text")}
          className={`bg-white rounded-2xl p-8 border cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 text-center select-none ${
            selectedMode === "text"
              ? "border-indigo-600 ring-2 ring-indigo-600/10 scale-[1.02] shadow-lg shadow-indigo-600/5"
              : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
          }`}
        >
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border transition-colors ${
            selectedMode === "text"
              ? "bg-indigo-50 border-indigo-100 text-indigo-600"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            💬
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Text Interview</h3>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
              Standard chat-based Technical Interview. The recruiter prints questions, and you type out responses. Ideal for quiet spaces.
            </p>
          </div>
        </div>

        {/* Card 2: Voice Conversation */}
        <div
          onClick={() => setSelectedMode("voice")}
          className={`bg-white rounded-2xl p-8 border cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 text-center select-none ${
            selectedMode === "voice"
              ? "border-indigo-600 ring-2 ring-indigo-600/10 scale-[1.02] shadow-lg shadow-indigo-600/5"
              : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
          }`}
        >
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border transition-colors ${
            selectedMode === "voice"
              ? "bg-indigo-50 border-indigo-100 text-indigo-600"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            🎙️
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Voice Interview</h3>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
              Speak naturally using your microphone. The AI reads questions out loud. Automatically detects when you pause and submits.
            </p>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <button
          onClick={() => onStartInterview(selectedMode)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs hover:scale-[1.01] cursor-pointer"
        >
          Start Interview →
        </button>

        <button
          onClick={onBack}
          className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-6 py-3 rounded-xl text-xs cursor-pointer transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
