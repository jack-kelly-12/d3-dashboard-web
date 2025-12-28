import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export const showAnonymousToast = () => {
  return toast(
    (t) => (
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">
            Using Temporary Account
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your data will only be available in this session.{" "}
            <Link
              to="/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>{" "}
            or{" "}
            <Link
              to="/signin?signup=true"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create an account
            </Link>{" "}
            to save your data permanently.
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: "top-right",
      style: {
        background: "#fff",
        padding: "16px",
        borderRadius: "8px",
        maxWidth: "400px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    }
  );
};

export const useAnonymousToast = () => {
  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("anonymousNotificationShown") || "false"
    );
    if (!user) {
      showAnonymousToast();
      localStorage.setItem("anonymousNotificationShown", "true");
    }
  }, []);
};

export const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
    </div>
  </div>
);

export const ErrorState = ({ message }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
      <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
      <p className="text-red-600">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);
