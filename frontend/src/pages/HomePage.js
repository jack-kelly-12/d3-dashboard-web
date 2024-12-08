import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Database, Binoculars } from "lucide-react";
import PlayerSearch from "../components/home/PlayerSearch";

const HomePage = () => {
  return (
    <div className="h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent">
              D3 Dashboard
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Empowering Division III baseball teams with advanced analytics,
              scouting tools, and performance insights
            </p>
          </div>
        </div>
      </div>

      {/* Search Component with reduced margins */}
      <div className="px-8 mb-0">
        <PlayerSearch />
      </div>

      {/* Features Grid with reduced spacing */}
      <div className="mx-auto max-w-7xl px-10 flex-grow flex items-center">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
      className="group rounded-xl bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div
        className={`inline-flex rounded-lg ${colorClasses[color]} p-3 text-white shadow-sm`}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </Link>
  );
};

export default HomePage;
