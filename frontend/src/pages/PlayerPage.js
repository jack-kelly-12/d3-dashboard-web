import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchAPI } from "../config/api";
import { PercentileSection } from "../components/player/PercentileRankings";
import StatTable from "../components/player/StatTable";
import PlayerHeader from "../components/player/PlayerHeader";
import TeamLogo from "../components/data/TeamLogo";

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
        const playerResponse = await fetchAPI(
          `/api/player/${decodeURIComponent(playerId)}`
        );
        const enhancedPlayerData = enhancePlayerData(playerResponse);
        setPlayerData(enhancedPlayerData);

        await fetchAndSetPercentiles(enhancedPlayerData);

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

    const fetchAndSetPercentiles = async (playerData) => {
      const has2024Stats =
        playerData.battingStats?.some((stat) => stat.Season === 2024) ||
        playerData.pitchingStats?.some((stat) => stat.Season === 2024);

      setIsActive(has2024Stats);

      if (has2024Stats) {
        const percentileResponse = await fetchAPI(
          `/api/player-percentiles/${decodeURIComponent(playerId)}`
        );

        if (percentileResponse.inactive) {
          setIsActive(false);
          setPercentiles(null);
        } else {
          setPercentiles(percentileResponse);
          if (!percentileResponse.batting && percentileResponse.pitching) {
            setActiveTab("pitching");
          }
        }
      } else {
        setPercentiles(null);
      }
    };

    fetchData();
  }, [playerId]);

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
