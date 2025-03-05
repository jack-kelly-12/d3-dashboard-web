import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search, Users, User } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import debounce from "lodash/debounce";
import AuthManager from "../../managers/AuthManager";
import SubscriptionManager from "../../managers/SubscriptionManager";
import { columnsSplits, columnsSplitsPitcher } from "../../config/tableColumns";

const SplitsLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2025);
  const [endYear, setEndYear] = useState(2025);
  const [selectedConference, setSelectedConference] = useState("");
  const [minCount, setMinCount] = useState(50);
  const [conferences, setConferences] = useState([]);
  const [division, setDivision] = useState(3);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [viewType, setViewType] = useState("batters");

  const fetchConferences = useCallback(async () => {
    if (!isAuthReady) return;

    try {
      const response = await fetchAPI(`/conferences?division=${division}`);
      setConferences(response.sort());
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  }, [division, isAuthReady]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user) {
          const initialSubscription =
            await SubscriptionManager.getUserSubscription(user.uid);
          if (isMounted) {
            setIsPremiumUser(initialSubscription?.isActive || false);

            if (initialSubscription?.isActive) {
              const urlParams = new URLSearchParams(window.location.search);
              const divisionParam = urlParams.get("division");
              if (divisionParam) {
                setDivision(Number(divisionParam));
              }
            }
          }

          SubscriptionManager.listenToSubscriptionUpdates(
            user.uid,
            (subscription) => {
              if (isMounted) {
                setIsPremiumUser(subscription?.isActive || false);
              }
            }
          );
        } else {
          if (isMounted) {
            setIsPremiumUser(false);
          }
        }

        if (isMounted) {
          setIsAuthReady(true);
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
      SubscriptionManager.stopListening();
    };
  }, []);

  useEffect(() => {
    if (isPremiumUser) {
      const url = new URL(window.location);
      url.searchParams.set("division", division.toString());
      window.history.replaceState({}, "", url);
    }
  }, [division, isPremiumUser]);

  useEffect(() => {
    if (isAuthReady) {
      fetchConferences();
    }
  }, [fetchConferences, isAuthReady]);

  const fetchData = useCallback(async () => {
    if (!isAuthReady) return;

    setIsLoading(true);
    setError(null);
    try {
      const endpoint =
        viewType === "batters"
          ? `/api/leaderboards/splits`
          : `/api/leaderboards/splits_pitcher`;

      // Use the appropriate parameter name based on view type
      const countParam = viewType === "batters" ? "min_pa" : "min_bf";

      const rawData = await fetchAPI(
        `${endpoint}?start_year=${startYear}&end_year=${endYear}&${countParam}=${minCount}&division=${division}`
      );

      const transformedData = rawData.map((row, index) => ({
        ...row,
        rank: index + 1,
        renderedTeam: (
          <div className="flex items-center gap-2">
            <TeamLogo
              teamId={row.prev_team_id}
              conferenceId={row.conference_id}
              teamName={row.Team}
              className="h-8 w-8"
            />
          </div>
        ),
        renderedConference: (
          <div className="flex items-center gap-2">
            <TeamLogo
              teamId={row.conference_id}
              conferenceId={row.conference_id}
              teamName={row.Team}
              className="h-8 w-8"
            />
          </div>
        ),
      }));

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      if (err.status === 403) {
        setDivision(3);
      }
    } finally {
      setIsLoading(false);
    }
  }, [startYear, endYear, minCount, division, isAuthReady, viewType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  const filteredData = useMemo(() => {
    return data.filter((player) => {
      const searchStr = searchTerm.toLowerCase();
      const nameMatch = player.Player?.toLowerCase().includes(searchStr);
      const teamMatch = player.Team?.toLowerCase().includes(searchStr);
      const conferenceMatch = selectedConference
        ? player.Conference === selectedConference
        : true;
      return (nameMatch || teamMatch) && conferenceMatch;
    });
  }, [data, searchTerm, selectedConference]);

  const yearOptions = useMemo(() => [2025, 2024, 2023, 2022, 2021], []);
  const countOptions = useMemo(
    () => [
      { value: 1, label: viewType === "batters" ? "Min 1 PA" : "Min 1 BF" },
      { value: 25, label: viewType === "batters" ? "Min 25 PA" : "Min 25 BF" },
      { value: 50, label: viewType === "batters" ? "Min 50 PA" : "Min 50 BF" },
      {
        value: 100,
        label: viewType === "batters" ? "Min 100 PA" : "Min 100 BF",
      },
      {
        value: 150,
        label: viewType === "batters" ? "Min 150 PA" : "Min 150 BF",
      },
    ],
    [viewType]
  );

  const columns = viewType === "batters" ? columnsSplits : columnsSplitsPitcher;
  const defaultSortField = "wOBA_Overall";
  const defaultSortAsc = viewType !== "batters";

  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    setData([]);
    setIsLoading(true);
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const explanationText =
    viewType === "batters"
      ? "The Splits Leaderboard shows how batters perform against left-handed and right-handed pitchers. Key metrics include batting average (BA), on-base percentage (OBP), slugging (SLG), and weighted on-base average (wOBA). These statistics are broken down by pitcher handedness to reveal platoon advantages and help inform matchup decisions."
      : "The Pitcher Splits Leaderboard shows how pitchers perform against left-handed and right-handed batters. Key metrics include batting average against (BA), on-base percentage against (OBP), slugging against (SLG), and weighted on-base average against (wOBA). These statistics are broken down by batter handedness to reveal platoon disadvantages and help inform matchup decisions.";

  const exampleText =
    viewType === "batters"
      ? '"Player X has a .320 wOBA overall, but shows a significant platoon split with a .350 wOBA vs RHP and .280 wOBA vs LHP across 200+ plate appearances, suggesting he sees the ball better against righties."'
      : '"Pitcher Y has a .290 wOBA overall, but shows a significant platoon split with a .310 wOBA vs RHH and .260 wOBA vs LHH across 200+ plate appearances, suggesting he\'s more effective against left-handed hitters."';

  return (
    <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Explanation Banner */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the {viewType === "batters" ? "Splits" : "Pitcher Splits"}{" "}
          Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          {explanationText} The minimum{" "}
          {viewType === "batters" ? "plate appearance" : "batters faced"} filter
          ensures statistical significance.
        </p>

        <blockquote className="text-xs lg:text-sm border-l-4 border-blue-400 pl-4 italic text-gray-600 mt-2">
          {exampleText}
        </blockquote>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4 space-y-4">
          {/* Toggle View Type and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-2">
            {/* Toggle buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <div className="inline-flex bg-gray-100 rounded-md" role="group">
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("batters")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                    viewType === "batters"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <User size={16} className="mr-1.5" />
                  Batters
                </button>
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("pitchers")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                    viewType === "pitchers"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Users size={16} className="mr-1.5" />
                  Pitchers
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="w-full lg:w-64 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name or team"
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            {isPremiumUser && (
              <select
                value={division}
                onChange={(e) => setDivision(Number(e.target.value))}
                className="w-full lg:w-32 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value={1}>Division 1</option>
                <option value={2}>Division 2</option>
                <option value={3}>Division 3</option>
              </select>
            )}

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full lg:w-24 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-xs lg:text-sm text-gray-500">to</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full lg:w-24 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
              className="w-full lg:w-36 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {countOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {conferences.length > 0 && (
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="w-full lg:w-44 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Conferences</option>
                {conferences.map((conf) => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-xs lg:text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <BaseballTable
            data={filteredData}
            columns={columns}
            defaultSortField={defaultSortField}
            defaultSortAsc={defaultSortAsc}
            stickyColumns={[0, 1]}
          />
        </div>
      )}
    </div>
  );
};

export default SplitsLeaderboard;
