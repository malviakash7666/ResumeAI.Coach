import { useState, useRef } from "react";

const BACKEND_URL = "http://localhost:5000";

interface HomeProps {
  onUploadStart: (text: string) => void;
  onUploadSuccess: (sessionId: string, fileName: string, analysisData: any) => void;
  onUploadError: (msg: string) => void;
  token: string | null;
}

export default function Home({ onUploadStart, onUploadSuccess, onUploadError, token }: HomeProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const processFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      onUploadError("Please upload a PDF resume. Other formats are currently not supported.");
      return;
    }

    setFileName(file.name);
    onUploadStart("Uploading resume and extracting text content...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      // Optional Auth header
      const authHeaders: Record<string, string> = {};
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }

      // 1. Upload Resume
      const uploadRes = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const uploadResJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadResJson.success) {
        throw new Error(uploadResJson.message || "Failed to upload resume.");
      }

      const sId = uploadResJson.data.sessionId;

      // 2. Perform Analysis
      onUploadStart("Recruiter AI is analyzing your skills and experience...");
      const analyzeRes = await fetch(`${BACKEND_URL}/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ sessionId: sId }),
      });

      const analyzeResJson = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeResJson.success) {
        throw new Error(analyzeResJson.message || "Failed to analyze resume.");
      }

      const analysisData = analyzeResJson.data;
      onUploadSuccess(sId, file.name, analysisData);
    } catch (err: any) {
      console.error(err);
      onUploadError(err.message || "An unexpected error occurred during processing.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8 animate-fade-in">
      {/* Left Content */}
      <div className="flex-1 text-center lg:text-left">
        <p className="inline-block text-xs font-semibold tracking-widest uppercase text-violet-400 border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 rounded-full mb-6">
          Interactive Mock Interview Coach
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-6">
          Upload your resume,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
            conquer the interview.
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
          Drop your PDF resume below. Our Recruiter AI parses it in seconds, maps your weak points, conducts a strict live interview, and generates a personalized study roadmap.
        </p>
        
        <div className="flex items-center gap-6 justify-center lg:justify-start text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> PDF parsing text
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> LLaMA 3.3 Versatile Model
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Score dials & Timeline
          </span>
        </div>
      </div>

      {/* Right: Upload Box */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
            dragging
              ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
              : "border-white/10 hover:border-violet-500/50 hover:bg-white/[0.03]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-3xl">
            📄
          </div>
          
          <div className="text-center">
            <p className="font-bold text-white mb-1">Drag & drop your PDF resume</p>
            <p className="text-xs text-slate-400">or click to browse local files</p>
          </div>
          
          <span className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs py-2 px-5 rounded-lg transition-colors shadow-md cursor-pointer">
            Select File
          </span>
          
          <p className="text-[10px] text-slate-500">Supported: PDF up to 5MB</p>
        </div>

        {fileName && (
          <div className="bg-slate-800/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-lg">📄</span>
              <span className="text-xs font-semibold text-slate-200 truncate">{fileName}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}