import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import AuthManager from "../managers/AuthManager";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldSignUp = searchParams.get("signup") === "true";
    setIsSignUp(shouldSignUp);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const result = isSignUp
      ? await AuthManager.signUp(email, password)
      : await AuthManager.emailSignIn(email, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    const result = await AuthManager.googleSignIn();
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    const newUrl = isSignUp ? "/signin" : "/signin?signup=true";
    window.history.pushState({}, "", newUrl);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Main Content */}
      <div className="sm:ml-20 flex-1 relative flex items-center justify-center px-4">
        {/* Background Bubbles - Similar to HomePage */}
        <div className="absolute inset-0 overflow-visible">
          <div className="absolute top-[25%] right-[-15%] w-[800px] h-[800px] bg-blue-100 rounded-full opacity-30"></div>
          <div className="absolute top-[60%] left-[-20%] w-[700px] h-[700px] bg-indigo-100 rounded-full opacity-20"></div>
        </div>

        {/* Sign In Form */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Logo/Branding at top */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                D3
              </div>
            </div>

            <div className="mb-8 text-center">
              <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent drop-shadow-sm mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-gray-600 text-sm">
                {isSignUp
                  ? "Sign up to get started with D3 Dashboard"
                  : "Sign in to continue to D3 Dashboard"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              {!isSignUp && (
                <div className="flex justify-end">
                  <Link
                    to="/reset-password"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200 mb-6"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-gray-700 font-medium">
                {isSignUp ? "Sign up with Google" : "Sign in with Google"}
              </span>
            </button>

            <div className="text-center">
              <button
                onClick={toggleSignUp}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
