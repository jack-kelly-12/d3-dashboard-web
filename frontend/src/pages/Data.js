import React, { useState, useEffect } from "react";
import { BaseballTable } from "../components/tables/BaseballTable";
import { roundTo } from "../utils/mathUtils";
import { WARCell } from "../utils/colorUtils";
import InfoBanner from "../components/data/InfoBanner";
import DataControls from "../components/data/DataControls";
import { fetchAPI } from "../config/api";
import { Link } from "react-router-dom";

const Data = () => {
  const [dataType, setDataType] = useState("player_hitting");
  const [selectedYears, setSelectedYears] = useState([2024]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPA, setMinPA] = useState(50);
  const [minIP, setMinIP] = useState(10);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpointMap = {
      player_hitting: (year) => `/api/batting_war/${year}`,
      player_pitching: (year) => `/api/pitching_war/${year}`,
      team_hitting: (year) => `/api/batting_team_war/${year}`,
      team_pitching: (year) => `/api/pitching_team_war/${year}`,
    };

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!selectedYears.length) {
          throw new Error("Please select at least one year");
        }

        const promises = selectedYears.map(async (year) => {
          try {
            return await fetchAPI(endpointMap[dataType](year));
          } catch (err) {
            console.error(`Error fetching data for year ${year}:`, err);
            return [];
          }
        });

        const results = await Promise.all(promises);
        const combinedData = results.flat();

        if (combinedData.length === 0) {
          setError("No data found for the selected years");
          return;
        }

        setData(combinedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataType, selectedYears]);

  const filteredData = data.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
    const team = item.Team?.toLowerCase() || "";
    const meetsQualifier =
      dataType === "player_pitching"
        ? item.IP >= minIP
        : dataType === "player_hitting"
        ? item.PA >= minPA
        : true;

    return (
      meetsQualifier && (name.includes(searchStr) || team.includes(searchStr))
    );
  });

  const getColumns = () => {
    switch (dataType) {
      default:
        return [];
      case "player_hitting":
        return [
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
            sortable: true,
            width: "150px",
          },
          {
            name: "Conference",
            selector: (row) => row.Conference,
            sortable: true,
            width: "150px",
          },
          {
            name: "Season",
            selector: (row) => row.Season,
            sortable: true,
            width: "100px",
          },
          {
            name: "Year",
            selector: (row) => row.Yr,
            sortable: true,
            width: "80px",
          },
          {
            name: "GP",
            selector: (row) => row.GP,
            sortable: true,
            width: "80px",
          },
          {
            name: "AB",
            selector: (row) => row.AB,
            sortable: true,
            width: "80px",
          },
          {
            name: "PA",
            selector: (row) => row.PA,
            sortable: true,
            width: "80px",
          },
          {
            name: "H",
            selector: (row) => row.H,
            sortable: true,
            width: "80px",
          },
          {
            name: "2B",
            selector: (row) => row["2B"],
            sortable: true,
            width: "80px",
          },
          {
            name: "3B",
            selector: (row) => row["3B"],
            sortable: true,
            width: "80px",
          },
          {
            name: "HR",
            selector: (row) => row.HR,
            sortable: true,
            width: "80px",
          },
          {
            name: "R",
            selector: (row) => row.R,
            sortable: true,
            width: "80px",
          },
          {
            name: "SB",
            selector: (row) => row.SB,
            sortable: true,
            width: "80px",
          },
          {
            name: "BB",
            selector: (row) => row.BB,
            sortable: true,
            width: "80px",
          },
          {
            name: "HBP",
            selector: (row) => row.HBP,
            sortable: true,
            width: "80px",
          },
          {
            name: "Picked",
            selector: (row) => row.Picked,
            sortable: true,
            width: "90px",
          },
          {
            name: "Sac. Bunt",
            selector: (row) => row.Sac,
            sortable: true,
            width: "100px",
          },
          {
            name: "BA",
            selector: (row) => roundTo(row.BA, 3),
            sortable: true,
            width: "80px",
          },
          {
            name: "SLG",
            selector: (row) => roundTo(row.SlgPct, 3),
            sortable: true,
            width: "80px",
          },
          {
            name: "ISO",
            selector: (row) => roundTo(row.ISO, 3),
            sortable: true,
            width: "80px",
          },
          {
            name: "OBP",
            selector: (row) => roundTo(row.OBPct, 3),
            sortable: true,
            width: "80px",
          },
          {
            name: "wOBA",
            selector: (row) => roundTo(row.wOBA, 3),
            sortable: true,
            width: "80px",
          },
          {
            name: "K%",
            selector: (row) => roundTo(row["K%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "BB%",
            selector: (row) => roundTo(row["BB%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "SB%",
            selector: (row) => roundTo(row["SB%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "wRC+",
            selector: (row) => roundTo(row["wRC+"], 0),
            sortable: true,
            width: "80px",
          },
          {
            name: "OPS+",
            selector: (row) => roundTo(row["OPS+"], 0),
            sortable: true,
            width: "80px",
          },
          {
            name: "Batting",
            selector: (row) => roundTo(row["Batting"], 1),
            sortable: true,
            width: "100px",
          },
          {
            name: "Base Run",
            selector: (row) => roundTo(row["Baserunning"], 1),
            sortable: true,
            width: "100px",
          },
          {
            name: "Adj",
            selector: (row) => roundTo(row["Adjustment"], 1),
            sortable: true,
            width: "100px",
          },
          {
            name: "WAR",
            selector: (row) => roundTo(row.WAR, 1),
            sortable: true,
            width: "80px",
            cell: (row) => <WARCell value={row.WAR} />,
          },
        ];
      case "player_pitching":
        return [
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
            sortable: true,
            width: "150px",
          },
          {
            name: "Conference",
            selector: (row) => row.Conference,
            sortable: true,
            width: "150px",
          },
          {
            name: "Season",
            selector: (row) => row.Season,
            sortable: true,
            width: "90px",
          },
          {
            name: "Year",
            selector: (row) => row.Yr,
            sortable: true,
            width: "80px",
          },
          {
            name: "App",
            selector: (row) => row.App,
            sortable: true,
            width: "80px",
          },
          {
            name: "GS",
            selector: (row) => row.GS,
            sortable: true,
            width: "80px",
          },
          {
            name: "IP",
            selector: (row) => row.IP,
            sortable: true,
            width: "80px",
          },
          {
            name: "Pitches",
            selector: (row) => row.Pitches,
            sortable: true,
            width: "100px",
          },
          {
            name: "H",
            selector: (row) => row.H,
            sortable: true,
            width: "80px",
          },
          {
            name: "2B",
            selector: (row) => row["2B-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "3B",
            selector: (row) => row["3B-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "HR",
            selector: (row) => row["HR-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "R",
            selector: (row) => row.R,
            sortable: true,
            width: "80px",
          },
          {
            name: "ER",
            selector: (row) => row.ER,
            sortable: true,
            width: "80px",
          },
          {
            name: "HB",
            selector: (row) => row.HB,
            sortable: true,
            width: "80px",
          },
          {
            name: "BB",
            selector: (row) => row.BB,
            sortable: true,
            width: "80px",
          },
          {
            name: "ERA",
            selector: (row) => roundTo(row.ERA, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "FIP",
            selector: (row) => roundTo(row.FIP, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "xFIP",
            selector: (row) => roundTo(row.xFIP, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "ERA+",
            selector: (row) => roundTo(row["ERA+"], 0),
            sortable: true,
            width: "80px",
          },
          {
            name: "LI",
            selector: (row) => roundTo(row.gmLI, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "RA9",
            selector: (row) => roundTo(row.RA9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "K/9",
            selector: (row) => roundTo(row.K9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "BB/9",
            selector: (row) => roundTo(row.BB9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "H/9",
            selector: (row) => roundTo(row.H9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "HR/9",
            selector: (row) => roundTo(row.HR9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "K%",
            selector: (row) => roundTo(row["K%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "BB%",
            selector: (row) => roundTo(row["BB%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "K-BB%",
            selector: (row) => roundTo(row["K-BB%"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "HR/FB",
            selector: (row) => roundTo(row["HR/FB"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "IR-A%",
            selector: (row) => roundTo(row["IR-A%"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "WAR",
            selector: (row) => roundTo(row.WAR, 1),
            sortable: true,
            width: "80px",
            cell: (row) => <WARCell value={row.WAR} />,
          },
        ];
      case "team_hitting":
        return [
          {
            name: "Team",
            selector: (row) => row.Team,
            sortable: true,
            width: "150px",
            cell: (row) => (
              <div className="font-medium text-[#2A89B8]">{row.Team}</div>
            ),
          },
          {
            name: "Conference",
            selector: (row) => row.Conference,
            sortable: true,
            width: "150px",
          },
          {
            name: "Season",
            selector: (row) => row.Season,
            sortable: true,
            width: "100px",
          },
          {
            name: "AB",
            selector: (row) => row.AB,
            sortable: true,
            width: "80px",
          },
          {
            name: "PA",
            selector: (row) => row.PA,
            sortable: true,
            width: "80px",
          },
          {
            name: "H",
            selector: (row) => row.H,
            sortable: true,
            width: "80px",
          },
          {
            name: "2B",
            selector: (row) => row["2B"],
            sortable: true,
            width: "80px",
          },
          {
            name: "3B",
            selector: (row) => row["3B"],
            sortable: true,
            width: "80px",
          },
          {
            name: "HR",
            selector: (row) => row.HR,
            sortable: true,
            width: "80px",
          },
          {
            name: "R",
            selector: (row) => row.R,
            sortable: true,
            width: "80px",
          },
          {
            name: "SB",
            selector: (row) => row.SB,
            sortable: true,
            width: "80px",
          },
          {
            name: "BB",
            selector: (row) => row.BB,
            sortable: true,
            width: "80px",
          },
          {
            name: "HBP",
            selector: (row) => row.HBP,
            sortable: true,
            width: "80px",
          },
          {
            name: "Picked",
            selector: (row) => row.Picked,
            sortable: true,
            width: "90px",
          },
          {
            name: "Sac. Bunt",
            selector: (row) => row.Sac,
            sortable: true,
            width: "100px",
          },
          {
            name: "BA",
            selector: (row) => roundTo(row.BA, 3),
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row.BA, 3)}</div>
            ),
          },
          {
            name: "SLG",
            selector: (row) => roundTo(row.SlgPct, 3),
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row.SlgPct, 3)}</div>
            ),
          },
          {
            name: "ISO",
            selector: (row) => roundTo(row.ISO, 3),
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row.ISO, 3)}</div>
            ),
          },
          {
            name: "OBP",
            selector: (row) => roundTo(row.OBPct, 3),
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row.OBPct, 3)}</div>
            ),
          },
          {
            name: "wOBA",
            selector: (row) => roundTo(row.wOBA, 3),
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row.wOBA, 3)}</div>
            ),
          },
          {
            name: "K%",
            selector: (row) => row["K%"],
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row["K%"], 1)}%</div>
            ),
          },
          {
            name: "BB%",
            selector: (row) => row["BB%"],
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row["BB%"], 1)}%</div>
            ),
          },
          {
            name: "SB%",
            selector: (row) => row["SB%"],
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row["SB%"], 1)}%</div>
            ),
          },
          {
            name: "OPS+",
            selector: (row) => row["OPS+"],
            sortable: true,
            width: "80px",
            cell: (row) => (
              <div className="font-mono">{roundTo(row["OPS+"], 0)}</div>
            ),
          },
          {
            name: "WAR",
            selector: (row) => row.WAR,
            sortable: true,
            width: "80px",
            cell: (row) => <WARCell value={row.WAR} isTeam={true} />,
          },
        ];
      case "team_pitching":
        return [
          {
            name: "Team",
            selector: (row) => row.Team,
            sortable: true,
            width: "150px",
          },
          {
            name: "Conference",
            selector: (row) => row.Conference,
            sortable: true,
            width: "150px",
          },
          {
            name: "Season",
            selector: (row) => row.Season,
            sortable: true,
            width: "90px",
          },
          {
            name: "IP",
            selector: (row) => roundTo(row.IP, 1),
            sortable: true,
            width: "80px",
          },
          {
            name: "Pitches",
            selector: (row) => row.Pitches,
            sortable: true,
            width: "100px",
          },
          {
            name: "H",
            selector: (row) => row.H,
            sortable: true,
            width: "80px",
          },
          {
            name: "2B",
            selector: (row) => row["2B-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "3B",
            selector: (row) => row["3B-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "HR",
            selector: (row) => row["HR-A"],
            sortable: true,
            width: "80px",
          },
          {
            name: "R",
            selector: (row) => row.R,
            sortable: true,
            width: "80px",
          },
          {
            name: "ER",
            selector: (row) => row.ER,
            sortable: true,
            width: "80px",
          },
          {
            name: "HBP",
            selector: (row) => row.HB,
            sortable: true,
            width: "80px",
          },
          {
            name: "SO",
            selector: (row) => row.SO,
            sortable: true,
            width: "80px",
          },
          {
            name: "BB",
            selector: (row) => row.BB,
            sortable: true,
            width: "80px",
          },
          {
            name: "ERA",
            selector: (row) => roundTo(row.ERA, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "FIP",
            selector: (row) => roundTo(row.FIP, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "xFIP",
            selector: (row) => roundTo(row.xFIP, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "RA9",
            selector: (row) => roundTo(row.RA9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "K/9",
            selector: (row) => roundTo(row.K9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "BB/9",
            selector: (row) => roundTo(row.BB9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "H/9",
            selector: (row) => roundTo(row.H9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "HR/9",
            selector: (row) => roundTo(row.HR9, 2),
            sortable: true,
            width: "80px",
          },
          {
            name: "K%",
            selector: (row) => roundTo(row["K%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "BB%",
            selector: (row) => roundTo(row["BB%"], 1) + "%",
            sortable: true,
            width: "80px",
          },
          {
            name: "K-BB%",
            selector: (row) => roundTo(row["K-BB%"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "HR/FB",
            selector: (row) => roundTo(row["HR/FB"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "IR-A%",
            selector: (row) => roundTo(row["IR-A%"], 1) + "%",
            sortable: true,
            width: "90px",
          },
          {
            name: "WAR",
            selector: (row) => roundTo(row.WAR, 1),
            sortable: true,
            width: "80px",
            cell: (row) => <WARCell value={row.WAR} isTeam={true} />,
          },
        ];
    }
  };

  return (
    <div className="flex-1 overflow-x-hidden">
      <div className="max-w-[calc(100vw-256px)] mx-auto px-6 py-8">
        <InfoBanner dataType={dataType} />

        <DataControls
          dataType={dataType}
          setDataType={setDataType}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          minPA={minPA}
          setMinPA={setMinPA}
          minIP={minIP}
          setMinIP={setMinIP}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-[#041F3D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <BaseballTable
              data={filteredData}
              columns={getColumns()}
              filename={`${dataType}_${selectedYears.join("-")}.csv`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;
