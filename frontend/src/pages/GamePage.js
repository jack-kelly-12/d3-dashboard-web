import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import WinExpectancyChart from "../components/game/WinExpectancyChart";
import GameLog from "../components/game/GameLog";
import { fetchAPI } from "../config/api";

const GamePage = () => {
  const { year, gameId } = useParams();
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Game Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {gameData.away_team} @ {gameData.home_team}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span className="text-sm">
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
        <div className="space-y-8">
          <WinExpectancyChart
            homeTeam={gameData.home_team}
            awayTeam={gameData.away_team}
            plays={gameData.plays || []}
          />
          <GameLog
            plays={gameData.plays || []}
            homeTeam={gameData.home_team}
            awayTeam={gameData.away_team}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
