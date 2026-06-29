import React, { useState, useEffect, useRef } from "react";
import { ttsService, sttService } from "../services/speechService";

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
  feedback?: string;
  score?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  problemSolvingScore?: number;
}

interface LatestFeedback {
  feedback: string;
  score: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore?: number;
  problemSolvingScore?: number;
}

interface InterviewProps {
  mode: "text" | "voice";
  chatMessages: ChatMessage[];
  userAnswer: string;
  setUserAnswer: (val: string) => void;
  isSubmittingAnswer: boolean;
  latestFeedback: LatestFeedback | null;
  onSubmitAnswer: (voiceAnswer?: string) => void;
  onEndInterview: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function Interview({
  mode,
  chatMessages,
  userAnswer,
  setUserAnswer,
  isSubmittingAnswer,
  latestFeedback,
  onSubmitAnswer,
  onEndInterview,
  chatEndRef,
}: InterviewProps) {
  // Timer State
  const [seconds, setSeconds] = useState(0);

  // Voice Mode states
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // 1. Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Get current active interviewer question text
  const getLatestQuestion = () => {
    const interviewerMsgs = chatMessages.filter((m) => m.role === "interviewer");
    if (interviewerMsgs.length === 0) return "";
    return interviewerMsgs[interviewerMsgs.length - 1].content;
  };

  // 2. TTS Voice Playback on Question Change
  useEffect(() => {
    if (mode === "voice" && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === "interviewer") {
        setVoiceError(null);
        sttService.stopListening();
        setIsListening(false);
        setLiveTranscript("");

        // Speak the question
        setIsAISpeaking(true);
        ttsService.speak(
          lastMsg.content,
          () => {
            setIsAISpeaking(true);
          },
          () => {
            setIsAISpeaking(false);
            // Auto start listening after AI finishes speaking
            handleStartListening();
          },
          (err) => {
            console.error(err);
            setIsAISpeaking(false);
            setVoiceError("Text-to-Speech failed. You can read the question above.");
          }
        );
      }
    }

    // Clean up TTS when leaving interview
    return () => {
      ttsService.stop();
    };
  }, [chatMessages, mode]);

  // 3. STT Listening Handlers
  const handleStartListening = () => {
    setVoiceError(null);
    setLiveTranscript("");
    setIsListening(true);

    sttService.startListening(
      (text, isFinal) => {
        setLiveTranscript(text);
        if (isFinal) {
          // We can wait slightly or submit directly.
          // Since continuous mode is false (default browser STT stops after a silence pause),
          // we stop listening and trigger auto-submit!
          console.log("🎙️ Final speech text detected:", text);
          sttService.stopListening();
          setIsListening(false);
          if (text.trim().length > 0) {
            onSubmitAnswer(text);
          }
        }
      },
      () => {
        setIsListening(false);
      },
      (err) => {
        console.error(err);
        setIsListening(false);
        if (err !== "no-speech") {
          setVoiceError(`Microphone error: ${err}. Try manual clicking.`);
        }
      }
    );
  };

  const handleStopListening = () => {
    sttService.stopListening();
    setIsListening(false);
    if (liveTranscript.trim().length > 0) {
      onSubmitAnswer(liveTranscript);
    }
  };

  // Score calculations
  const getAverageMetric = (
    metric: "technicalScore" | "communicationScore" | "confidenceScore" | "problemSolvingScore"
  ) => {
    const scoredResponses = chatMessages.filter(
      (m) => m.role === "candidate" && m[metric] !== undefined
    );
    if (scoredResponses.length === 0) return 0;
    const sum = scoredResponses.reduce((acc, curr) => acc + (curr[metric] || 0), 0);
    return Math.round((sum / scoredResponses.length) * 10) / 10;
  };

  const getOverallAverage = () => {
    const scoredResponses = chatMessages.filter((m) => m.role === "candidate" && m.score !== undefined);
    if (scoredResponses.length === 0) return 0;
    const sum = scoredResponses.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round((sum / scoredResponses.length) * 10) / 10;
  };

  const candidateAnswersCount = chatMessages.filter((m) => m.role === "candidate").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2 flex-1 max-h-[85vh] min-h-[600px] animate-fade-in">
      {/* ── Left Side: Text mode vs Voice mode layout ── */}
      <div className="lg:col-span-2 flex flex-col bg-glass rounded-2xl border border-white/5 overflow-hidden">
        {/* Title bar */}
        <div className="bg-slate-900/60 border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Session: {mode === "voice" ? "Voice Conversation" : "Text Chat"} Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-slate-400">
              Timer: {formatTimer()}
            </span>
            <button
              onClick={onEndInterview}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Finish & Report
            </button>
          </div>
        </div>

