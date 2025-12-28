import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import RecruitPasswordManager from "../../managers/RecruitPasswordManager";
import AuthManager from "../../managers/AuthManager";
import toast from "react-hot-toast";

const PasswordModal = ({ isOpen, onSuccess, isSetup = false }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSetup) {
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        await RecruitPasswordManager.setPassword(password);
        const userId = AuthManager.getCurrentUser()?.uid;
        if (userId) {
          sessionStorage.setItem(`recruitAccess_${userId}`, "true");
        }
        toast.success("Password set successfully");
        setPassword("");
        setConfirmPassword("");
        onSuccess();
      } else {
        if (!password) {
          setError("Please enter a password");
          setLoading(false);
          return;
        }

        const result = await RecruitPasswordManager.verifyPassword(password);
        
        if (result.verified) {
          const userId = AuthManager.getCurrentUser()?.uid;
          if (userId) {
            sessionStorage.setItem(`recruitAccess_${userId}`, "true");
          }
          setPassword("");
          onSuccess();
        } else if (result.needsSetup) {
          setError("No password set. Please set up a password first.");
          setLoading(false);
          return;
        } else {
          setError("Incorrect password");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Password error:", err);
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isSetup ? "Set Recruiting Password" : "Enter Password"}
              </h2>
              <p className="text-sm text-blue-100 mt-0.5">
                {isSetup 
                  ? "Create a password to protect your recruiting data"
                  : "This page is password protected"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={isSetup ? "Enter password (min 6 characters)" : "Enter password"}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (isSetup && !confirmPassword)}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : isSetup ? "Set Password" : "Unlock"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PasswordModal;

