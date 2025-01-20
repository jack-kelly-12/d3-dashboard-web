import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";

const SituationalLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(2024);
  const [selectedConference, setSelectedConference] = useState("");
  const [minPA, setMinPA] = useState(50);
  const [conferences, setConferences] = useState([]);

  // Memoized fetch conferences function
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

  // Memoized fetch data function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await fetchAPI(
        `/api/leaderboards/situational?start_year=${startYear}&end_year=${endYear}&min_pa=${minPA}`
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
  }, [startYear, endYear, minPA]);

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

  return (
    <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Explanation Banner */}
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">
          What is the Situational Leaderboard?
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          This leaderboard helps evaluate how players perform in different game
          situations, with emphasis on moments that can significantly impact the
          outcome of games.
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
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
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
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            defaultSortField="wOBA_Overall"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default SituationalLeaderboard;
