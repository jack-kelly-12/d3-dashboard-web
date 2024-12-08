import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchAPI } from "../config/api";
import { PercentileSection } from "../components/player/PercentileRankings";
import StatTable from "../components/player/StatTable";
import PlayerHeader from "../components/player/PlayerHeader";

const PlayerPage = () => {
  const { playerId } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [percentiles, setPercentiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // First fetch player data
        const playerResponse = await fetchAPI(
          `/api/player/${decodeURIComponent(playerId)}`
        );
        setPlayerData(playerResponse);

        const has2024Stats =
          playerResponse.battingStats?.some((stat) => stat.Season === 2024) ||
          playerResponse.pitchingStats?.some((stat) => stat.Season === 2024);
        setIsActive(has2024Stats);

        if (has2024Stats) {
          const percentileResponse = await fetchAPI(
            `/api/player-percentiles/${decodeURIComponent(playerId)}`
          );
          setPercentiles(percentileResponse);
        } else {
          setPercentiles(null);
        }

        if (
          !playerResponse.battingStats?.length &&
          playerResponse.pitchingStats?.length
        ) {
          setActiveTab("pitching");
        }
      } catch (err) {
        setError(err.message || "Failed to load player data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PlayerHeader playerData={playerData} isActive={isActive} />

        {!isActive && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              This player is not active in the 2024 season. Showing historical
              stats only.
            </p>
          </div>
        )}

        {isActive && (
          <PercentileSection
            playerData={playerData}
            percentiles={percentiles}
            activeTab={activeTab}
          />
        )}

        {(playerData.battingStats?.length > 0 ||
          playerData.pitchingStats?.length > 0) && (
          <div className="flex gap-2 mb-6">
            {playerData.battingStats?.length > 0 && (
              <button
                onClick={() => setActiveTab("batting")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "batting"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Batting
              </button>
            )}
            {playerData.pitchingStats?.length > 0 && (
              <button
                onClick={() => setActiveTab("pitching")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "pitching"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Pitching
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === "batting" && playerData.battingStats?.length > 0 && (
            <StatTable stats={playerData.battingStats} type="batting" />
          )}
          {activeTab === "pitching" && playerData.pitchingStats?.length > 0 && (
            <StatTable stats={playerData.pitchingStats} type="pitching" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