        {voiceError && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs px-4 py-2">
            ⚠️ {voiceError}
          </div>
        )}

        {/* ── MODE 1: VOICE MODE VIEW ── */}
        {mode === "voice" ? (
          <div className="flex-1 flex flex-col justify-between p-6">
            
            {/* Top: Current Question */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-inner">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-2">Interviewer Question</span>
              <p className="text-slate-200 text-sm leading-relaxed font-medium">
                {getLatestQuestion() || "Preparing interview question..."}
              </p>
            </div>

            {/* Center: Glowing Pulser AI Avatar */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative">
                {/* Outermost pulsing ring */}
                <div className={`absolute inset-0 rounded-full transition-all duration-300 blur-md ${
                  isAISpeaking 
                    ? "bg-violet-500/20 scale-150 animate-pulse" 
                    : isListening 
                    ? "bg-emerald-500/20 scale-150 animate-pulse" 
                    : "bg-slate-700/10 scale-110"
                }`} />
                
                {/* Secondary ring */}
                <div className={`absolute inset-0 rounded-full transition-all duration-300 blur-sm ${
                  isAISpeaking 
                    ? "bg-violet-500/35 scale-125" 
                    : isListening 
                    ? "bg-emerald-500/35 scale-125" 
                    : "bg-slate-700/20"
                }`} />

                {/* Core Avatar circle */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                  isAISpeaking
                    ? "bg-violet-950/80 border-violet-500 glow-violet"
                    : isListening
                    ? "bg-emerald-950/80 border-emerald-500 glow-emerald"
                    : "bg-slate-800 border-white/10"
                }`}>
                  <span className="text-4xl select-none">
                    {isAISpeaking ? "🤖" : isListening ? "🎙️" : "👤"}
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-400 mt-4 tracking-wider uppercase">
                {isAISpeaking ? "AI Coach is speaking..." : isListening ? "Listening to your answer..." : "Awaiting response..."}
              </span>
            </div>

            {/* Bottom: Microphone button + waveform + live transcript */}
            <div className="flex flex-col items-center gap-4">
              
              {/* Waveform indicator */}
              <div className={`flex items-center gap-1 h-8 ${isListening ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
                {[0.8, 1.4, 0.6, 1.2, 0.4, 1.5, 0.7, 1.1, 0.5, 0.9].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-emerald-400"
                    style={{
                      height: "100%",
                      transform: isListening ? `scaleY(${val})` : "scaleY(0.2)",
                      animation: isListening ? `bounce 1s infinite alternate ${idx * 0.1}s` : "none",
                    }}
                  />
                ))}
              </div>

              {/* Large Glowing Mic Button */}
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isAISpeaking || isSubmittingAnswer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all shadow-lg cursor-pointer ${
                  isListening
                    ? "bg-emerald-600 hover:bg-emerald-500 glow-emerald scale-110"
                    : "bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300"
                } disabled:bg-slate-900 disabled:text-slate-700 disabled:border-none disabled:cursor-not-allowed`}
              >
                {isListening ? "⏹" : "🎤"}
              </button>

              {/* Real-time live transcript banner */}
              <div className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 min-h-12 flex items-center justify-center text-center">
                {liveTranscript ? (
                  <p className="text-xs text-emerald-300 italic font-medium leading-relaxed">
                    "{liveTranscript}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {isListening ? "Start speaking. The mic will auto-submit when you pause." : "Click the mic button to speak your answer manually."}
                  </p>
                )}
              </div>
            </div>

          </div>
        ) : (
          
          /* ── MODE 2: TEXT MODE VIEW ── */
          <>
            {/* Chat message history container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => {
                const isInterviewer = msg.role === "interviewer";
                return (
                  <div key={idx} className="flex flex-col space-y-1">
                    <div className={`flex ${isInterviewer ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                          isInterviewer
                            ? "bg-slate-800/80 border border-slate-700 text-slate-100 rounded-tl-none"
                            : "bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-900/20"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>

                    {!isInterviewer && msg.feedback && (
                      <div className="flex justify-end pr-2">
                        <div className="max-w-[80%] bg-slate-800/40 border border-white/5 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-[10px] uppercase text-violet-400 tracking-wider">Answer Evaluation</span>
                            <span className="bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20 px-2 py-0.5 rounded text-[10px]">
                              Score: {msg.score}/10
                            </span>
                          </div>
                          <p className="italic text-slate-400">"{msg.feedback}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isSubmittingAnswer && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700 text-slate-400 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-1.5">
                    <span>AI Interviewer is evaluating and thinking</span>
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="dot-bounce"></span>
                      <span className="dot-bounce"></span>
                      <span className="dot-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Message Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitAnswer();
              }} 
              className="bg-slate-900/80 border-t border-white/5 p-4 flex gap-3"
            >
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your structured answer here (e.g. explain concepts, include code structure, describe scenarios)..."
                className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none h-14"
                disabled={isSubmittingAnswer}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitAnswer();
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={isSubmittingAnswer || !userAnswer.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl px-5 flex items-center justify-center transition-colors shadow-lg shadow-violet-900/20 cursor-pointer"
              >
                Submit
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Right Side: Live Scorecard Panel (1/3 width) ── */}
      <div className="flex flex-col gap-6">
        
        {/* 1. Overall Score Panel */}
        <div className="bg-glass-card rounded-2xl p-5 border border-white/5 flex flex-col items-center text-center">
          <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Live Performance Scorecard</h4>
          
          {/* Score Dial */}
          <div className="relative w-26 h-26 flex items-center justify-center rounded-full bg-slate-950/60 border border-white/10 mb-4 shadow-inner">
            <div className="absolute inset-2 rounded-full bg-violet-600/5 blur-sm" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-violet-400">{getOverallAverage()}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Avg Score</span>
            </div>
          </div>

          {/* Score breakdown metrics (4 dimensions) */}
          <div className="w-full space-y-3 mt-2 text-left">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Technical Knowledge</span>
                <span className="text-violet-300 font-bold">{getAverageMetric("technicalScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${getAverageMetric("technicalScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Communication Clarity</span>
                <span className="text-emerald-400 font-bold">{getAverageMetric("communicationScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${getAverageMetric("communicationScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Confidence & Delivery</span>
                <span className="text-sky-400 font-bold">{getAverageMetric("confidenceScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${getAverageMetric("confidenceScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Problem Solving</span>
                <span className="text-amber-400 font-bold">{getAverageMetric("problemSolvingScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${getAverageMetric("problemSolvingScore") * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Latest Question Grading feedback */}
        <div className="bg-glass rounded-2xl p-4 border border-white/5 flex-1 flex flex-col">
          <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
            <span>Latest Feedback</span>
            {latestFeedback && (
              <span className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                Grade: {latestFeedback.score}/10
              </span>
            )}
          </h4>

          {latestFeedback ? (
            <div className="flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-4 rounded-xl border border-white/5">
                "{latestFeedback.feedback}"
              </p>
              
              <div className="mt-4 border-t border-white/5 pt-2 text-[10px] text-slate-500 grid grid-cols-2 gap-y-1">
                <span>Tech: {latestFeedback.technicalScore}/10</span>
                <span>Comm: {latestFeedback.communicationScore}/10</span>
                <span>Conf: {latestFeedback.confidenceScore ?? latestFeedback.score}/10</span>
                <span>Solve: {latestFeedback.problemSolvingScore ?? latestFeedback.score}/10</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl p-6 text-center">
              <p className="text-xs text-slate-500">
                Submit your first answer to generate live grading details.
              </p>
            </div>
          )}
        </div>

        {/* 3. Session Progress Tracker */}
        <div className="bg-glass rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-3">
            <span>Interview Progress</span>
            <span>Questions: {candidateAnswersCount} answered</span>
          </div>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.max(5, candidateAnswersCount) }).map((_, idx) => {
              const candidateAnswers = chatMessages.filter(m => m.role === "candidate");
              const isAnswered = idx < candidateAnswers.length;
              const isCurrent = idx === candidateAnswers.length;
              const score = isAnswered ? candidateAnswers[idx].score : null;

              return (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full relative group transition-colors ${
                    isAnswered
                      ? score && score >= 8
                        ? "bg-emerald-500"
                        : score && score >= 6
                        ? "bg-violet-500"
                        : "bg-amber-500"
                      : isCurrent
                      ? "bg-indigo-400 animate-pulse"
                      : "bg-slate-800"
                  }`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-[10px] font-bold text-white px-2 py-1 rounded border border-white/10 whitespace-nowrap z-10">
                    {isAnswered ? `Q${idx + 1}: ${score}/10` : isCurrent ? "Active" : `Q${idx + 1}: Queue`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CSS Keyframes for Waveform bounces */}
      <style>{`
        @keyframes bounce {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
  );
}
