import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import AuthManager from "../../managers/AuthManager";
import SubscriptionManager from "../../managers/SubscriptionManager";

const SituationalLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(2024);
  const [selectedConference, setSelectedConference] = useState("");
  const [minPA, setMinPA] = useState(50);
  const [conferences, setConferences] = useState([]);
  const [division, setDivision] = useState(3);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

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
      const rawData = await fetchAPI(
        `/api/leaderboards/situational?start_year=${startYear}&end_year=${endYear}&min_pa=${minPA}&division=${division}`
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
  }, [startYear, endYear, minPA, division, isAuthReady]);

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
      const nameMatch = player.Player.toLowerCase().includes(searchStr);
      const teamMatch = player.Team.toLowerCase().includes(searchStr);
      const conferenceMatch = selectedConference
        ? player.Conference === selectedConference
        : true;
      return (nameMatch || teamMatch) && conferenceMatch;
    });
  }, [data, searchTerm, selectedConference]);

  const columns = useMemo(
    () => [
      {
        name: "#",
        selector: (row) => row.rank,
        sortable: true,
        width: "60px",
      },
      {
        name: "Player",
        selector: (row) => row.Player,
        sortable: true,
        width: "150px",
        cell: (row) =>
          row.Division === 3 ? (
            <Link
              to={`/player/${row.player_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {row.Player}
            </Link>
          ) : (
            <span className="font-medium">{row.Player}</span>
          ),
      },
      {
        name: "Team",
        selector: (row) => row.Team,
        cell: (row) => row.renderedTeam,
        sortable: true,
        width: "60px",
      },
      {
        name: "Conference",
        selector: (row) => row.Conference,
        cell: (row) => row.renderedConference,
        sortable: true,
        width: "110px",
      },
      {
        name: "Year",
        selector: (row) => row.Season,
        sortable: true,
        width: "80px",
      },
      {
        name: "PA",
        selector: (row) => row.PA_Overall,
        sortable: true,
        width: "80px",
      },
      {
        name: "BA",
        selector: (row) => row.BA_Overall,
        sortable: true,
        width: "110px",
        cell: (row) => row.BA_Overall?.toFixed(3) || "—",
      },
      {
        name: "wOBA",
        selector: (row) => row.wOBA_Overall,
        sortable: true,
        width: "120px",
        cell: (row) => row.wOBA_Overall?.toFixed(3) || "—",
      },
      {
        name: "PA w/ RISP",
        selector: (row) => row.PA_RISP,
        sortable: true,
        width: "110px",
      },
      {
        name: "BA w/ RISP",
        selector: (row) => row.BA_RISP,
        sortable: true,
        width: "110px",
        cell: (row) => row.BA_RISP?.toFixed(3) || "—",
      },
      {
        name: "wOBA w/ RISP",
        selector: (row) => row.wOBA_RISP,
        sortable: true,
        width: "120px",
        cell: (row) => row.wOBA_RISP?.toFixed(3) || "—",
      },
      {
        name: "LI+ PA",
        selector: (row) => row.PA_High_Leverage,
        sortable: true,
        width: "110px",
      },
      {
        name: "LI+ BA",
        selector: (row) => row.BA_High_Leverage,
        sortable: true,
        width: "110px",
        cell: (row) => row.BA_High_Leverage?.toFixed(3) || "—",
      },
      {
        name: "LI+ wOBA",
        selector: (row) => row.wOBA_High_Leverage,
        sortable: true,
        width: "120px",
        cell: (row) => row.wOBA_High_Leverage?.toFixed(3) || "—",
      },
      {
        name: "LI- PA",
        selector: (row) => row.PA_Low_Leverage,
        sortable: true,
        width: "110px",
      },
      {
        name: "LI- BA",
        selector: (row) => row.BA_Low_Leverage,
        sortable: true,
        width: "110px",
        cell: (row) => row.BA_Low_Leverage?.toFixed(3) || "—",
      },
      {
        name: "LI- wOBA",
        selector: (row) => row.wOBA_Low_Leverage,
        sortable: true,
        width: "120px",
        cell: (row) => row.wOBA_Low_Leverage?.toFixed(3) || "—",
      },
      {
        name: "Clutch",
        selector: (row) => row.Clutch,
        sortable: true,
        width: "120px",
        cell: (row) => row.Clutch?.toFixed(3) || "—",
      },
    ],
    []
  );

  const yearOptions = useMemo(() => [2024, 2023, 2022, 2021], []);
  const paOptions = useMemo(
    () => [
      { value: 1, label: "Min 1 PA" },
      { value: 25, label: "Min 25 PA" },
      { value: 50, label: "Min 50 PA" },
      { value: 100, label: "Min 100 PA" },
      { value: 150, label: "Min 150 PA" },
    ],
    []
  );

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Explanation Banner */}
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the Situational Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          This leaderboard helps evaluate how players perform in different game
          situations, with emphasis on moments that can significantly impact the
          outcome of games.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="w-full lg:w-64 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search"
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

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
                value={minPA}
                onChange={(e) => setMinPA(Number(e.target.value))}
                className="w-full lg:w-36 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {paOptions.map((option) => (
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
            defaultSortField="wOBA_Overall"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default SituationalLeaderboard;
