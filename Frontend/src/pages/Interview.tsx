import React, { useState, useEffect } from "react";
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
  const [seconds, setSeconds] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Timer
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

  const getLatestQuestion = () => {
    const interviewerMsgs = chatMessages.filter((m) => m.role === "interviewer");
    if (interviewerMsgs.length === 0) return "";
    return interviewerMsgs[interviewerMsgs.length - 1].content;
  };

  // Voice Mode TTS Playback
  useEffect(() => {
    if (mode === "voice" && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === "interviewer") {
        setVoiceError(null);
        sttService.stopListening();
        setIsListening(false);
        setLiveTranscript("");

        setIsAISpeaking(true);
        ttsService.speak(
          lastMsg.content,
          () => {
            setIsAISpeaking(true);
          },
          () => {
            setIsAISpeaking(false);
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
    return () => {
      ttsService.stop();
    };
  }, [chatMessages, mode]);

  // STT Listeners
  const handleStartListening = () => {
    setVoiceError(null);
    setLiveTranscript("");
    setIsListening(true);

    sttService.startListening(
      (text, isFinal) => {
        setLiveTranscript(text);
        if (isFinal) {
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
          setVoiceError(`Microphone error: ${err}.`);
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

  // Metric averages
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
  
  // Score Dial gauge
  const avgScorePct = Math.round(getOverallAverage() * 10);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgScorePct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2 flex-1 items-stretch animate-fade-in text-slate-800 font-semibold text-xs">
      
      {/* ── Left Side Main Column ── */}
      <div className="lg:col-span-2 flex flex-col bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-sm min-h-[520px]">
        {/* Title bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Session Mode: {mode === "voice" ? "Voice Interview" : "Text Chat Interview"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono bg-slate-200 border border-slate-300 px-2 py-0.5 rounded text-slate-600">
              ⏱️ {formatTimer()}
            </span>
            <button
              onClick={onEndInterview}
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              End Interview
            </button>
          </div>
        </div>

        {voiceError && (
          <div className="bg-red-50 border-b border-red-100 text-red-700 text-[10px] px-4 py-2">
            ⚠️ {voiceError}
          </div>
        )}

        {/* ── VOICE MODE PANEL ── */}
        {mode === "voice" ? (
          <div className="flex-1 flex flex-col justify-between p-6">
            
            {/* Top Question */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block mb-2">Interviewer Question</span>
              <p className="text-slate-800 text-xs leading-relaxed font-semibold">
                {getLatestQuestion() || "Preparing interview question..."}
              </p>
            </div>

            {/* Avatar Pulsator */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative">
                {/* Ring 1 */}
                <div className={`absolute inset-0 rounded-full transition-all duration-300 blur-md ${
                  isAISpeaking 
                    ? "bg-indigo-500/10 scale-150 animate-pulse" 
                    : isListening 
                    ? "bg-emerald-500/10 scale-150 animate-pulse" 
                    : "bg-slate-200/50 scale-110"
                }`} />
                
                {/* Ring 2 */}
                <div className={`absolute inset-0 rounded-full transition-all duration-300 blur-sm ${
                  isAISpeaking 
                    ? "bg-indigo-500/20 scale-125" 
                    : isListening 
                    ? "bg-emerald-500/20 scale-125" 
                    : "bg-slate-200"
                }`} />

                {/* Core Avatar */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                  isAISpeaking
                    ? "bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-500/10"
                    : isListening
                    ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-4xl select-none">
                    {isAISpeaking ? "🤖" : isListening ? "🎙️" : "👤"}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold text-slate-400 mt-4 tracking-wider uppercase">
                {isAISpeaking ? "AI Coach is speaking..." : isListening ? "Listening... Speak now" : "Awaiting response..."}
              </span>
            </div>

            {/* Waveform and mic */}
            <div className="flex flex-col items-center gap-4">
              {/* Waveform indicator */}
              <div className={`flex items-center gap-1 h-8 ${isListening ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
                {[0.8, 1.4, 0.6, 1.2, 0.4, 1.5, 0.7, 1.1, 0.5, 0.9].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-emerald-500"
                    style={{
                      height: "100%",
                      transform: isListening ? `scaleY(${val})` : "scaleY(0.2)",
                      animation: isListening ? `bounce 1s infinite alternate ${idx * 0.1}s` : "none",
                    }}
                  />
                ))}
              </div>

              {/* Large Mic Trigger */}
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isAISpeaking || isSubmittingAnswer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all shadow-md cursor-pointer ${
                  isListening
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white scale-110"
                    : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650"
                } disabled:bg-slate-200 disabled:text-slate-400 disabled:border-none disabled:cursor-not-allowed`}
              >
                {isListening ? "⏹" : "🎤"}
              </button>

              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-12 flex items-center justify-center text-center">
                {liveTranscript ? (
                  <p className="text-xs text-emerald-700 italic font-semibold leading-relaxed">
                    "{liveTranscript}"
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-450">
                    {isListening ? "Start speaking. The mic will auto-submit when you pause." : "Click the mic button to speak your answer manually."}
                  </p>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ── TEXT CHAT PANEL ── */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[360px]">
              {chatMessages.map((msg, idx) => {
                const isInterviewer = msg.role === "interviewer";
                return (
                  <div key={idx} className="flex flex-col space-y-1">
                    <div className={`flex ${isInterviewer ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                          isInterviewer
                            ? "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                            : "bg-indigo-650 text-white rounded-tr-none shadow-sm"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>

                    {!isInterviewer && msg.feedback && (
                      <div className="flex justify-end pr-2">
                        <div className="max-w-[80%] bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[10px] text-slate-600 space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-[9px] uppercase text-indigo-600 tracking-wider">Answer Evaluation</span>
                            <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 px-2 py-0.5 rounded text-[9px]">
                              Score: {msg.score}/10
                            </span>
                          </div>
                          <p className="italic text-slate-500">"{msg.feedback}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isSubmittingAnswer && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 text-slate-450 rounded-2xl rounded-tl-none p-4 text-[10px] flex items-center gap-1.5 font-bold">
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

            {/* Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitAnswer();
              }} 
              className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3"
            >
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your structured answer here (e.g. explain concepts, include code structure, describe scenarios)..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-14"
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
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl px-5 flex items-center justify-center transition-colors shadow-sm cursor-pointer border-none"
              >
                Submit
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Right Side Scorecard Panel ── */}
      <div className="flex flex-col gap-6">
        
        {/* Live Score Dial */}
        <div className="card-white flex flex-col items-center text-center p-5">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-4">Live Performance Scorecard</h4>
          
          <div className="relative w-26 h-26 flex items-center justify-center">
            <svg className="w-full h-full dial-svg" viewBox="0 0 100 100">
              <circle
                className="dial-circle-bg"
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="8"
              />
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
              <span className="text-3xl font-black text-slate-900">{avgScorePct}%</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Live Score</span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="w-full space-y-3 mt-4 text-left font-semibold">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-400">Technical Knowledge</span>
                <span className="text-indigo-600 font-bold">{getAverageMetric("technicalScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-550"
                  style={{ width: `${getAverageMetric("technicalScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-400">Communication Clarity</span>
                <span className="text-emerald-600 font-bold">{getAverageMetric("communicationScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-550"
                  style={{ width: `${getAverageMetric("communicationScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-400">Confidence & Delivery</span>
                <span className="text-sky-600 font-bold">{getAverageMetric("confidenceScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-550"
                  style={{ width: `${getAverageMetric("confidenceScore") * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-400">Problem Solving</span>
                <span className="text-amber-600 font-bold">{getAverageMetric("problemSolvingScore")}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-550"
                  style={{ width: `${getAverageMetric("problemSolvingScore") * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Feedback Box */}
        <div className="card-white flex-1 flex flex-col p-4">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
            <span>Latest Feedback</span>
            {latestFeedback && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[9px] font-bold">
                Grade: {latestFeedback.score}/10
              </span>
            )}
          </h4>

          {latestFeedback ? (
            <div className="flex-1 flex flex-col justify-between">
              <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                "{latestFeedback.feedback}"
              </p>
              
              <div className="mt-4 border-t border-slate-100 pt-2 text-[9px] text-slate-450 grid grid-cols-2 gap-y-1">
                <span>Tech: {latestFeedback.technicalScore}/10</span>
                <span>Comm: {latestFeedback.communicationScore}/10</span>
                <span>Conf: {latestFeedback.confidenceScore ?? latestFeedback.score}/10</span>
                <span>Solve: {latestFeedback.problemSolvingScore ?? latestFeedback.score}/10</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl p-6 text-center">
              <p className="text-[10px] text-slate-400">
                Submit your first answer to generate live grading details.
              </p>
            </div>
          )}
        </div>

        {/* Session Progress dots */}
        <div className="card-white p-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-3">
            <span>Interview Progress</span>
            <span>{candidateAnswersCount} answered</span>
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
                        ? "bg-indigo-500"
                        : "bg-amber-500"
                      : isCurrent
                      ? "bg-indigo-650 animate-pulse"
                      : "bg-slate-100"
                  }`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-[8px] font-bold text-white px-2 py-1 rounded border border-slate-800 whitespace-nowrap z-10">
                    {isAnswered ? `Q${idx + 1}: ${score}/10` : isCurrent ? "Active" : `Q${idx + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
  );
}
