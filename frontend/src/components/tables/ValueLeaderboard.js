import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import SubscriptionManager from "../../managers/SubscriptionManager";
import AuthManager from "../../managers/AuthManager";

const ValueLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(2024);
  const [selectedConference, setSelectedConference] = useState("");
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

  // Update URL when division changes
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
        `/api/leaderboards/value?start_year=${startYear}&end_year=${endYear}&division=${division}`
      );

      const sortedData = rawData.sort((a, b) => b.WAR - a.WAR);
      const transformedData = sortedData.map((row, index) => ({
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
          <div className="w-full flex justify-center items-center gap-2">
            <TeamLogo
              teamId={row.prev_team_id}
              conferenceId={row.conference_id}
              teamName={row.Conference}
              showConference={true}
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
  }, [startYear, endYear, division, isAuthReady]);

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

  const yearOptions = useMemo(() => [2024, 2023, 2022, 2021], []);

  const columns = useMemo(
    () => [
      {
        name: "#",
        selector: (row) => row.rank,
        sortable: true,
        width: "100px",
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
        name: "Pos",
        selector: (row) => row.Pos,
        sortable: true,
        width: "80px",
      },
      {
        name: "Year",
        selector: (row) => row.Year,
        sortable: true,
        width: "100px",
      },
      {
        name: "PA",
        selector: (row) => row.PA,
        sortable: true,
        width: "80px",
      },
      {
        name: "IP",
        selector: (row) => row.IP,
        sortable: true,
        width: "80px",
        cell: (row) => row.IP?.toFixed(1) || "—",
      },
      {
        name: "Batting",
        selector: (row) => row.Batting,
        sortable: true,
        width: "100px",
        cell: (row) => row.Batting?.toFixed(1) || "—",
      },
      {
        name: "Baserunning",
        selector: (row) => row.Baserunning,
        sortable: true,
        width: "120px",
        cell: (row) => row.Baserunning?.toFixed(1) || "—",
      },
      {
        name: "Position",
        selector: (row) => row.Adjustment,
        sortable: true,
        width: "120px",
        cell: (row) => row.Adjustment?.toFixed(1) || "—",
      },
      {
        name: "RE24",
        selector: (row) => row.REA,
        sortable: true,
        width: "120px",
        cell: (row) => row.REA?.toFixed(1) || "—",
      },
      {
        name: "Clutch",
        selector: (row) => row["Clutch"],
        sortable: true,
        width: "80px",
        cell: (row) => row["Clutch"]?.toFixed(1) || "—",
      },
      {
        name: "bWAR",
        selector: (row) => row.bWAR,
        sortable: true,
        width: "100px",
        cell: (row) => row.bWAR?.toFixed(1) || "—",
      },
      {
        name: "pWAR",
        selector: (row) => row.pWAR,
        sortable: true,
        width: "100px",
        cell: (row) => row.pWAR?.toFixed(1) || "—",
      },
      {
        name: "WAR",
        selector: (row) => row.WAR,
        sortable: true,
        width: "80px",
        cell: (row) => row.WAR?.toFixed(1) || "—",
      },
      {
        name: "WPA/LI",
        selector: (row) => row["WPA/LI"],
        sortable: true,
        width: "80px",
        cell: (row) => row["WPA/LI"]?.toFixed(1) || "—",
      },
      {
        name: "WPA",
        selector: (row) => row.WPA,
        sortable: true,
        width: "80px",
        cell: (row) => row.WPA?.toFixed(1) || "—",
      },
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
      <div className="bg-white border border-blue-200 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the Value Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          The Value Leaderboard displays Wins Above Replacement (WAR) for
          players across years, conferences, teams, and positions. WAR combines
          batting, baserunning, positional adjustment, and pitching to show run
          contributions. WAR is park-adjusted and strength-of-schedule adjusted
          to account for differences in ballparks and competition. Additional
          metrics include WPA (win probability added), and WPA/LI
          (context-neutral win probability added).
        </p>

        <blockquote className="text-xs lg:text-sm border-l-4 border-blue-400 pl-4 italic text-gray-600 mt-2">
          "Player X has a WAR of 3.8. In 2024, the number of runs per win was
          13.8. He accrued 3.35 from batting, .52 from baserunning, .02 from
          positional adjustment, and no runs from pitching."
        </blockquote>
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
            defaultSortField="WAR"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default ValueLeaderboard;
