import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { ChevronDown, Grid, BarChart2, List, X } from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import AuthManager from "../managers/AuthManager";
import PlayerListManager from "../managers/PlayerListManager";
import { useSearchParams } from "react-router-dom";

const RollingWOBALeaderboard = lazy(() =>
  import("../components/tables/RollingLeaderboard")
);
const ValueLeaderboard = lazy(() =>
  import("../components/tables/ValueLeaderboard")
);
const SituationalLeaderboard = lazy(() =>
  import("../components/tables/SituationalLeaderboard")
);
const BaserunningLeaderboard = lazy(() =>
  import("../components/tables/BaserunningLeaderboard")
);
const BattedBallLeaderboard = lazy(() =>
  import("../components/tables/BattedBallLeaderboard")
);
const SplitsLeaderboard = lazy(() =>
  import("../components/tables/SplitsLeaderboard")
);

const LEADERBOARD_CATEGORIES = {
  PERFORMANCE: {
    name: "Performance",
    icon: <BarChart2 size={16} className="text-blue-600" />,
    leaderboards: {
      VALUE: {
        id: "value",
        label: "Value Leaderboard",
        description:
          "Overall player value combining batting, baserunning, and pitching contributions",
        component: ValueLeaderboard,
      },
      ROLLING: {
        id: "rolling",
        label: "Rolling Leaderboard",
        description: "Track recent performance changes over plate appearances",
        component: RollingWOBALeaderboard,
      },
    },
  },
  CONTEXT: {
    name: "Context & Splits",
    icon: <Grid size={16} className="text-purple-600" />,
    leaderboards: {
      SITUATIONAL: {
        id: "situational",
        label: "Situational Leaderboard",
        description:
          "How players perform in various game situations (e.g. RISP, high/low leverage, etc.)",
        component: SituationalLeaderboard,
      },
      SPLITS: {
        id: "splits",
        label: "Splits Leaderboard",
        description:
          "Comparative statistics for pitchers and hitters in left/right matchup scenarios",
        component: SplitsLeaderboard,
      },
    },
  },
  SKILLS: {
    name: "Skill Breakdowns",
    icon: <List size={16} className="text-green-600" />,
    leaderboards: {
      BASERUNNING: {
        id: "baserunning",
        label: "Baserunning Leaderboard",
        description: "Comprehensive leaderboard of total baserunning value",
        component: BaserunningLeaderboard,
      },
      BATTEDBALL: {
        id: "battedball",
        label: "Batted Ball Leaderboard",
        description: "Distribution of batted ball types for each hitter",
        component: BattedBallLeaderboard,
      },
    },
  },
};

