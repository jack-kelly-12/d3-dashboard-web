import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { fetchAPI } from "../config/api";
import { isBattingTab } from "../utils/playerDataUtils";
import { trackPlayerPageVisit } from "../services/dataService";
import { PercentileSection } from "../components/player/PercentileRankings";
import StatTable from "../components/player/StatTable";
import PlayerHeader from "../components/player/PlayerHeader";
import SprayChart from "../components/player/SprayChart";
import RollingChart from "../components/player/RollingChart";
import SimilarBatters from "../components/player/SimilarBatters";
import SimilarPitchers from "../components/player/SimilarPitchers";
import { usePercentiles } from "../hooks/usePercentiles";

const LoadingState = () => (
  <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700"></div>
    </div>
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
    </div>
  </div>
);

const ErrorState = memo(({ error }) => (
  <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">
            Error Loading Player
          </h3>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  </div>
));

ErrorState.displayName = 'ErrorState';

const TabButton = memo(({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 font-medium text-xs rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
      active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
    }`}
    style={{ minWidth: "max-content", padding: "0.5rem 0.75rem" }}
  >
    {children}
  </button>
));

TabButton.displayName = 'TabButton';

const TabNavigation = memo(({ activeTab, onTabChange, availableTabs }) => (
  <div className="border-b border-gray-100">
    <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
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

TabNavigation.displayName = 'TabNavigation';

const renderTeamName = (teamName) => (
  <div className="w-full flex justify-center items-center">
    <span className="text-sm font-medium text-gray-700">{teamName}</span>
  </div>
);


const enrichStats = (stats) => {
  if (!stats || !Array.isArray(stats)) return [];

  return stats
    .map((stat) => ({
      ...stat,
      renderedTeam: renderTeamName(stat.team_name),
      renderedConference: renderTeamName(stat.conference),
    }))
    .sort((a, b) => {
      const yearKey = "year" in a ? "year" : "Season";
      return b[yearKey] - a[yearKey];
    });
};

const PlayerContent = memo(
  ({ activeTab, statCategories, selectedDivision, playerId, playerData }) => {
    const [isRollingChartLoading, setIsRollingChartLoading] = useState({
      batter: false,
      pitcher: false,
    });

    const stats = statCategories[activeTab]?.stats || [];
    const statType = statCategories[activeTab]?.type || activeTab;

    const playerType = [
      STAT_TYPES.BATTING,
      STAT_TYPES.BASERUNNING,
      STAT_TYPES.SITUATIONAL,
      STAT_TYPES.SPLITS,
      STAT_TYPES.BATTED_BALL,
    ].includes(activeTab)
      ? "batter"
      : "pitcher";

    const getMostRecentYear = () => {
      if (stats.length === 0) return new Date().getFullYear();
      const yearKey = "year" in stats[0] ? "year" : "Season" in stats[0] ? "Season" : "Year";
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

    const shouldShowSimilarBatters = shouldShowSprayChart;
    const shouldShowSimilarPitchers = playerType === "pitcher" && stats.length > 0;

    const currentYear = getMostRecentYear();

    const playerName = playerData?.player_name || "";

    const chartLabel =
      playerType === "batter" ? "Batting wOBA" : "Pitching wOBA";

    const handleRollingChartLoadingState = (type, isLoading) => {
      setIsRollingChartLoading((prev) => ({
        ...prev,
        [type]: isLoading,
      }));
    };

    return (
      <div className="p-6 space-y-8">
        {stats.length > 0 && (
          <StatTable stats={stats} type={statType} />
        )}

        {shouldShowSimilarPitchers && (
          <SimilarPitchers
            playerId={playerId}
            year={currentYear}
            division={selectedDivision}
          />
        )}

        {playerType === "pitcher" && stats.length > 0 && (
          <div>
            {isRollingChartLoading.pitcher ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <RollingChart
                playerId={playerId}
                playerType={playerType}
                window={25}
                playerName={playerName}
                chartTitle={chartLabel}
                onLoadingStateChange={(isLoading) =>
                  handleRollingChartLoadingState("pitcher", isLoading)
                }
              />
            )}
          </div>
        )}

        {shouldShowSimilarBatters && (
          <SimilarBatters
            playerId={playerId}
            year={currentYear}
            division={selectedDivision}
          />
        )}

        {shouldShowSprayChart && (
          <SprayChart
            playerId={playerId}
            year={currentYear}
            division={selectedDivision}
            height={600}
            width={700}
          />
        )}

        {playerType === "batter" && shouldShowSprayChart && (
          <div>
            {isRollingChartLoading.batter ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm mt-4">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <RollingChart
                playerId={playerId}
                playerType={playerType}
                window={25}
                playerName={playerName}
                chartTitle={chartLabel}
                onLoadingStateChange={(isLoading) =>
                  handleRollingChartLoadingState("batter", isLoading)
                }
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

PlayerContent.displayName = 'PlayerContent';

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
  const [playerYears, setPlayerYears] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderReady, setIsHeaderReady] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(STAT_TYPES.BATTING);
  const [selectedDivision, setSelectedDivision] = useState(3);
  const [selectedConference, setSelectedConference] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [statData, setStatData] = useState({
    [STAT_TYPES.BASERUNNING]: [],
    [STAT_TYPES.BATTED_BALL]: [],
    [STAT_TYPES.SPLITS]: [],
    [STAT_TYPES.SPLITS_PITCHER]: [],
    [STAT_TYPES.SITUATIONAL]: [],
    [STAT_TYPES.SITUATIONAL_PITCHER]: [],
  });
  const isInitialMount = useRef(true);

  const fallbackYearsByTab = useMemo(() => {
    const battingYears = (playerData?.battingStats || []).map(s => s.year || s.Season).filter(Boolean);
    const pitchingYears = (playerData?.pitchingStats || []).map(s => s.year || s.Season).filter(Boolean);
    const sortedB = [...new Set(battingYears)].sort((a,b) => b-a);
    const sortedP = [...new Set(pitchingYears)].sort((a,b) => b-a);
    return {
      batting_years: sortedB,
      pitching_years: sortedP,
      most_recent_batting: sortedB[0] || null,
      most_recent_pitching: sortedP[0] || null,
    };
  }, [playerData]);

  const { 
    percentiles, 
    isLoading: isPercentilesLoading,
    targetYear: percentTargetYear,
    prefetchYears,
  } = usePercentiles({
    playerId: decodeURIComponent(playerId),
    playerYears,
    activeTab,
    division: selectedDivision,
    conference: selectedConference,
    selectedYear,
    fallbackYearsByTab,
  });

  const enhancePlayerData = useCallback((data) => {
    if (!data) return null;

    return {
      ...data,
      renderedTeam: data.current_team ? renderTeamName(data.current_team) : null,
      renderedConference: data.conference ? renderTeamName(data.conference) : null,
      battingStats: enrichStats(data.batting_stats),
      pitchingStats: enrichStats(data.pitching_stats),
      yearsPlayed: [
        ...new Set([
          ...(data.batting_stats || []).map(s => s.year),
          ...(data.pitching_stats || []).map(s => s.year),
        ])
      ]
    };
  }, []);

  const fetchStatsForType = useCallback(async (statType, division) => {
    try {
      const response = await fetchAPI(
        `/api/leaderboards/${statType}/${encodeURIComponent(playerId)}?start_year=2021&end_year=2025&division=${division}`
      );
      return { [statType]: enrichStats(response) };
    } catch (err) {
      console.error(`Error fetching ${statType} stats:`, err);
      return { [statType]: [] };
    }
  }, [playerId]);

  const fetchAllStats = useCallback(async (division) => {
    const statTypes = [
      STAT_TYPES.BASERUNNING,
      STAT_TYPES.BATTED_BALL,
      STAT_TYPES.SPLITS,
      STAT_TYPES.SPLITS_PITCHER,
      STAT_TYPES.SITUATIONAL,
      STAT_TYPES.SITUATIONAL_PITCHER,
    ];
    const results = await Promise.all(statTypes.map(type => fetchStatsForType(type, division)));
    setStatData(results.reduce((acc, result) => ({ ...acc, ...result }), {}));
  }, [fetchStatsForType]);
  
  const determineDivision = useCallback((playerData) => {
    const getMaxSeason = (stats) => stats?.length ? Math.max(...stats.map(s => s.year || s.Season || 0)) : 0;
    const maxBattingSeason = getMaxSeason(playerData.battingStats);
    const maxPitchingSeason = getMaxSeason(playerData.pitchingStats);

    let division = 3;
    if (maxBattingSeason > 0) {
      const stat = playerData.battingStats.find(s => s.year === maxBattingSeason);
      if (stat?.division) division = stat.division;
    } else if (maxPitchingSeason > 0) {
      const stat = playerData.pitchingStats.find(s => s.year === maxPitchingSeason);
      if (stat?.division) division = stat.division;
    }
    return division;
  }, []);

  const determineInitialActiveTab = useCallback((playerData) => {
    if (!playerData.battingStats?.length && playerData.pitchingStats?.length) {
      return STAT_TYPES.PITCHING;
    }
    return STAT_TYPES.BATTING;
  }, []);

  const fetchPlayerYears = useCallback(async (division) => {
    try {
      const url = `/api/player-years/${decodeURIComponent(playerId)}/${division}`;
      const response = await fetchAPI(url);
      setPlayerYears(response);
    } catch (err) {
      console.error(`Error fetching player years:`, err);
    }
  }, [playerId]);
  
  
  const handleYearChange = useCallback(async (year) => {
    setSelectedYear(year);
  }, []);

  const handleConferenceChange = useCallback((conference) => {
    setSelectedConference(conference);
  }, []);

  const handleTabChange = useCallback((newTab) => {
      if (newTab === activeTab) return;
      
      const newTabType = isBattingTab(newTab) ? 'batting' : 'pitching';
      
      setActiveTab(newTab);
      
      if (playerYears) {
        const mostRecentYear = newTabType === 'batting' ? playerYears.most_recent_batting : playerYears.most_recent_pitching;
        
        if (mostRecentYear && mostRecentYear !== selectedYear) {
          setSelectedYear(mostRecentYear);
        }
      }
  }, [activeTab, selectedYear, playerYears]);

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

        const years = enhancedData?.yearsPlayed || [];
        const initialYear = years.length > 0 ? Math.max(...years) : null;
        if (initialYear) {
          setSelectedYear(initialYear);
        }

        await fetchAllStats(division);
        await fetchPlayerYears(division);

        const initialTab = determineInitialActiveTab(enhancedData);
        setActiveTab(initialTab);
        
        isInitialMount.current = false;
        
      } catch (err) {
        setError(err.message || "Failed to load player data");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId, enhancePlayerData, determineDivision, fetchAllStats, determineInitialActiveTab, fetchPlayerYears]);

  useEffect(() => {
    if (percentTargetYear && selectedYear !== percentTargetYear) {
      setSelectedYear(percentTargetYear);
    }
  }, [percentTargetYear, selectedYear]);

  useEffect(() => {
    if (!playerYears) return;
    const years = isBattingTab(activeTab) ? playerYears?.batting_years : playerYears?.pitching_years;
    if (!years || !years.length) return;
    const recent = [...years].sort((a, b) => b - a).slice(0, 3);
    prefetchYears(recent);
  }, [playerYears, activeTab, prefetchYears]);

  const getAvailableYears = useCallback(
    (type = null) => {
      if (!playerData) return [];

      const years = new Set();

      if (type === null || type === STAT_TYPES.BATTING) {
        playerData.battingStats?.forEach((stat) => years.add(stat.year || stat.Season));
      }

      if (type === null || type === STAT_TYPES.PITCHING) {
        playerData.pitchingStats?.forEach((stat) => years.add(stat.year || stat.Season));
      }

      if (type !== null && statData[type]) {
        const yearKey = statData[type][0]?.year ? "year" : statData[type][0]?.Season ? "Season" : "Year";
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
        if (stat.division || stat.Division) divisions.add(stat.division || stat.Division);
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
      battingStats: playerData.battingStats,
      pitchingStats: playerData.pitchingStats,
    };
  }, [playerData, getAvailableYears, getAvailableDivisions, activeTab]);

  const currentPercentiles = useMemo(() => {
    const baseType = getBaseStatType(activeTab);
    return {
      [baseType]: percentiles[baseType],
    };
  }, [activeTab, percentiles]);

  useEffect(() => {
    if (playerData) {
      trackPlayerPageVisit(playerData.player_id, playerData.player_name);
    }
  }, [playerData]);

  if (isLoading && isInitialMount.current) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!playerData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>
      <div className="relative z-10 container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        {!isHeaderReady && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <PlayerHeader playerData={playerData} onReady={() => setIsHeaderReady(true)} />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <PercentileSection
                playerData={{...enhancedPlayerDataForPercentile, playerYears}}
                initialPercentiles={currentPercentiles}
                activeTab={activeTab}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
                onConferenceChange={handleConferenceChange}
                isLoading={isPercentilesLoading}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
              playerData={playerData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;