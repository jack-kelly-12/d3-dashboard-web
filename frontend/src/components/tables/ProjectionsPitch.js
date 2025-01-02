import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";

const ProjectionsPitch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConference, setSelectedConference] = useState("");
  const [minIP, setMinIP] = useState(10);
  const [conferences, setConferences] = useState([]);

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
        name: "App",
        selector: (row) => row.App.toFixed(0),
        sortable: true,
        width: "80px",
      },
      {
        name: "GS",
        selector: (row) => row.GS.toFixed(0),
        sortable: true,
        width: "80px",
      },
      {
        name: "IP",
        selector: (row) => row.IP,
        sortable: true,
        width: "80px",
        cell: (row) => row.IP.toFixed(1),
      },
      {
        name: "H",
        selector: (row) => row.H.toFixed(0),
        sortable: true,
        width: "70px",
      },
      {
        name: "BB",
        selector: (row) => row.BB.toFixed(0),
        sortable: true,
        width: "70px",
      },
      {
        name: "HB",
        selector: (row) => row.HB.toFixed(0),
        sortable: true,
        width: "70px",
      },
      {
        name: "SO",
        selector: (row) => row.SO.toFixed(0),
        sortable: true,
        width: "70px",
      },
      {
        name: "HR",
        selector: (row) => row["HR-A"].toFixed(0),
        sortable: true,
        width: "70px",
      },
      {
        name: "K%",
        selector: (row) => row["K%"],
        sortable: true,
        width: "80px",
        cell: (row) => row["K%"].toFixed(1) + "%",
      },
      {
        name: "BB%",
        selector: (row) => row["BB%"],
        sortable: true,
        width: "80px",
        cell: (row) => row["BB%"].toFixed(1) + "%",
      },
      {
        name: "ERA",
        selector: (row) => row.ERA,
        sortable: true,
        width: "80px",
        cell: (row) => row.ERA.toFixed(2),
      },
      {
        name: "FIP",
        selector: (row) => row.FIP,
        sortable: true,
        width: "80px",
        cell: (row) => row.FIP.toFixed(2),
      },
      {
        name: "xFIP",
        selector: (row) => row.xFIP,
        sortable: true,
        width: "80px",
        cell: (row) => row.xFIP.toFixed(2),
      },
      {
        name: "LI",
        selector: (row) => row.gmLI,
        sortable: true,
        width: "80px",
        cell: (row) => row.gmLI.toFixed(1),
      },
      {
        name: "WAR",
        selector: (row) => row.WAR,
        sortable: true,
        width: "80px",
        cell: (row) => row.WAR.toFixed(1),
      },
    ],
    []
  );

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
          `/api/projections-pitch-25?min_ip=${minIP}`
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [minIP]);

  const handleSearchChange = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
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

  return (
    <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">
          2025 Pitching Projections
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Pitching projections for the upcoming 2025 season. Uses up to three
          years of data, regressed to the mean based on sample size. Playing
          time projections based on historical role and usage patterns.
        </p>
      </div>

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
              value={minIP}
              onChange={(e) => setMinIP(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Min 1 IP</option>
              <option value={10}>Min 10 IP</option>
              <option value={20}>Min 20 IP</option>
              <option value={30}>Min 30 IP</option>
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

export default ProjectionsPitch;
