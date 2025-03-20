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
  const [battingPercentiles, setBattingPercentiles] = useState(null);
  const [pitchingPercentiles, setPitchingPercentiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [selectedDivision, setSelectedDivision] = useState(3);

  const fetchPercentiles = useCallback(
    async (year, division = selectedDivision, type = null) => {
      try {
        const percentileResponse = await fetchAPI(
          `/api/player-percentiles/${decodeURIComponent(
            playerId
          )}/${year}/${division}`
        );

        // If we're requesting a specific type, only update that type
        if (type === "batting") {
          setBattingPercentiles({
            batting: percentileResponse.batting,
            pitching: null,
          });
        } else if (type === "pitching") {
          setPitchingPercentiles({
            batting: null,
            pitching: percentileResponse.pitching,
          });
        } else {
          // Update both if available
          if (percentileResponse.batting) {
            setBattingPercentiles(percentileResponse);
          }
          if (percentileResponse.pitching) {
            setPitchingPercentiles(percentileResponse);
          }
        }

        // Set initial active tab if we don't have batting data
        if (
          !percentileResponse.batting &&
          percentileResponse.pitching &&
          activeTab === "batting"
        ) {
          setActiveTab("pitching");
        }
      } catch (err) {
        console.error("Error fetching percentiles:", err);
      }
    },
    [playerId, selectedDivision, activeTab]
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

        // Get the most recent seasons for both batting and pitching
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

        // Get division from the most recent stats
        let division = 3; // Default

        // Find the most recent division for either batting or pitching
        if (maxBattingSeason > 0 || maxPitchingSeason > 0) {
          const mostRecentBattingStat = enhancedPlayerData.battingStats?.find(
            (stat) => stat.Season === maxBattingSeason
          );
          const mostRecentPitchingStat = enhancedPlayerData.pitchingStats?.find(
            (stat) => stat.Season === maxPitchingSeason
          );

          if (mostRecentBattingStat && mostRecentBattingStat.Division) {
            division = mostRecentBattingStat.Division;
          } else if (
            mostRecentPitchingStat &&
            mostRecentPitchingStat.Division
          ) {
            division = mostRecentPitchingStat.Division;
          }

          setSelectedDivision(division);
        }

        // Fetch percentiles for both batting and pitching if available
        if (maxBattingSeason > 0) {
          await fetchPercentiles(maxBattingSeason, division, "batting");
        }

        if (maxPitchingSeason > 0) {
          await fetchPercentiles(maxPitchingSeason, division, "pitching");
        }

        // Set default tab based on available stats
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

  const getAvailableYears = (type = null) => {
    const years = new Set();

    if (type === "batting" || type === null) {
      if (playerData?.battingStats) {
        playerData.battingStats.forEach((stat) => years.add(stat.Season));
      }
    }

    if (type === "pitching" || type === null) {
      if (playerData?.pitchingStats) {
        playerData.pitchingStats.forEach((stat) => years.add(stat.Season));
      }
    }

    return Array.from(years).sort((a, b) => b - a);
  };

  const getAvailableDivisions = () => {
    const divisions = new Set();

    if (playerData?.battingStats) {
      playerData.battingStats.forEach((stat) => {
        if (stat.Division) divisions.add(stat.Division);
      });
    }
    if (playerData?.pitchingStats) {
      playerData.pitchingStats.forEach((stat) => {
        if (stat.Division) divisions.add(stat.Division);
      });
    }

    return Array.from(divisions).sort((a, b) => a - b);
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

  const handleDivisionChange = (division) => {
    setSelectedDivision(division);

    // Refresh both batting and pitching percentiles if available
    if (battingPercentiles?.batting) {
      // Get the most recent batting year
      const battingYear = battingPercentiles.batting.season;
      if (battingYear) {
        fetchPercentiles(battingYear, division, "batting");
      }
    }

    if (pitchingPercentiles?.pitching) {
      // Get the most recent pitching year
      const pitchingYear = pitchingPercentiles.pitching.season;
      if (pitchingYear) {
        fetchPercentiles(pitchingYear, division, "pitching");
      }
    }
  };

  const handleYearChange = async (year, type) => {
    await fetchPercentiles(year, selectedDivision, type);
  };

  const getCurrentPercentiles = () => {
    if (activeTab === "batting") {
      return battingPercentiles;
    } else {
      return pitchingPercentiles;
    }
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
                  yearsPlayed: getAvailableYears(activeTab),
                  divisionsPlayed: getAvailableDivisions(),
                }}
                initialPercentiles={getCurrentPercentiles()}
                activeTab={activeTab}
                onYearChange={(year) => handleYearChange(year, activeTab)}
                selectedDivision={selectedDivision}
                onDivisionChange={handleDivisionChange}
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
