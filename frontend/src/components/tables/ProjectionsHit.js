import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";

const ProjectionsHit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConference, setSelectedConference] = useState("");
  const [minPA, setMinPA] = useState(50);
  const [conferences, setConferences] = useState([]);

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rawData = await fetchAPI(
          `/api/projections-hit-25?min_pa=${minPA}`
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
    };

    fetchData();
  }, [minPA]);

  const formatRate = (value) =>
    value ? value.toFixed(3).replace(/^0+/, "") : ".000";
  const formatWar = (value) => (value ? value.toFixed(1) : "0.0");
  const formatCounting = (value) => (value ? Math.round(value) : 0);

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
        name: "Yr",
        selector: (row) => row.Yr,
        sortable: true,
        width: "80px",
      },
      {
        name: "PA",
        selector: (row) => row.PA,
        cell: (row) => formatCounting(row.PA),
        sortable: true,
        width: "80px",
      },
      {
        name: "H",
        selector: (row) => row.H,
        cell: (row) => formatCounting(row.H),
        sortable: true,
        width: "80px",
      },
      {
        name: "BB",
        selector: (row) => row.BB,
        cell: (row) => formatCounting(row.BB),
        sortable: true,
        width: "80px",
      },
      {
        name: "K",
        selector: (row) => row.K,
        cell: (row) => formatCounting(row.K),
        sortable: true,
        width: "80px",
      },
      {
        name: "AVG",
        selector: (row) => row.BA,
        cell: (row) => formatRate(row.BA),
        sortable: true,
        width: "80px",
      },
      {
        name: "SLG",
        selector: (row) => row.SLGPct,
        cell: (row) => formatRate(row.SLGPct),
        sortable: true,
        width: "80px",
      },
      {
        name: "OBP",
        selector: (row) => row.OBPct,
        cell: (row) => formatRate(row.OBPct),
        sortable: true,
        width: "80px",
      },
      {
        name: "wOBA",
        selector: (row) => row.wOBA,
        cell: (row) => formatRate(row.wOBA),
        sortable: true,
        width: "80px",
      },
      {
        name: "Batting",
        selector: (row) => row["Batting"],
        cell: (row) => formatWar(row["Batting"]),
        sortable: true,
        width: "100px",
      },
      {
        name: "Baserunning",
        selector: (row) => row["Baserunning"],
        cell: (row) => formatWar(row["Baserunning"]),
        sortable: true,
        width: "100px",
      },
      {
        name: "Pos. Adjustment",
        selector: (row) => row["Adjustment"],
        cell: (row) => formatWar(row["Adjustment"]),
        sortable: true,
        width: "130px",
      },
      {
        name: "WAR",
        selector: (row) => row["WAR"],
        cell: (row) => formatWar(row["WAR"]),
        sortable: true,
        width: "80px",
      },
    ],
    []
  );

  return (
    <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Explanation Banner */}
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">
          2025 Hitting Projections
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Positional player projections for the upcoming 2025 season. Uses up to
          three years of data from a player, regresses to the mean, and adjusts
          for age. Older players typically get better at hitting for power, for
          example, so that is accounted for based on the player's academic year.
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

            <select
              value={minPA}
              onChange={(e) => setMinPA(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Min 1 PA</option>
              <option value={25}>Min 25 PA</option>
              <option value={50}>Min 50 PA</option>
              <option value={100}>Min 100 PA</option>
              <option value={150}>Min 150 PA</option>
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
            defaultSortField="WAR"
            defaultSortAsc={false}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectionsHit;
