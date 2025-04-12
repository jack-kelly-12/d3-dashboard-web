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

const TabButton = memo(({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm sm:text-xs rounded-lg transition-colors ${
      active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
    }`}
  >
    {children}
  </button>
));

const TabNavigation = memo(({ activeTab, onTabChange, availableTabs }) => (
  <div className="border-b border-gray-100">
    <div className="px-6 py-4 flex gap-4 overflow-x-auto">
      {availableTabs.map((tab) => (
        <TabButton
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </TabButton>
      ))}
    </div>
  </div>
));

const renderTeamLogo = (
  teamId,
  conferenceId,
  teamName,
  showConference = false
) => (
  <div className="w-full flex justify-center items-center">
    <TeamLogo
      teamId={teamId}
      conferenceId={conferenceId}
      teamName={teamName}
      showConference={showConference}
      className="h-8 w-8"
    />
  </div>
);

const SimilarBatters = memo(({ playerId, year, division }) => {
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarBatters = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAPI(
          `/api/similar-batters/${encodeURIComponent(
            playerId
          )}?year=${year}&division=${division}`
        );

        setSimilarPlayers(response.similar_players || []);
      } catch (err) {
        console.error("Error fetching similar batters:", err);
        setError("Could not load similar batters");
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId && year && division) {
      fetchSimilarBatters();
    }
  }, [playerId, year, division]);

  if (isLoading) return <div className="text-center py-4"></div>;
  if (error) return null;
  if (!similarPlayers.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-8">
      <div className="flex items-center">
        <span className="mr-1 text-xs">
          Similar Batters to {similarPlayers[0]?.player_name}:
        </span>

        {similarPlayers.slice(0, 5).map((player, idx) => (
          <a
            key={`${player.player_id}-${player.year}`}
            href={`/player/${player.player_id}`}
            className="flex items-center mx-2"
          >
            <TeamLogo
              teamId={player.prev_team_id}
              conferenceId={player.conference_id}
              teamName={player.team}
              className="h-8 w-8 mr-2"
            />
            <span className="text-xs">
              {player.year} - {player.player_name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
});

const enrichStats = (stats) => {
  if (!stats || !Array.isArray(stats)) return [];

  return stats
    .map((stat) => ({
      ...stat,
      renderedTeam: renderTeamLogo(
        stat.prev_team_id,
        stat.conference_id,
        stat.Team
      ),
      renderedConference: renderTeamLogo(
        stat.prev_team_id,
        stat.conference_id,
        stat.Conference,
        true
      ),
    }))
    .sort((a, b) => {
      const yearKey = "Season" in a ? "Season" : "Year";
      return b[yearKey] - a[yearKey];
    });
};

const PlayerContent = memo(
  ({ activeTab, statCategories, selectedDivision, playerId }) => {
    const stats = statCategories[activeTab]?.stats || [];
    const statType = statCategories[activeTab]?.type || activeTab;

    const getMostRecentYear = () => {
      if (stats.length === 0) return new Date().getFullYear();
      const yearKey = "Season" in stats[0] ? "Season" : "Year";
      return stats[0][yearKey];
    };

    const shouldShowSprayChart =
      [
        STAT_TYPES.BATTING,
        STAT_TYPES.BASERUNNING,
        STAT_TYPES.SITUATIONAL,
        STAT_TYPES.SPLITS,
        STAT_TYPES.BATTED_BALL,
      ].includes(activeTab) && stats.length > 0;

    // Update this condition to match the spray chart condition
    const shouldShowSimilarBatters = shouldShowSprayChart;

    const currentYear = getMostRecentYear();

    return (
      <div className="p-6">
        {stats.length > 0 && (
          <MemoizedStatTable stats={stats} type={statType} />
        )}

        {shouldShowSimilarBatters && (
          <SimilarBatters
            playerId={playerId}
            year={currentYear}
            division={selectedDivision}
          />
        )}

        {shouldShowSprayChart && (
          <div className="mt-8">
            <SprayChart
              playerId={playerId}
              year={currentYear}
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

const STAT_TYPES = {
  BATTING: "batting",
  PITCHING: "pitching",
  BASERUNNING: "baserunning",
  BATTED_BALL: "batted_ball",
  SITUATIONAL: "situational",
  SITUATIONAL_PITCHER: "situational_pitcher",
  SPLITS: "splits",
  SPLITS_PITCHER: "splits_pitcher",
};

const getBaseStatType = (statType) => {
  if (
    [
      STAT_TYPES.BATTING,
      STAT_TYPES.BASERUNNING,
      STAT_TYPES.BATTED_BALL,
      STAT_TYPES.SPLITS,
      STAT_TYPES.SITUATIONAL,
    ].includes(statType)
  ) {
    return STAT_TYPES.BATTING;
  }
  return STAT_TYPES.PITCHING;
};

const PlayerPage = () => {
  const { playerId } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [percentiles, setPercentiles] = useState({
    batting: null,
    pitching: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(STAT_TYPES.BATTING);
  const [selectedDivision, setSelectedDivision] = useState(3);
  const [statData, setStatData] = useState({
    [STAT_TYPES.BASERUNNING]: [],
    [STAT_TYPES.BATTED_BALL]: [],
    [STAT_TYPES.SPLITS]: [],
    [STAT_TYPES.SPLITS_PITCHER]: [],
    [STAT_TYPES.SITUATIONAL]: [],
    [STAT_TYPES.SITUATIONAL_PITCHER]: [],
  });
  const [initialized, setInitialized] = useState(false);

  const fetchPercentiles = useCallback(
    async (year, division, statType) => {
      try {
        const baseStatType = getBaseStatType(statType);
        const response = await fetchAPI(
          `/api/player-percentiles/${decodeURIComponent(
            playerId
          )}/${year}/${division}`
        );

        setPercentiles((prev) => ({
          ...prev,
          [baseStatType]: response[baseStatType],
        }));
      } catch (err) {
        console.error(`Error fetching ${statType} percentiles:`, err);
      }
    },
    [playerId]
  );

  const fetchStatsForType = useCallback(
    async (statType) => {
      try {
        const response = await fetchAPI(
          `/api/leaderboards/${statType}/${encodeURIComponent(
            playerId
          )}?start_year=2021&end_year=2025&division=${selectedDivision}`
        );

        const enrichedStats = enrichStats(response);

        setStatData((prev) => ({
          ...prev,
          [statType]: enrichedStats,
        }));
      } catch (err) {
        console.error(`Error fetching ${statType} stats:`, err);
      }
    },
    [playerId, selectedDivision]
  );

  const fetchAllStats = useCallback(() => {
    const statTypes = [
      STAT_TYPES.BASERUNNING,
      STAT_TYPES.BATTED_BALL,
      STAT_TYPES.SPLITS,
      STAT_TYPES.SPLITS_PITCHER,
      STAT_TYPES.SITUATIONAL,
      STAT_TYPES.SITUATIONAL_PITCHER,
    ];

    return Promise.all(statTypes.map((type) => fetchStatsForType(type)));
  }, [fetchStatsForType]);

  const enhancePlayerData = useCallback((data) => {
    if (!data) return null;

    return {
      ...data,
      renderedTeam: data.currentTeam
        ? renderTeamLogo(
            data.prev_team_id,
            data.conference_id,
            data.currentTeam
          )
        : null,
      renderedConference: data.conference
        ? renderTeamLogo(
            data.prev_team_id,
            data.conference_id,
            data.conference,
            true
          )
        : null,
      battingStats: enrichStats(data.battingStats),
      pitchingStats: enrichStats(data.pitchingStats),
    };
  }, []);

  const determineInitialActiveTab = useCallback((playerData) => {
    if (!playerData.battingStats?.length && playerData.pitchingStats?.length) {
      return STAT_TYPES.PITCHING;
    }
    return STAT_TYPES.BATTING;
  }, []);

  const determineDivision = useCallback((playerData) => {
    const getMaxSeason = (stats) =>
      stats?.length
        ? Math.max(...stats.map((s) => s.Season || s.Year || 0))
        : 0;

    const maxBattingSeason = getMaxSeason(playerData.battingStats);
    const maxPitchingSeason = getMaxSeason(playerData.pitchingStats);

    let division = 3;

    if (maxBattingSeason > 0) {
      const stat = playerData.battingStats.find(
        (s) => s.Season === maxBattingSeason
      );
      if (stat?.Division) division = stat.Division;
    } else if (maxPitchingSeason > 0) {
      const stat = playerData.pitchingStats.find(
        (s) => s.Season === maxPitchingSeason
      );
      if (stat?.Division) division = stat.Division;
    }

    return division;
  }, []);

  const initializePercentiles = useCallback(
    async (playerData, division) => {
      const promises = [];

      if (playerData.battingStats?.length) {
        const maxSeason = Math.max(
          ...playerData.battingStats.map((s) => s.Season)
        );
        promises.push(
          fetchPercentiles(maxSeason, division, STAT_TYPES.BATTING)
        );
      }

      if (playerData.pitchingStats?.length) {
        const maxSeason = Math.max(
          ...playerData.pitchingStats.map((s) => s.Season)
        );
        promises.push(
          fetchPercentiles(maxSeason, division, STAT_TYPES.PITCHING)
        );
      }

      return Promise.all(promises);
    },
    [fetchPercentiles]
  );

  useEffect(() => {
    const loadPlayerData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAPI(
          `/api/player/${decodeURIComponent(playerId)}`
        );
        const enhancedData = enhancePlayerData(response);
        setPlayerData(enhancedData);

        const division = determineDivision(enhancedData);
        setSelectedDivision(division);

        await Promise.all([
          initializePercentiles(enhancedData, division),
          fetchAllStats(),
        ]);

        setActiveTab(determineInitialActiveTab(enhancedData));
        setInitialized(true);
      } catch (err) {
        setError(err.message || "Failed to load player data");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [
    playerId,
    enhancePlayerData,
    determineDivision,
    initializePercentiles,
    fetchAllStats,
    determineInitialActiveTab,
  ]);

  useEffect(() => {
    if (initialized) {
      fetchAllStats();
    }
  }, [initialized, selectedDivision, fetchAllStats]);

  const handleTabChange = useCallback(
    (newTab) => {
      if (newTab === activeTab) return;
      setActiveTab(newTab);

      const baseType = getBaseStatType(newTab);

      if (
        baseType === STAT_TYPES.BATTING &&
        percentiles.batting === null &&
        playerData?.battingStats?.length > 0
      ) {
        const maxSeason = Math.max(
          ...playerData.battingStats.map((s) => s.Season)
        );
        fetchPercentiles(maxSeason, selectedDivision, baseType);
      } else if (
        baseType === STAT_TYPES.PITCHING &&
        percentiles.pitching === null &&
        playerData?.pitchingStats?.length > 0
      ) {
        const maxSeason = Math.max(
          ...playerData.pitchingStats.map((s) => s.Season)
        );
        fetchPercentiles(maxSeason, selectedDivision, baseType);
      }
    },
    [activeTab, playerData, percentiles, selectedDivision, fetchPercentiles]
  );

  const handleDivisionChange = useCallback(
    (division) => {
      setSelectedDivision(division);

      const baseType = getBaseStatType(activeTab);
      const currentPercentiles = percentiles[baseType];

      if (currentPercentiles?.season) {
        fetchPercentiles(currentPercentiles.season, division, baseType);
      }
    },
    [activeTab, percentiles, fetchPercentiles]
  );

  const handleYearChange = useCallback(
    (year) => {
      const baseType = getBaseStatType(activeTab);
      fetchPercentiles(year, selectedDivision, baseType);
    },
    [activeTab, selectedDivision, fetchPercentiles]
  );

  const getAvailableYears = useCallback(
    (type = null) => {
      if (!playerData) return [];

      const years = new Set();

      if (type === null || type === STAT_TYPES.BATTING) {
        playerData.battingStats?.forEach((stat) => years.add(stat.Season));
      }

      if (type === null || type === STAT_TYPES.PITCHING) {
        playerData.pitchingStats?.forEach((stat) => years.add(stat.Season));
      }

      if (type !== null && statData[type]) {
        const yearKey = statData[type][0]?.Season ? "Season" : "Year";
        statData[type].forEach((stat) => years.add(stat[yearKey]));
      }

      return Array.from(years).sort((a, b) => b - a);
    },
    [playerData, statData]
  );

  const getAvailableDivisions = useCallback(() => {
    if (!playerData) return [];

    const divisions = new Set();

    [
      playerData.battingStats,
      playerData.pitchingStats,
      ...Object.values(statData),
    ].forEach((statsArray) => {
      statsArray?.forEach((stat) => {
        if (stat.Division) divisions.add(stat.Division);
      });
    });

    return Array.from(divisions).sort((a, b) => a - b);
  }, [playerData, statData]);

  const availableTabs = useMemo(() => {
    const tabs = [];

    if (playerData?.battingStats?.length > 0) {
      tabs.push({ id: STAT_TYPES.BATTING, label: "Batting" });
    }

    if (playerData?.pitchingStats?.length > 0) {
      tabs.push({ id: STAT_TYPES.PITCHING, label: "Pitching" });
    }

    if (statData[STAT_TYPES.BASERUNNING]?.length > 0) {
      tabs.push({ id: STAT_TYPES.BASERUNNING, label: "Baserunning" });
    }

    if (statData[STAT_TYPES.BATTED_BALL]?.length > 0) {
      tabs.push({ id: STAT_TYPES.BATTED_BALL, label: "Batted Ball" });
    }

    if (statData[STAT_TYPES.SITUATIONAL]?.length > 0) {
      tabs.push({ id: STAT_TYPES.SITUATIONAL, label: "Situational (Batting)" });
    }

    if (statData[STAT_TYPES.SITUATIONAL_PITCHER]?.length > 0) {
      tabs.push({
        id: STAT_TYPES.SITUATIONAL_PITCHER,
        label: "Situational (Pitching)",
      });
    }

    if (statData[STAT_TYPES.SPLITS]?.length > 0) {
      tabs.push({ id: STAT_TYPES.SPLITS, label: "Splits (Batting)" });
    }

    if (statData[STAT_TYPES.SPLITS_PITCHER]?.length > 0) {
      tabs.push({ id: STAT_TYPES.SPLITS_PITCHER, label: "Splits (Pitching)" });
    }

    return tabs;
  }, [playerData, statData]);

  const statCategories = useMemo(
    () => ({
      [STAT_TYPES.BATTING]: {
        stats: playerData?.battingStats || [],
        type: STAT_TYPES.BATTING,
      },
      [STAT_TYPES.PITCHING]: {
        stats: playerData?.pitchingStats || [],
        type: STAT_TYPES.PITCHING,
      },
      [STAT_TYPES.BASERUNNING]: {
        stats: statData[STAT_TYPES.BASERUNNING],
        type: STAT_TYPES.BASERUNNING,
      },
      [STAT_TYPES.BATTED_BALL]: {
        stats: statData[STAT_TYPES.BATTED_BALL],
        type: STAT_TYPES.BATTED_BALL,
      },
      [STAT_TYPES.SITUATIONAL]: {
        stats: statData[STAT_TYPES.SITUATIONAL],
        type: STAT_TYPES.SITUATIONAL,
      },
      [STAT_TYPES.SITUATIONAL_PITCHER]: {
        stats: statData[STAT_TYPES.SITUATIONAL_PITCHER],
        type: STAT_TYPES.SITUATIONAL_PITCHER,
      },
      [STAT_TYPES.SPLITS]: {
        stats: statData[STAT_TYPES.SPLITS],
        type: STAT_TYPES.SPLITS,
      },
      [STAT_TYPES.SPLITS_PITCHER]: {
        stats: statData[STAT_TYPES.SPLITS_PITCHER],
        type: STAT_TYPES.SPLITS_PITCHER,
      },
    }),
    [playerData, statData]
  );

  const enhancedPlayerDataForPercentile = useMemo(() => {
    if (!playerData) return null;

    return {
      ...playerData,
      yearsPlayed: getAvailableYears(activeTab),
      divisionsPlayed: getAvailableDivisions(),
    };
  }, [playerData, getAvailableYears, getAvailableDivisions, activeTab]);

  const currentPercentiles = useMemo(() => {
    const baseType = getBaseStatType(activeTab);
    return {
      [baseType]: percentiles[baseType],
    };
  }, [activeTab, percentiles]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm">
              <PlayerHeader playerData={playerData} />
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
              <PercentileSection
                playerData={enhancedPlayerDataForPercentile}
                initialPercentiles={currentPercentiles}
                activeTab={getBaseStatType(activeTab)}
                onYearChange={handleYearChange}
                selectedDivision={selectedDivision}
                onDivisionChange={handleDivisionChange}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              availableTabs={availableTabs}
            />
            <PlayerContent
              activeTab={activeTab}
              statCategories={statCategories}
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
