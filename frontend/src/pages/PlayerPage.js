import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { fetchAPI } from "../config/api";
import { PercentileSection } from "../components/player/PercentileRankings";
import StatTable from "../components/player/StatTable";
import PlayerHeader from "../components/player/PlayerHeader";
import TeamLogo from "../components/data/TeamLogo";
import SprayChart from "../components/scouting/SprayChart";

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
  </div>
);

const ErrorState = memo(({ error }) => (
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
));

const MemoizedStatTable = memo(StatTable);

const TabNavigation = memo(
  ({
    activeTab,
    onTabChange,
    hasBattingStats,
    hasPitchingStats,
    hasBaserunningStats,
    hasBattedBallStats,
  }) => (
    <div className="border-b border-gray-100">
      <div className="px-6 py-4 flex gap-4">
        {hasBattingStats && (
          <button
            onClick={() => onTabChange("batting")}
            className={`px-4 py-2 font-medium rounded-lg transition-colors
            ${
              activeTab === "batting"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Batting
          </button>
        )}
        {hasPitchingStats && (
          <button
            onClick={() => onTabChange("pitching")}
            className={`px-4 py-2 font-medium rounded-lg transition-colors
            ${
              activeTab === "pitching"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Pitching
          </button>
        )}
        {hasBaserunningStats && (
          <button
            onClick={() => onTabChange("baserunning")}
            className={`px-4 py-2 font-medium rounded-lg transition-colors
            ${
              activeTab === "baserunning"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Baserunning
          </button>
        )}
        {hasBattedBallStats && (
          <button
            onClick={() => onTabChange("batted_ball")}
            className={`px-4 py-2 font-medium rounded-lg transition-colors
            ${
              activeTab === "batted_ball"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Batted Ball
          </button>
        )}
      </div>
    </div>
  )
);

const PlayerContent = memo(
  ({
    activeTab,
    playerData,
    baserunningStats,
    battedBallStats,
    selectedDivision,
    playerId,
  }) => {
    const getMostRecentYear = () => {
      if (activeTab === "batting" && playerData.battingStats?.length > 0) {
        return playerData.battingStats[0]?.Season || new Date().getFullYear();
      } else if (activeTab === "baserunning" && baserunningStats?.length > 0) {
        return baserunningStats[0]?.Year || new Date().getFullYear();
      } else if (activeTab === "batted_ball" && battedBallStats?.length > 0) {
        return battedBallStats[0]?.Year || new Date().getFullYear();
      }
      return new Date().getFullYear();
    };

    const shouldShowSprayChart =
      activeTab === "batting" &&
      (playerData.battingStats?.length > 0 ||
        baserunningStats?.length > 0 ||
        battedBallStats?.length > 0);

    return (
      <div className="p-6">
        {activeTab === "batting" && playerData.battingStats?.length > 0 && (
          <MemoizedStatTable stats={playerData.battingStats} type="batting" />
        )}
        {activeTab === "pitching" && playerData.pitchingStats?.length > 0 && (
          <MemoizedStatTable stats={playerData.pitchingStats} type="pitching" />
        )}
        {activeTab === "baserunning" && baserunningStats?.length > 0 && (
          <MemoizedStatTable stats={baserunningStats} type="baserunning" />
        )}
        {activeTab === "batted_ball" && battedBallStats?.length > 0 && (
          <MemoizedStatTable stats={battedBallStats} type="batted_ball" />
        )}

        {/* Spray Chart Section */}
        {shouldShowSprayChart && (
          <div className="mt-8">
            <SprayChart
              playerId={playerId}
              year={getMostRecentYear()}
              division={selectedDivision}
              height={600}
              width={700}
            />
          </div>
        )}
      </div>
    );
  }
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
  const [baserunningStats, setBaserunningStats] = useState([]);
  const [battedBallStats, setBattedBallStats] = useState([]);
  const [tabsInitialized, setTabsInitialized] = useState(false);

  const fetchPercentiles = useCallback(
    async (year, division = selectedDivision, type = null) => {
      try {
        const percentileResponse = await fetchAPI(
          `/api/player-percentiles/${decodeURIComponent(
            playerId
          )}/${year}/${division}`
        );

        const effectiveType =
          type === "baserunning" || type === "batted_ball" || type === "batting"
            ? "batting"
            : type;

        if (effectiveType === "batting") {
          setBattingPercentiles({
            batting: percentileResponse.batting,
            pitching: null,
          });
        } else if (effectiveType === "pitching") {
          setPitchingPercentiles({
            batting: null,
            pitching: percentileResponse.pitching,
          });
        } else {
          if (percentileResponse.batting) {
            setBattingPercentiles(percentileResponse);
          }
          if (percentileResponse.pitching) {
            setPitchingPercentiles(percentileResponse);
          }
        }
      } catch (err) {
        console.error("Error fetching percentiles:", err);
      }
    },
    [playerId, selectedDivision]
  );

  const fetchBaserunningStats = useCallback(async () => {
    try {
      const response = await fetchAPI(
        `/api/leaderboards/baserunning?start_year=2021&end_year=2025&division=${selectedDivision}`
      );

      const playerBaserunningStats = response
        .filter((stat) => stat.player_id === decodeURIComponent(playerId))
        .map((stat) => ({
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
        }));

      playerBaserunningStats.sort((a, b) => b.Year - a.Year);

      setBaserunningStats(playerBaserunningStats);
    } catch (err) {
      console.error("Error fetching baserunning stats:", err);
    }
  }, [playerId, selectedDivision]);

  const fetchBattedBallStats = useCallback(async () => {
    try {
      const response = await fetchAPI(
        `/api/leaderboards/batted_ball?start_year=2021&end_year=2025&division=${selectedDivision}`
      );

      const playerBattedBallStats = response
        .filter((stat) => stat.player_id === decodeURIComponent(playerId))
        .map((stat) => ({
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
        }));

      playerBattedBallStats.sort((a, b) => b.Year - a.Year);
      setBattedBallStats(playerBattedBallStats);
    } catch (err) {
      console.error("Error fetching batted ball stats:", err);
    }
  }, [playerId, selectedDivision]);

  const enhancePlayerData = useCallback((playerResponse) => {
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
  }, []);

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

        let division = 3;

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

        const fetchPromises = [];

        if (maxBattingSeason > 0) {
          fetchPromises.push(
            fetchPercentiles(maxBattingSeason, division, "batting")
          );
        }

        if (maxPitchingSeason > 0) {
          fetchPromises.push(
            fetchPercentiles(maxPitchingSeason, division, "pitching")
          );
        }

        fetchPromises.push(fetchBaserunningStats());
        fetchPromises.push(fetchBattedBallStats());

        await Promise.all(fetchPromises);

        if (
          !enhancedPlayerData.battingStats?.length &&
          enhancedPlayerData.pitchingStats?.length
        ) {
          setActiveTab("pitching");
        }

        setTabsInitialized(true);
      } catch (err) {
        setError(err.message || "Failed to load player data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    playerId,
    fetchPercentiles,
    fetchBaserunningStats,
    fetchBattedBallStats,
    enhancePlayerData,
  ]);

  useEffect(() => {
    if (tabsInitialized) {
      fetchBaserunningStats();
      fetchBattedBallStats();
    }
  }, [
    selectedDivision,
    fetchBaserunningStats,
    fetchBattedBallStats,
    tabsInitialized,
  ]);

  const getAvailableYears = useCallback(
    (type = null) => {
      if (!playerData) return [];

      const years = new Set();

      if (type === "baserunning") {
        if (baserunningStats?.length) {
          baserunningStats.forEach((stat) => years.add(stat.Year));
        }
      } else if (type === "batted_ball") {
        if (battedBallStats?.length) {
          battedBallStats.forEach((stat) => years.add(stat.Year));
        }
      } else if (type === "batting" || type === null) {
        if (playerData?.battingStats) {
          playerData.battingStats.forEach((stat) => years.add(stat.Season));
        }
      } else if (type === "pitching" || type === null) {
        if (playerData?.pitchingStats) {
          playerData.pitchingStats.forEach((stat) => years.add(stat.Season));
        }
      }

      return Array.from(years).sort((a, b) => b - a);
    },
    [playerData, baserunningStats, battedBallStats]
  );

  const getAvailableDivisions = useCallback(() => {
    if (!playerData) return [];

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
    if (baserunningStats?.length) {
      baserunningStats.forEach((stat) => {
        if (stat.Division) divisions.add(stat.Division);
      });
    }
    if (battedBallStats?.length) {
      battedBallStats.forEach((stat) => {
        if (stat.Division) divisions.add(stat.Division);
      });
    }

    return Array.from(divisions).sort((a, b) => a - b);
  }, [playerData, baserunningStats, battedBallStats]);

  const handleDivisionChange = useCallback(
    (division) => {
      setSelectedDivision(division);

      if (battingPercentiles?.batting) {
        const battingYear = battingPercentiles.batting.season;
        if (battingYear) {
          const type =
            activeTab === "baserunning" ||
            activeTab === "batted_ball" ||
            activeTab === "batting"
              ? "batting"
              : "pitching";
          fetchPercentiles(battingYear, division, type);
        }
      }

      if (pitchingPercentiles?.pitching) {
        const pitchingYear = pitchingPercentiles.pitching.season;
        if (pitchingYear) {
          fetchPercentiles(pitchingYear, division, "pitching");
        }
      }
    },
    [activeTab, battingPercentiles, pitchingPercentiles, fetchPercentiles]
  );

  const handleYearChange = useCallback(
    async (year, type) => {
      const effectiveType =
        type === "baserunning" || type === "batted_ball" || type === "batting"
          ? "batting"
          : "pitching";
      await fetchPercentiles(year, selectedDivision, effectiveType);
    },
    [fetchPercentiles, selectedDivision]
  );

  const getCurrentPercentiles = useCallback(() => {
    if (
      activeTab === "batting" ||
      activeTab === "baserunning" ||
      activeTab === "batted_ball"
    ) {
      return battingPercentiles;
    } else if (activeTab === "pitching") {
      return pitchingPercentiles;
    }
    return null;
  }, [activeTab, battingPercentiles, pitchingPercentiles]);

  const handleTabChange = useCallback(
    (newTab) => {
      if (newTab === activeTab) return;

      setActiveTab(newTab);

      if (
        (newTab === "baserunning" || newTab === "batted_ball") &&
        playerData?.battingStats?.length > 0 &&
        (!battingPercentiles || !battingPercentiles.batting)
      ) {
        const maxBattingSeason = Math.max(
          ...playerData.battingStats.map((stat) => stat.Season)
        );
        fetchPercentiles(maxBattingSeason, selectedDivision, "batting");
      }
    },
    [
      activeTab,
      playerData,
      battingPercentiles,
      selectedDivision,
      fetchPercentiles,
    ]
  );

  const enhancedPlayerDataForPercentile = useMemo(() => {
    if (!playerData) return null;

    return {
      ...playerData,
      yearsPlayed: getAvailableYears(activeTab),
      divisionsPlayed: getAvailableDivisions(),
    };
  }, [playerData, getAvailableYears, getAvailableDivisions, activeTab]);

  const tabState = useMemo(
    () => ({
      hasBattingStats: playerData?.battingStats?.length > 0,
      hasPitchingStats: playerData?.pitchingStats?.length > 0,
      hasBaserunningStats: baserunningStats?.length > 0,
      hasBattedBallStats: battedBallStats?.length > 0,
    }),
    [playerData, baserunningStats, battedBallStats]
  );

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
                playerData={enhancedPlayerDataForPercentile}
                initialPercentiles={getCurrentPercentiles()}
                activeTab={
                  activeTab === "baserunning" || activeTab === "batted_ball"
                    ? "batting"
                    : activeTab
                }
                onYearChange={(year) => handleYearChange(year, activeTab)}
                selectedDivision={selectedDivision}
                onDivisionChange={handleDivisionChange}
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-lg shadow-sm">
            {/* Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hasBattingStats={tabState.hasBattingStats}
              hasPitchingStats={tabState.hasPitchingStats}
              hasBaserunningStats={tabState.hasBaserunningStats}
              hasBattedBallStats={tabState.hasBattedBallStats}
            />

            {/* Stats Table */}
            <PlayerContent
              activeTab={activeTab}
              playerData={playerData}
              baserunningStats={baserunningStats}
              battedBallStats={battedBallStats}
              selectedDivision={selectedDivision}
              playerId={playerId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
