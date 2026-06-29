import React, { useState } from "react";

interface LoginProps {
  onAuthSuccess: (user: any, token: string) => void;
  onBack: () => void;
  redirectWarning?: string | null;
}

const BACKEND_URL = "http://localhost:5000";

export default function Login({ onAuthSuccess, onBack, redirectWarning }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const url = isSignUp ? `${BACKEND_URL}/auth/register` : `${BACKEND_URL}/auth/login`;
    const payload = isSignUp 
      ? { name, email, password } 
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || "Authentication failed. Please verify credentials.");
      }

      const { user, accessToken } = resJson.data;
      onAuthSuccess(user, accessToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full py-8 px-4 animate-fade-in">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-slate-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 mb-6 cursor-pointer"
      >
        <span>←</span> Go Back
      </button>

      {/* Glassmorphism Card */}
      <div className="bg-glass rounded-2xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
        {/* Glow background circles */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />

        {/* Warning notification banner if guest got redirected */}
        {redirectWarning && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-4 py-3 rounded-xl mb-6 text-center leading-relaxed">
            🔔 {redirectWarning}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight">
            {isSignUp ? "Create your Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5">
            {isSignUp 
              ? "Sign up to persist resumes, analysis reports, and interview histories" 
              : "Sign in to access advanced mock interviews and histories"}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-xl mb-5 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-violet-600/30 text-xs hover:scale-[1.01] cursor-pointer mt-2 disabled:bg-slate-800 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-slate-500">
            {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsSignUp(!isSignUp);
              }}
              className="text-violet-400 hover:text-violet-300 font-bold underline transition-colors cursor-pointer bg-transparent border-none"
            >
              {isSignUp ? "Sign In instead" : "Create Account now"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
