import { useState } from "react";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
}

interface SettingsProps {
  token: string | null;
  user: UserProfile | null;
  onUpdateUser: (updatedUser: any) => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Settings({ token, user, onUpdateUser }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, bio }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setProfileMessage({ text: "Profile updated successfully!", type: "success" });
        onUpdateUser(json.data.user);
      } else {
        setProfileMessage({ text: json.message || "Failed to update profile.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setProfileMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", type: "error" });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordMessage({ text: "Password updated successfully!", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ text: json.message || "Failed to change password.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in text-slate-800">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Account Settings</h2>
        <p className="text-slate-500 text-xs mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        {/* Left Tabs Menu */}
        <div className="md:col-span-1 flex flex-col gap-1 bg-white border border-slate-200 p-3 rounded-2xl h-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            👤 Profile Info
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "password"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            🔑 Change Password
          </button>
        </div>

        {/* Right Active Panel */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {activeTab === "profile" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-2 card-white">
                <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Profile Details</h3>
                
                {profileMessage && (
                  <div className={`p-3 rounded-xl text-xs mb-4 text-center border ${
                    profileMessage.type === "success" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}>
                    {profileMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Akash Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Email address cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Full Stack Developer passionate about building scalable web applications."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none h-24 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-xs cursor-pointer disabled:bg-slate-400"
                  >
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>

              {/* Avatar Box */}
              <div className="lg:col-span-1 card-white flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-3xl font-black text-indigo-600 shadow-inner">
                  {user?.name ? getInitials(user.name) : "U"}
                </div>
                <h4 className="font-bold text-slate-900">{user?.name || "Guest User"}</h4>
                <p className="text-slate-400 text-[10px] uppercase font-bold mt-0.5 tracking-wider">Active Member</p>
                <div className="w-full border-t border-slate-100 my-4" />
                <button
                  type="button"
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-[10px] transition-colors cursor-pointer"
                >
                  Change Photo
                </button>
                <p className="text-[9px] text-slate-400 mt-2">JPG, PNG up to 2MB</p>
              </div>
            </div>
          ) : (
            <div className="card-white max-w-xl">
              <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Change Password</h3>
              
              {passwordMessage && (
                <div className={`p-3 rounded-xl text-xs mb-4 text-center border ${
                  passwordMessage.type === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                    : "bg-red-50 border-red-100 text-red-700"
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-[50%] -translate-y-[50%] text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none font-bold text-[10px]"
                    >
                      {showCurrentPassword ? "🙈 Hide" : "👁️ Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-[50%] -translate-y-[50%] text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none font-bold text-[10px]"
                    >
                      {showNewPassword ? "🙈 Hide" : "👁️ Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3.5 top-[50%] -translate-y-[50%] text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none font-bold text-[10px]"
                    >
                      {showConfirmNewPassword ? "🙈 Hide" : "👁️ Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-xs cursor-pointer disabled:bg-slate-400"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
