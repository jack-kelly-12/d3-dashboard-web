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
    <div className="h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col h-full">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-blue-100 rounded-full opacity-30 blur-xl"></div>
          <div className="absolute bottom-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-100 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-[60%] right-[20%] w-[200px] h-[200px] bg-purple-100 rounded-full opacity-20 blur-lg"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="text-center my-6">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-6xl sm:text-7xl font-bold text-transparent drop-shadow-sm">
              D3 Dashboard
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Empowering Division III baseball teams with advanced analytics and
              performance insights
            </p>
          </div>

          {/* Search Section */}
          <div className="my-6 max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-medium">
                  <Search size={16} />
                  <span>Find Players</span>
                </div>
                <PlayerSearch />
              </div>
            </div>
          </div>

          {/* Feature Cards - taking more space */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Advanced Charting"
              description="Track pitches, analyze tendencies, and export detailed game data"
              linkTo="/charting"
              color="blue"
              iconBg="bg-blue-100"
            />
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="Statistical Analysis"
              description="Access comprehensive DIII baseball statistics and metrics"
              linkTo="/data"
              color="indigo"
              iconBg="bg-indigo-100"
            />
            <FeatureCard
              icon={<Binoculars className="w-6 h-6" />}
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
      className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full relative"
    >
      <div
        className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mb-4`}
      >
        <div className={`${colorClasses[color]}`}>{icon}</div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="mt-auto flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
        Explore
        <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

export default HomePage;
