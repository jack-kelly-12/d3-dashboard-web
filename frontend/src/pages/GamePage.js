import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft } from "lucide-react";
import WinExpectancyChart from "../components/game/WinExpectancyChart";
import GameLog from "../components/game/GameLog";
import { fetchAPI } from "../config/api";

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Back Button Skeleton */}
      <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6" />

      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="w-64 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="w-full h-80 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Game Log Skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-16 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GamePage = () => {
  const { year, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/games/${year}/${gameId}`);
        setGameData(data);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, year]);

  const handleBack = () => {
    if (gameData) {
      const date = new Date(gameData.game_date);
      const formattedDate = date.toISOString().split("T")[0];
      navigate(`/scoreboard?date=${formattedDate}`);
    } else {
      navigate("/scoreboard");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-100 rounded-lg p-6 shadow-sm">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Game
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!gameData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Scoreboard</span>
        </button>

        {/* Game Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {gameData.away_team} @ {gameData.home_team}
            </h1>
            <div className="flex items-center text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span className="text-sm whitespace-nowrap">
                  {new Date(gameData.game_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Win Probability
            </h2>
            <WinExpectancyChart
              homeTeam={gameData.home_team}
              awayTeam={gameData.away_team}
              plays={gameData.plays || []}
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Game Log
            </h2>
            <div className="overflow-hidden">
              <GameLog
                plays={gameData.plays || []}
                homeTeam={gameData.home_team}
                awayTeam={gameData.away_team}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
