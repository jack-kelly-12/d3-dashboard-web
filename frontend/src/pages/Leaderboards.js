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
        {/* Main container that keeps everything the same width */}
        <div className="rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left side - Title */}
            <h1 className="text-3xl font-bold text-blue-600">
              {getCurrentLeaderboardName()}
            </h1>

            {/* Right side - Controls */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Leaderboard Selection Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 min-w-[180px] text-sm font-medium text-gray-700 hover:bg-gray-50"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 13H12M8 17H16M8 9H16M18 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3H14L20 9V19C20 20.1046 19.1046 21 18 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Select Leaderboard</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown content */}
                <div
                  className={`absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden ${
                    isDropdownOpen
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  } transition-opacity duration-150`}
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
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
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

              {/* Player List Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Player List:
                </span>
                <div className="relative" ref={listDropdownRef}>
                  <button
                    onClick={() => setShowListDropdown(!showListDropdown)}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 min-w-[140px] text-sm text-gray-700 hover:bg-gray-50"
                    aria-expanded={showListDropdown}
                  >
                    <span className="truncate max-w-[100px]">
                      {getSelectedListName()}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        showListDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown content */}
                  <div
                    className={`absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto ${
                      showListDropdown
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    } transition-opacity duration-150`}
                  >
                    <div className="p-2">
                      <button
                        onClick={clearListSelection}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
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
                            className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                              selectedListId === list.id
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[150px]">
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

          {/* Filter indicator (always visible when a list is selected) */}
          {selectedListId && (
            <div className="bg-white border-x border-b border-blue-100 py-3 px-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-sm text-blue-700 mr-2">
                  Filtered:
                </span>
                <span className="text-sm text-blue-600">
                  Showing players from "{getSelectedListName()}" (
                  {playerLists.find((l) => l.id === selectedListId)?.playerIds
                    .length || 0}{" "}
                  players)
                </span>
              </div>
              <button
                onClick={clearListSelection}
                className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-150"
                aria-label="Clear filter"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Leaderboard Content - this is now contained in the same parent as the header */}
          <div className="rounded-b-lg overflow-x-auto">
            {isLoadingPlayerList ? (
              <LoadingFallback />
            ) : (
              getCurrentLeaderboard()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
