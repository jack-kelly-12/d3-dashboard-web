import React from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Database,
  Binoculars,
  ChevronRight,
  Search,
} from "lucide-react";
import PlayerSearch from "../components/home/PlayerSearch";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-blue-100 rounded-full opacity-30 blur-xl"></div>
          <div className="absolute bottom-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-100 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-[60%] right-[20%] w-[200px] h-[200px] bg-purple-100 rounded-full opacity-20 blur-lg"></div>
        </div>

        {/* Content Container - using flex to distribute space better */}
        <div className="relative z-10 flex flex-col h-full min-h-[85vh]">
          {/* Header */}
          <div className="text-center mt-4 mb-6 lg:mt-8 lg:mb-10">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl sm:text-6xl md:text-7xl font-bold text-transparent drop-shadow-sm">
              D3 Dashboard
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Empowering college baseball teams with advanced analytics and
              performance insights
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-6 lg:mb-12 max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-medium">
                  <Search size={16} />
                  <span>Find Players</span>
                </div>
                <PlayerSearch />
              </div>
            </div>
          </div>

          {/* Feature Cards - taking more vertical space on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-auto">
            <FeatureCard
              icon={<LineChart className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Advanced Charting"
              description="Track pitches, analyze tendencies, and export detailed game data"
              linkTo="/charting"
              color="blue"
              iconBg="bg-blue-100"
            />
            <FeatureCard
              icon={<Database className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Statistical Analysis"
              description="Access comprehensive DIII baseball statistics and metrics"
              linkTo="/data"
              color="indigo"
              iconBg="bg-indigo-100"
            />
            <FeatureCard
              icon={<Binoculars className="w-5 h-5 sm:w-6 sm:h-6" />}
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
      className="group bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full relative"
    >
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center mb-3 sm:mb-4`}
      >
        <div className={`${colorClasses[color]}`}>{icon}</div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        {description}
      </p>

      <div className="mt-auto flex items-center text-xs sm:text-sm font-medium text-blue-600 group-hover:text-blue-700">
        Explore
        <ChevronRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

export default HomePage;
