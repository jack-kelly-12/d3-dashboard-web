import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import AuthManager from "../../managers/AuthManager";
import SubscriptionManager from "../../managers/SubscriptionManager";

const BaserunningLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
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
    try {
      const response = await fetchAPI("/conferences");
      setConferences(response.sort());
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  }, []);

  useEffect(() => {
    fetchConferences();
  }, [fetchConferences]);

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
      if (user) {
        SubscriptionManager.listenToSubscriptionUpdates(
          user.uid,
          (subscription) => {
            setIsPremiumUser(subscription?.isActive || false);
          }
        );
      } else {
        setIsPremiumUser(false);
      }
    });

    return () => {
      unsubscribeAuth();
      SubscriptionManager.stopListening();
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await fetchAPI(
        `/api/leaderboards/baserunning?start_year=${startYear}&end_year=${endYear}&division=${division}`
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
    } finally {
      setIsLoading(false);
    }
  }, [startYear, endYear, division]);

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
        cell: (row) => (
          <Link
            to={`/player/${row.player_id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {row.Player}
          </Link>
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
        selector: (row) => row.Year,
        sortable: true,
        width: "80px",
      },
      {
        name: "SB",
        selector: (row) => row.SB,
        sortable: true,
        width: "70px",
      },
      {
        name: "CS",
        selector: (row) => row.CS,
        sortable: true,
        width: "70px",
      },
      {
        name: "SB%",
        selector: (row) => row["SB%"],
        sortable: true,
        width: "90px",
        cell: (row) => row["SB%"]?.toFixed(1) + "%" || "—",
      },
      {
        name: "XBT",
        selector: (row) => row.XBT,
        sortable: true,
        width: "70px",
      },
      {
        name: "XBT%",
        selector: (row) => row.XBT / row.Opportunities,
        sortable: true,
        width: "90px",
        cell: (row) =>
          row.Opportunities
            ? (100 * (row.XBT / row.Opportunities)).toFixed(1) + "%"
            : "—",
      },
      {
        name: "Picked",
        selector: (row) => row.Picked,
        sortable: true,
        width: "90px",
        cell: (row) => row.Picked || "0",
      },
      {
        name: "wSB",
        selector: (row) => row.wSB,
        sortable: true,
        width: "90px",
        cell: (row) => row.wSB?.toFixed(1) || "0.0",
      },
      {
        name: "wGDP",
        selector: (row) => row.wGDP,
        sortable: true,
        width: "90px",
        cell: (row) => row.wGDP?.toFixed(1) || "0.0",
      },
      {
        name: "wTEB",
        selector: (row) => row.wTEB,
        sortable: true,
        width: "90px",
        cell: (row) => row.wTEB?.toFixed(1) || "0.0",
      },
      {
        name: "BsR",
        selector: (row) => row.Baserunning,
        sortable: true,
        width: "90px",
        cell: (row) => row.Baserunning?.toFixed(1) || "—",
      },
    ],
    []
  );

  return (
    <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Explanation Banner */}
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">
          What is the Baserunning Leaderboard?
        </h3>
        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
          This leaderboard helps evaluate players contributions to their
          respective teams based on their baserunning. An elite baserunner could
          add almost one win above replacement to their team based on
          baserunnning alone. Baserunning run value is calculated using wSB,
          wGDP, and wTEB, which is based off of Fangraphs methodology besides
          the UBR component. wTEB is a new stat that values taking extra bases
          compared to the average baserunner.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search players or teams..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {isPremiumUser && (
                <select
                  value={division}
                  onChange={(e) => setDivision(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={1}>Division 1</option>
                  <option value={2}>Division 2</option>
                  <option value={3}>Division 3</option>
                </select>
              )}
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2023, 2022, 2021].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-gray-500">to</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2023, 2022, 2021].map((year) => (
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
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <BaseballTable
            data={filteredData}
            columns={columns}
            defaultSortField="Baserunning"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default BaserunningLeaderboard;
