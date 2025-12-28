import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Database,
  Binoculars,
  ChevronRight,
  Trophy,
  Activity,
  Radio,
  MessageCircle,
} from "lucide-react";
import RecentChanges from "../components/home/RecentChanges";
import PlansAndFeatures from "../components/home/PlansAndFeatures";
import TrendingPlayers from "../components/home/TrendingPlayers";
import FeedbackModal from "../components/modals/FeedbackModal";

const HomePage = () => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[10%] w-[400px] h-[400px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-[20%] left-[20%] w-[200px] h-[200px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <div className="container max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <div className="relative z-10 mb-20 sm:mb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="text-gray-900">D3</span>{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-4">
                The tools college baseball teams actually use. Stats, charting, scouting, and player development.
              </p>

              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-3 text-sm sm:text-base pt-4">
                <span className="text-gray-700">Trusted by dozens of schools/facilities</span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-400"></span>
                <span className="text-gray-700"><strong className="font-semibold">D1-D3</strong> coverage</span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-400"></span>
                <span className="text-gray-700"><strong className="font-semibold">5+</strong> years data</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link
                  to="/data"
                  className="inline-flex items-center justify-center px-8 py-3.5 sm:py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-base shadow-lg hover:shadow-xl"
                >
                  Browse Stats
                </Link>
                <Link
                  to="/charting"
                  className="inline-flex items-center justify-center px-8 py-3.5 sm:py-4 bg-white text-blue-600 rounded-xl font-semibold border-2 border-blue-200 hover:bg-blue-50 transition-colors text-base shadow-lg hover:shadow-xl"
                >
                  Try Charting
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-24">
          <FeatureCard
            icon={<LineChart className="w-8 h-8" />}
            title="Game Charting"
            description="Chart pitches and hits during games or bullpen sessions. Upload data from Rapsodo, or Trackman."
            linkTo="/charting"
            gradient="from-blue-500 to-cyan-500"
            bgGradient="from-blue-50 to-cyan-50"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8" />}
            title="Stats & Data"
            description="Browse player stats, percentiles, spray charts, and team data across D1-D3 from 2021+."
            linkTo="/data"
            gradient="from-indigo-500 to-purple-500"
            bgGradient="from-indigo-50 to-purple-50"
          />
          <FeatureCard
            icon={<Binoculars className="w-8 h-8" />}
            title="Scouting Reports"
            description="Build team-based reports with player stats, notes, and writeups. Export to PDF."
            linkTo="/scouting"
            gradient="from-purple-500 to-pink-500"
            bgGradient="from-purple-50 to-pink-50"
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Leaderboards"
            description="Value, situational, baserunning, splits, batted ball, and hot/cold/trending views."
            linkTo="/leaderboards"
            gradient="from-yellow-500 to-orange-500"
            bgGradient="from-yellow-50 to-orange-50"
          />
          <FeatureCard
            icon={<Radio className="w-8 h-8" />}
            title="Game Pages"
            description="Win expectancy, leverage, and run expectancy charts with game-level data."
            linkTo="/scoreboard"
            gradient="from-green-500 to-emerald-500"
            bgGradient="from-green-50 to-emerald-50"
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="Player Lists"
            description="Create and manage custom lists of players you&apos;re tracking."
            linkTo="/player-lists"
            gradient="from-red-500 to-rose-500"
            bgGradient="from-red-50 to-rose-50"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-24 relative z-10">
          <div className="lg:col-span-1">
            <div className="h-[320px] sm:h-[340px]">
              <TrendingPlayers compact limit={6} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="h-[320px] sm:h-[340px]">
              <RecentChanges />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="h-[320px] sm:h-[340px]">
              <PlansAndFeatures />
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mb-8 sm:mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 w-full max-w-6xl text-center">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Questions, bug reports, or feedback? Contact me at{" "}
              <a href="mailto:jackkelly12902@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium underline-offset-2 hover:underline">
                jackkelly12902@gmail.com
              </a>{" "}
              or{" "}
              <a href="https://twitter.com/jkelly_1214" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline-offset-2 hover:underline">
                @jkelly_1214
              </a>
            </p>
          </div>
        </div>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
};

const FeatureCard = ({ icon, title, description, linkTo, gradient, bgGradient }) => {
  return (
    <Link
      to={linkTo}
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2.5 sm:mb-3 group-hover:text-slate-800">{title}</h3>
        <p className="text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center text-xs sm:text-sm font-medium text-blue-600 group-hover:text-indigo-600 transition-colors">
          Explore Features
          <ChevronRight className="ml-2 w-3 h-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
    </Link>
  );
};

export default HomePage;
