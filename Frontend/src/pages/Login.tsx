import React, { useState } from "react";

interface LoginProps {
  onAuthSuccess: (user: any, token: string) => void;
  onBack: () => void;
  redirectWarning?: string | null;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Login({ onAuthSuccess, onBack, redirectWarning }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UX states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setErrorMsg("You must agree to the Terms & Conditions.");
        return;
      }
    }

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
    <div className="w-full max-w-md mx-auto py-4 px-4 animate-fade-in text-slate-800">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold flex items-center gap-1.5 mb-6 cursor-pointer border-none bg-transparent"
      >
        <span>←</span> Back to home
      </button>

      {/* Modern Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Warning notification banner if guest got redirected */}
        {redirectWarning && (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs px-4 py-3 rounded-xl mb-6 text-center leading-relaxed font-semibold">
            🔔 {redirectWarning}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSignUp ? "Create Account 🚀" : "Welcome Back 👋"}
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            {isSignUp 
              ? "Start your AI Interview journey" 
              : "Login to continue your journey"}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl mb-5 text-center font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-xs">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-[10px] text-indigo-600 hover:underline border-none bg-transparent cursor-pointer font-bold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-500 font-semibold cursor-pointer select-none">
                  I agree to the <span className="text-indigo-650 hover:underline">Terms & Conditions</span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs hover:scale-[1.01] cursor-pointer mt-2 disabled:bg-slate-400"
          >
            {loading ? "Authenticating..." : isSignUp ? "Register" : "Login"}
          </button>
        </form>

        {/* Social Continue Divider */}
        <div className="my-6 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div className="w-[30%] h-[1px] bg-slate-100" />
          <span>Or continue with</span>
          <div className="w-[30%] h-[1px] bg-slate-100" />
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <span className="text-sm">🌐</span> Google
          </button>
          <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <span className="text-sm">🐙</span> GitHub
          </button>
        </div>

        {/* Toggle link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsSignUp(!isSignUp);
              }}
              className="text-indigo-600 hover:text-indigo-500 font-bold underline transition-colors cursor-pointer bg-transparent border-none"
            >
              {isSignUp ? "Login here" : "Register here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