const ALL_LEADERBOARDS = {};
Object.values(LEADERBOARD_CATEGORIES).forEach((category) => {
  Object.entries(category.leaderboards).forEach(([key, leaderboard]) => {
    ALL_LEADERBOARDS[key] = leaderboard;
  });
});

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Leaderboards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState(() => {
    const urlType = searchParams.get("type");
    const validLeaderboard = Object.values(ALL_LEADERBOARDS).find(
      (t) => t.id === urlType
    );
    return validLeaderboard ? urlType : "value";
  });
  const [selectedListId, setSelectedListId] = useState(
    searchParams.get("listId") || ""
  );
  const [selectedListPlayerIds, setSelectedListPlayerIds] = useState([]);
  const [isLoadingPlayerList, setIsLoadingPlayerList] = useState(false);
  const [playerLists, setPlayerLists] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { isPremiumUser, isLoadingPremium } = useSubscription();
  const dropdownRef = useRef(null);
  const listDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (isMounted) {
          setIsAuthReady(true);

          if (user) {
            try {
              const lists = await PlayerListManager.getUserPlayerLists();
              setPlayerLists(lists || []);
            } catch (err) {
              console.error("Error fetching player lists:", err);
              setPlayerLists([]);
            }
          }
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    const fetchPlayerList = async () => {
      if (!selectedListId) {
        setSelectedListPlayerIds([]);
        return;
      }

      try {
        setIsLoadingPlayerList(true);
        const list = await PlayerListManager.getPlayerListById(selectedListId);
        if (list && list.playerIds) {
          setSelectedListPlayerIds(list.playerIds);
        } else {
          setSelectedListPlayerIds([]);
        }
      } catch (err) {
        console.error("Error fetching player list:", err);
        setSelectedListPlayerIds([]);
      } finally {
        setIsLoadingPlayerList(false);
      }
    };

    fetchPlayerList();
  }, [selectedListId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        listDropdownRef.current &&
        !listDropdownRef.current.contains(event.target)
      ) {
        setShowListDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const gcTimeout = setTimeout(() => {
      if (window.gc) {
        window.gc();
      }
    }, 100);

    return () => clearTimeout(gcTimeout);
  }, [selectedType]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("type", selectedType);

    if (selectedListId) {
      params.set("listId", selectedListId);
    }

    setSearchParams(params);
  }, [selectedType, selectedListId, setSearchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get("type");
      const urlListId = params.get("listId");

      const validLeaderboard = Object.values(ALL_LEADERBOARDS).find(
        (t) => t.id === urlType
      );
      if (validLeaderboard) {
        setSelectedType(urlType);
      }

      setSelectedListId(urlListId || "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleListSelection = useCallback((listId) => {
    setSelectedListId(listId);
    setShowListDropdown(false);
  }, []);

  const clearListSelection = useCallback(() => {
    setSelectedListId("");
    setShowListDropdown(false);
  }, []);

  const getSelectedListName = useCallback(() => {
    if (!selectedListId) return "All Players";
    const list = playerLists.find((list) => list.id === selectedListId);
    return list ? list.name : "All Players";
  }, [selectedListId, playerLists]);

  const getCurrentLeaderboard = () => {
    const selectedUpperType = Object.keys(ALL_LEADERBOARDS).find(
      (key) => ALL_LEADERBOARDS[key].id === selectedType
    );
    const leaderboard = selectedUpperType
      ? ALL_LEADERBOARDS[selectedUpperType]
      : null;
    const LeaderboardComponent = leaderboard?.component;

    return LeaderboardComponent ? (
      <Suspense fallback={<LoadingFallback />}>
        <LeaderboardComponent
          isPremiumUser={isPremiumUser}
          selectedListId={selectedListId}
          selectedListPlayerIds={selectedListPlayerIds}
          isLoadingPlayerList={isLoadingPlayerList}
        />
      </Suspense>
    ) : null;
  };

  const getCurrentLeaderboardName = () => {
    const selectedUpperType = Object.keys(ALL_LEADERBOARDS).find(
      (key) => ALL_LEADERBOARDS[key].id === selectedType
    );
    return selectedUpperType ? ALL_LEADERBOARDS[selectedUpperType].label : "";
  };

  if (!isAuthReady || isLoadingPremium) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mx-auto py-4 px-4 lg:px-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent py-3 mb-5 lg:mb-0">
            {getCurrentLeaderboardName()}
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Enhanced Leaderboard Type Selection Dropdown */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <div className="flex items-center gap-2">
                  {/* Show the current category icon */}
                  {Object.values(LEADERBOARD_CATEGORIES).map((category) =>
                    Object.values(category.leaderboards).some(
                      (lb) => lb.id === selectedType
                    ) ? (
                      <span key={category.name} className="hidden sm:block">
                        {category.icon}
                      </span>
                    ) : null
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Select Leaderboard
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ease-in-out ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown content with animation */}
              <div
                className={`absolute ${
                  isDropdownOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                } 
                  transition-all duration-200 ease-in-out right-0 sm:left-0 lg:right-0 lg:left-auto z-50 w-full sm:w-80 mt-2 
                  bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden`}
              >
                {Object.entries(LEADERBOARD_CATEGORIES).map(
                  ([categoryKey, category]) => (
                    <div
                      key={categoryKey}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <div className="px-4 py-2 bg-gray-50 flex items-center">
                        {category.icon}
                        <span className="ml-2 font-medium text-gray-700">
                          {category.name}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {Object.values(category.leaderboards).map(
                          (leaderboard) => (
                            <button
                              key={leaderboard.id}
                              onClick={() => {
                                setSelectedType(leaderboard.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors duration-150 ${
                                selectedType === leaderboard.id
                                  ? "bg-blue-50 border-l-4 border-blue-500"
                                  : ""
                              }`}
                            >
                              <div className="font-medium text-gray-900">
                                {leaderboard.label}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {leaderboard.description}
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Enhanced Player List Selection Dropdown */}
            <div className="relative w-full sm:w-auto" ref={listDropdownRef}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Player List:
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={() => setShowListDropdown(!showListDropdown)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 min-w-[160px]"
                    aria-haspopup="true"
                    aria-expanded={showListDropdown}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate max-w-[120px] sm:max-w-[140px]">
                        {getSelectedListName()}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ease-in-out ${
                        showListDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Enhanced dropdown content with animation */}
                  <div
                    className={`absolute ${
                      showListDropdown
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    } 
                      transition-all duration-200 ease-in-out right-0 mt-1 w-full sm:w-72 bg-white border border-gray-200 
                      rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto`}
                  >
                    <div className="p-2">
                      <button
                        onClick={clearListSelection}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                          !selectedListId
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        All Players
                      </button>

                      {playerLists.length > 0 ? (
                        playerLists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => handleListSelection(list.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                              selectedListId === list.id
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[180px]">
                                {list.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {list.playerIds?.length || 0} players
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-gray-500 text-center">
                          No player lists found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player List Filter Status */}
        {selectedListId && (
          <div className="mx-auto px-4 md:px-6 mb-6">
            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg inline-flex items-center">
              <span className="font-medium text-blue-700">Filtered: </span>
              <span className="mx-2 text-blue-600">
                Showing players from "{getSelectedListName()}" (
                {playerLists.find((l) => l.id === selectedListId)?.playerIds
                  .length || 0}{" "}
                players)
              </span>
              <button
                onClick={clearListSelection}
                className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-150"
                aria-label="Clear filter"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Content */}
        <div className="overflow-x-auto px-6">
          {isLoadingPlayerList ? <LoadingFallback /> : getCurrentLeaderboard()}
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
