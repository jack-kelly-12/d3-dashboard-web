import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import { useSearchParams } from "react-router-dom";

const ValueLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(2024);
  const [selectedConference, setSelectedConference] = useState("");
  const [conferences, setConferences] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setSearchParams({
      table: "value-leaderboard",
      search: searchTerm,
      startYear,
      endYear,
      conference: selectedConference,
    });
  }, [searchTerm, startYear, endYear, selectedConference, setSearchParams]);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await fetchAPI("/conferences");
        setConferences(response.sort());
      } catch (err) {
        console.error("Error fetching conferences:", err);
      }
    };
    fetchConferences();
  }, []);

  // Fetch leaderboard data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rawData = await fetchAPI(
          `/api/leaderboards/value?start_year=${startYear}&end_year=${endYear}`
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startYear, endYear]);

  // Debounced search input
  const handleSearchChange = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  // Filter data based on search term and selected conference
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

  // Table columns
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
    ],
    []
  );

  return (
    <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Explanation Banner */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">
          What is the Value Leaderboard?
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          The Value Leaderboard displays Wins Above Replacement (WAR) for
          players across years, conferences, teams, and positions. WAR combines
          batting, baserunning, positional adjustment, and pitching to show run
          contributions. WAR is park-adjusted and strength-of-schedule adjusted
          to account for differences in ballparks and competition. Additional
          metrics include RE24 (run expectancy added), WPA (win probability
          added), and WPA/LI (context-neutral win probability added).
        </p>

        <blockquote className="text-sm border-l-4 border-blue-400 pl-4 italic text-gray-600 mt-2">
          "Player X has a WAR of 3.8. In 2024, the number of runs per win was
          13.8. He accrued 3.35 from batting, .52 from baserunning, .02 from
          positional adjustment, and no runs from pitching."
        </blockquote>
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
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            defaultSortField="WAR"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default ValueLeaderboard;
