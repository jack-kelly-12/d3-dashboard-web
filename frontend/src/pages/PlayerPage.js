import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { fetchAPI } from "../config/api";
import { PercentileSection } from "../components/player/PercentileRankings";
import StatTable from "../components/player/StatTable";
import PlayerHeader from "../components/player/PlayerHeader";
import TeamLogo from "../components/data/TeamLogo";

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
    <p className="text-gray-600 font-medium">Loading player stats...</p>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
    <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
      <div className="flex items-center gap-3 mb-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold text-red-800">
          Error Loading Player
        </h3>
      </div>
      <p className="text-red-600">{error}</p>
    </div>
  </div>
);

const PlayerPage = () => {
  const { playerId } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [percentiles, setPercentiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");

  const fetchPercentiles = useCallback(
    async (year) => {
      try {
        const percentileResponse = await fetchAPI(
          `/api/player-percentiles/${decodeURIComponent(playerId)}/${year}`
        );

        setPercentiles(percentileResponse);
        if (!percentileResponse.batting && percentileResponse.pitching) {
          setActiveTab("pitching");
        }
      } catch (err) {
        console.error("Error fetching percentiles:", err);
      }
    },
    [playerId, setActiveTab]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const playerResponse = await fetchAPI(
          `/api/player/${decodeURIComponent(playerId)}`
        );
        const enhancedPlayerData = enhancePlayerData(playerResponse);
        setPlayerData(enhancedPlayerData);

        const maxBattingSeason = Math.max(
          ...(enhancedPlayerData.battingStats?.map((stat) => stat.Season) || [
            0,
          ])
        );
        const maxPitchingSeason = Math.max(
          ...(enhancedPlayerData.pitchingStats?.map((stat) => stat.Season) || [
            0,
          ])
        );
        const mostRecentSeason = Math.max(maxBattingSeason, maxPitchingSeason);

        if (mostRecentSeason > 0) {
          await fetchPercentiles(mostRecentSeason);
        }

        if (
          !enhancedPlayerData.battingStats?.length &&
          enhancedPlayerData.pitchingStats?.length
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
  }, [playerId, fetchPercentiles]);

  const getAvailableYears = () => {
    const years = new Set();

    if (playerData?.battingStats) {
      playerData.battingStats.forEach((stat) => years.add(stat.Season));
    }
    if (playerData?.pitchingStats) {
      playerData.pitchingStats.forEach((stat) => years.add(stat.Season));
    }

    return Array.from(years).sort((a, b) => b - a);
  };

  const enhancePlayerData = (playerResponse) => {
    const sortBySeasonDesc = (a, b) => b.Season - a.Season;

    return {
      ...playerResponse,
      renderedTeam: playerResponse.currentTeam ? (
        <div className="w-full flex justify-center items-center">
          <TeamLogo
            teamId={playerResponse.prev_team_id}
            conferenceId={playerResponse.conference_id}
            teamName={playerResponse.currentTeam}
            className="h-8 w-8"
          />
        </div>
      ) : null,
      renderedConference: playerResponse.conference ? (
        <div className="w-full flex justify-center items-center">
          <TeamLogo
            teamId={playerResponse.prev_team_id}
            conferenceId={playerResponse.conference_id}
            teamName={playerResponse.conference}
            showConference={true}
            className="h-8 w-8"
          />
        </div>
      ) : null,
      battingStats: playerResponse.battingStats
        ?.map((stat) => ({
          ...stat,
          renderedTeam: (
            <div className="w-full flex justify-center items-center">
              <TeamLogo
                teamId={stat.prev_team_id}
                conferenceId={stat.conference_id}
                teamName={stat.Team}
                className="h-8 w-8"
              />
            </div>
          ),
          renderedConference: (
            <div className="w-full flex justify-center items-center">
              <TeamLogo
                teamId={stat.prev_team_id}
                conferenceId={stat.conference_id}
                teamName={stat.Conference}
                showConference={true}
                className="h-8 w-8"
              />
            </div>
          ),
        }))
        .sort(sortBySeasonDesc),
      pitchingStats: playerResponse.pitchingStats
        ?.map((stat) => ({
          ...stat,
          renderedTeam: (
            <div className="w-full flex justify-center items-center">
              <TeamLogo
                teamId={stat.prev_team_id}
                conferenceId={stat.conference_id}
                teamName={stat.Team}
                className="h-8 w-8"
              />
            </div>
          ),
          renderedConference: (
            <div className="w-full flex justify-center items-center">
              <TeamLogo
                teamId={stat.prev_team_id}
                conferenceId={stat.conference_id}
                teamName={stat.Conference}
                showConference={true}
                className="h-8 w-8"
              />
            </div>
          ),
        }))
        .sort(sortBySeasonDesc),
    };
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Info */}
            <div className="bg-white rounded-lg shadow-sm">
              <PlayerHeader playerData={playerData} />
            </div>

            {/* Percentile Rankings */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
              <PercentileSection
                playerData={{
                  ...playerData,
                  yearsPlayed: getAvailableYears(),
                }}
                initialPercentiles={percentiles}
                activeTab={activeTab}
                onYearChange={fetchPercentiles}
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-lg shadow-sm">
            {/* Navigation */}
            <div className="border-b border-gray-100">
              <div className="px-6 py-4 flex gap-4">
                {playerData.battingStats?.length > 0 && (
                  <button
                    onClick={() => setActiveTab("batting")}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors
                      ${
                        activeTab === "batting"
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    Batting Stats
                  </button>
                )}
                {playerData.pitchingStats?.length > 0 && (
                  <button
                    onClick={() => setActiveTab("pitching")}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors
                      ${
                        activeTab === "pitching"
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    Pitching Stats
                  </button>
                )}
              </div>
            </div>

            {/* Stats Table */}
            <div className="p-6">
              {activeTab === "batting" &&
                playerData.battingStats?.length > 0 && (
                  <StatTable stats={playerData.battingStats} type="batting" />
                )}
              {activeTab === "pitching" &&
                playerData.pitchingStats?.length > 0 && (
                  <StatTable stats={playerData.pitchingStats} type="pitching" />
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
