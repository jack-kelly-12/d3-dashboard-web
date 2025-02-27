import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Database, Binoculars, ChevronRight } from "lucide-react";
import PlayerSearch from "../components/home/PlayerSearch";

const HomePage = () => {
  return (
    <div className="h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col overflow-hidden">
      {/* Left Navigation Panel Placeholder */}
      <div className="fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-100 hidden sm:flex flex-col items-center py-6 z-20">
        <div className="w-10 h-10 bg-blue-600 text-white font-bold rounded-md flex items-center justify-center mb-10">
          D3
        </div>
        <div className="flex flex-col items-center gap-6 mt-4">
          <Link to="/" className="text-blue-600 p-2 bg-blue-50 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          <Link to="/data" className="text-gray-400 p-2 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </Link>
          <Link
            to="/charting"
            className="text-gray-400 p-2 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </Link>
          <Link
            to="/scouting"
            className="text-gray-400 p-2 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 9l-7 4-7-4" />
              <path d="M3 15l7 4 7-4" />
              <path d="M21 9a6 6 0 0 0-12 0" />
              <path d="M3 9a6 6 0 0 1 12 0" />
            </svg>
          </Link>
          <Link to="/stats" className="text-gray-400 p-2 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </Link>
          <Link
            to="/leaderboards"
            className="text-gray-400 p-2 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 21v-4a2 2 0 0 1 4 0v4" />
              <path d="M7 4h9a2 2 0 0 1 2 2v14" />
              <path d="M13 14h4" />
              <rect x="10" y="4" width="8" height="6" />
              <rect x="2" y="12" width="8" height="6" />
            </svg>
          </Link>
          <Link
            to="/calendar"
            className="text-gray-400 p-2 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="sm:ml-20 flex-1 relative">
        {/* Background Bubbles - Adjusted to prevent cutoff */}
        <div className="absolute inset-0 overflow-visible">
          {/* Light blue bubble in bottom left */}
          <div className="absolute top-[25%] right-[-15%] w-[800px] h-[800px] bg-blue-100 rounded-full opacity-30"></div>
          {/* Light purple bubble positioned better */}
          <div className="absolute top-[60%] left-[-20%] w-[700px] h-[700px] bg-indigo-100 rounded-full opacity-20"></div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col">
          {/* Header Badge */}

          {/* Title and Description */}
          <div className="text-center mt-8 mb-8">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-bold text-transparent drop-shadow-sm">
              D3 Dashboard
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Empowering Division III baseball teams with advanced analytics,
              scouting tools, and performance insights
            </p>
          </div>

          {/* Search Component */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg justify-center ">
                  <PlayerSearch />
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="flex-grow flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FeatureCard
                icon={<LineChart className="w-5 h-5" />}
                title="Advanced Charting"
                description="Track pitches, analyze tendencies, and export detailed game data"
                linkTo="/charting"
                color="blue"
                iconBg="bg-blue-100"
              />
              <FeatureCard
                icon={<Database className="w-5 h-5" />}
                title="Statistical Analysis"
                description="Access comprehensive DIII baseball statistics and metrics"
                linkTo="/data"
                color="indigo"
                iconBg="bg-indigo-100"
              />
              <FeatureCard
                icon={<Binoculars className="w-5 h-5" />}
                title="Scouting Reports"
                description="Create detailed player reports with up-to-date statistics"
                linkTo="/scouting"
                color="violet"
                iconBg="bg-purple-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, linkTo, color, iconBg }) => {
  const colorClasses = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    violet: "text-violet-600",
  };

  return (
    <Link
      to={linkTo}
      className="group bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full relative"
    >
      <div
        className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-4`}
      >
        <div className={`${colorClasses[color]}`}>{icon}</div>
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="mt-auto flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
        Explore
        <ChevronRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

export default HomePage;
