import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Database, Binoculars } from "lucide-react";
import PlayerSearch from "../components/home/PlayerSearch";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Hero Section - Responsive padding */}
      <div className="pt-8 md:pt-12 pb-6 md:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl md:text-5xl font-bold text-transparent">
              D3 Dashboard
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-600 px-4">
              Empowering Division III baseball teams with advanced analytics,
              scouting tools, and performance insights
            </p>
          </div>
        </div>
      </div>

      {/* Search Component - Responsive padding */}
      <div className="px-4 sm:px-6 lg:px-8 mb-0">
        <PlayerSearch />
      </div>

      {/* Features Grid - Responsive grid and spacing */}
      <div className="flex-grow flex items-center px-4 sm:px-6 lg:px-10 py-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Advanced Charting"
              description="Track pitches, analyze tendencies, and export detailed pitch level data for game analysis"
              linkTo="/charting"
              color="blue"
            />
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="Statistical Analysis"
              description="Access comprehensive Division III baseball statistics and metrics to make data-driven decisions"
              linkTo="/data"
              color="indigo"
            />
            <FeatureCard
              icon={<Binoculars className="w-6 h-6" />}
              title="Scouting Reports"
              description="Create detailed player reports with up-to-date statistics and track development over time"
              linkTo="/scouting"
              color="violet"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, linkTo, color }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
  };

  return (
    <Link
      to={linkTo}
      className="group rounded-xl bg-white p-4 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
    >
      <div
        className={`inline-flex rounded-lg ${colorClasses[color]} p-3 text-white shadow-sm self-start`}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </Link>
  );
};

export default HomePage;
