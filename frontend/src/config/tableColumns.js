import { PFCell } from "../components/cells/PFCell";
import { roundTo } from "../utils/mathUtils";
import { Link } from "react-router-dom";
import { WARCell } from "../utils/colorUtils";

const createPercentageSortFn = (field) => (rowA, rowB) => {
  const a = parseFloat(String(rowA[field]).replace("%", "")) || 0;
  const b = parseFloat(String(rowB[field]).replace("%", "")) || 0;
  return a - b;
};

export const columnsGuts = [
  {
    name: "Year",
    selector: (row) => row.Year,
    sortable: true,
    className: "px-4 py-3 font-medium",
    width: "6rem",
  },
  {
    name: "Division",
    selector: (row) => row.Division,
    sortable: true,
    className: "px-4 py-3",
    width: "7.5rem",
  },
  {
    name: "wOBA",
    selector: (row) => roundTo(row.wOBA, 3),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "6rem",
  },
  {
    name: "wOBA Scale",
    selector: (row) => roundTo(row.wOBAScale, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "8rem",
  },
  {
    name: "wBB",
    selector: (row) => roundTo(row.wBB, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "wHBP",
    selector: (row) => roundTo(row.wHBP, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "w1B",
    selector: (row) => roundTo(row.w1B, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "w2B",
    selector: (row) => roundTo(row.w2B, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "w3B",
    selector: (row) => roundTo(row.w3B, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "wHR",
    selector: (row) => roundTo(row.wHR, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "wSB",
    selector: (row) => roundTo(row.runSB, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "wCS",
    selector: (row) => roundTo(row.runCS, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "R/PA",
    selector: (row) => roundTo(row.runsPA, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "R/W",
    selector: (row) => roundTo(row.runsWin, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "cFIP",
    selector: (row) => roundTo(row.cFIP, 2),
    sortable: true,
    className: "px-4 py-3 text-center font-medium",
    width: "5.5rem",
  },
  {
    name: "R/Out",
    selector: (row) => roundTo(row.runsOut, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "5.5rem",
  },
  {
    name: "csRate",
    selector: (row) => roundTo(row.csRate, 1),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "6rem",
  },
];

export const columnsPF = [
  {
    name: "Team",
    selector: (row) => row.team_name,
    sortable: true,
    className: "px-4 py-3 font-medium",
    width: "180px",
  },
  {
    name: "Years",
    selector: (row) => row.Years,
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "110px",
  },
  {
    name: "PF",
    selector: (row) => roundTo(row.PF, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "80px",
    cell: (row) => <PFCell value={row.PF} />,
  },
  {
    name: "Runs @ Home",
    selector: (row) => roundTo(row.H, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "130px",
  },
  {
    name: "Runs on Road",
    selector: (row) => roundTo(row.R, 2),
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "130px",
  },
  {
    name: "Home Games",
    selector: (row) => row.total_home_games,
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "130px",
  },
  {
    name: "Away Games",
    selector: (row) => row.total_away_games,
    sortable: true,
    className: "px-4 py-3 text-center",
    width: "130px",
  },
];

export const getDataColumns = (dataType) => {
  switch (dataType) {
    default:
      return [];
    case "player_hitting":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "7.5rem",
          cell: (row) =>
            row.player_id.substring(0, 4) === "d3d-" ? (
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
          width: "4.5rem",
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Season",
          selector: (row) => row.Season,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Year",
          selector: (row) => row.Yr,
          sortable: true,
          width: "5rem",
        },
        {
          name: "GP",
          selector: (row) => row.GP,
          sortable: true,
          width: "5rem",
        },
        {
          name: "AB",
          selector: (row) => row.AB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "PA",
          selector: (row) => row.PA,
          sortable: true,
          width: "5rem",
        },
        {
          name: "H",
          selector: (row) => row.H,
          sortable: true,
          width: "5rem",
        },
        {
          name: "2B",
          selector: (row) => row["2B"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "3B",
          selector: (row) => row["3B"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR",
          selector: (row) => row.HR,
          sortable: true,
          width: "5rem",
        },
        {
          name: "R",
          selector: (row) => row.R,
          sortable: true,
          width: "5rem",
        },
        {
          name: "SB",
          selector: (row) => row.SB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB",
          selector: (row) => row.BB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "HBP",
          selector: (row) => row.HBP,
          sortable: true,
          width: "5rem",
        },
        {
          name: "Picked",
          selector: (row) => row.Picked,
          sortable: true,
          width: "5rem",
        },
        {
          name: "Sac. Bunt",
          selector: (row) => row.Sac,
          sortable: true,
          width: "6rem",
        },
        {
          name: "BA",
          selector: (row) => roundTo(row.BA, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "SLG",
          selector: (row) => roundTo(row.SlgPct, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "ISO",
          selector: (row) => roundTo(row.ISO, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "OBP",
          selector: (row) => roundTo(row.OBPct, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "wOBA",
          selector: (row) => roundTo(row.wOBA, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K%",
          selector: (row) => roundTo(row["K%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K%"),
        },
        {
          name: "BB%",
          selector: (row) => roundTo(row["BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("BB%"),
        },
        {
          name: "SB%",
          selector: (row) => roundTo(row["SB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("SB%"),
        },
        {
          name: "wRC+",
          selector: (row) => roundTo(row["wRC+"], 0),
          sortable: true,
          width: "5rem",
        },
        {
          name: "OPS+",
          selector: (row) => roundTo(row["OPS+"], 0),
          sortable: true,
          width: "5rem",
        },
        {
          name: "Batting",
          selector: (row) => roundTo(row["Batting"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Base Run",
          selector: (row) => roundTo(row["Baserunning"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Pos. Adj",
          selector: (row) => roundTo(row["Adjustment"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["WPA"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["WPA/LI"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WAR",
          selector: (row) => roundTo(row.WAR, 1),
          sortable: true,
          width: "5rem",
          cell: (row) => <WARCell value={row.WAR} />,
        },
      ];
    case "player_pitching":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "7.5rem",
          cell: (row) =>
            row.player_id.substring(0, 4) === "d3d-" ? (
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
          width: "4.5rem",
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Season",
          selector: (row) => row.Season,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Year",
          selector: (row) => row.Yr,
          sortable: true,
          width: "5rem",
        },
        {
          name: "App",
          selector: (row) => row.App,
          sortable: true,
          width: "5rem",
        },
        {
          name: "GS",
          selector: (row) => row.GS,
          sortable: true,
          width: "5rem",
        },
        {
          name: "IP",
          selector: (row) => roundTo(row.IP, 1),
          sortable: true,
          width: "5rem",
        },
        {
          name: "Pitches",
          selector: (row) => row.Pitches,
          sortable: true,
          width: "6rem",
        },
        {
          name: "H",
          selector: (row) => row.H,
          sortable: true,
          width: "5rem",
        },
        {
          name: "2B",
          selector: (row) => row["2B-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "3B",
          selector: (row) => row["3B-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR",
          selector: (row) => row["HR-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "R",
          selector: (row) => row.R,
          sortable: true,
          width: "5rem",
        },
        {
          name: "ER",
          selector: (row) => row.ER,
          sortable: true,
          width: "5rem",
        },
        {
          name: "HB",
          selector: (row) => row.HB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB",
          selector: (row) => row.BB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "ERA",
          selector: (row) => roundTo(row.ERA, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "FIP",
          selector: (row) => roundTo(row.FIP, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "xFIP",
          selector: (row) => roundTo(row.xFIP, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "ERA+",
          selector: (row) => roundTo(row["ERA+"], 0),
          sortable: true,
          width: "5rem",
        },
        {
          name: "RA9",
          selector: (row) => roundTo(row.RA9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K/9",
          selector: (row) => roundTo(row.K9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB/9",
          selector: (row) => roundTo(row.BB9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "H/9",
          selector: (row) => roundTo(row.H9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR/9",
          selector: (row) => roundTo(row.HR9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K%",
          selector: (row) => roundTo(row["K%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K%"),
        },
        {
          name: "BB%",
          selector: (row) => roundTo(row["BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("BB%"),
        },
        {
          name: "K-BB%",
          selector: (row) => roundTo(row["K-BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K-BB%"),
        },
        {
          name: "HR/FB",
          selector: (row) => roundTo(row["HR/FB"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("HR/FB"),
        },
        {
          name: "IR-A%",
          selector: (row) => roundTo(row["IR-A%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("IR-A%"),
        },
        {
          name: "LI",
          selector: (row) => roundTo(row.gmLI, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["pWPA"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["pWPA/LI"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WAR",
          selector: (row) => roundTo(row.WAR, 1),
          sortable: true,
          width: "5rem",
          cell: (row) => <WARCell value={row.WAR} />,
        },
      ];
    case "team_hitting":
      return [
        {
          name: "Team",
          width: "4.5rem",
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Season",
          selector: (row) => row.Season,
          sortable: true,
          width: "6rem",
        },
        {
          name: "AB",
          selector: (row) => row.AB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "PA",
          selector: (row) => row.PA,
          sortable: true,
          width: "5rem",
        },
        {
          name: "H",
          selector: (row) => row.H,
          sortable: true,
          width: "5rem",
        },
        {
          name: "2B",
          selector: (row) => row["2B"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "3B",
          selector: (row) => row["3B"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR",
          selector: (row) => row.HR,
          sortable: true,
          width: "5rem",
        },
        {
          name: "R",
          selector: (row) => row.R,
          sortable: true,
          width: "5rem",
        },
        {
          name: "SB",
          selector: (row) => row.SB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB",
          selector: (row) => row.BB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "HBP",
          selector: (row) => row.HBP,
          sortable: true,
          width: "5rem",
        },
        {
          name: "Picked",
          selector: (row) => row.Picked,
          sortable: true,
          width: "5rem",
        },
        {
          name: "Sac. Bunt",
          selector: (row) => row.Sac,
          sortable: true,
          width: "6rem",
        },
        {
          name: "BA",
          selector: (row) => roundTo(row.BA, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "SLG",
          selector: (row) => roundTo(row.SlgPct, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "ISO",
          selector: (row) => roundTo(row.ISO, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "OBP",
          selector: (row) => roundTo(row.OBPct, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "wOBA",
          selector: (row) => roundTo(row.wOBA, 3),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K%",
          selector: (row) => roundTo(row["K%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K%"),
        },
        {
          name: "BB%",
          selector: (row) => roundTo(row["BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("BB%"),
        },
        {
          name: "SB%",
          selector: (row) => roundTo(row["SB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("SB%"),
        },
        {
          name: "OPS+",
          selector: (row) => roundTo(row["OPS+"], 0),
          sortable: true,
          width: "5rem",
        },
        {
          name: "Batting",
          selector: (row) => roundTo(row["Batting"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Base Run",
          selector: (row) => roundTo(row["Baserunning"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["WPA"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["WPA/LI"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WAR",
          selector: (row) => roundTo(row.WAR, 1),
          sortable: true,
          width: "5rem",
          cell: (row) => <WARCell value={row.WAR} />,
        },
      ];
    case "team_pitching":
      return [
        {
          name: "Team",
          width: "4.5rem",
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Season",
          selector: (row) => row.Season,
          sortable: true,
          width: "6rem",
        },
        {
          name: "IP",
          selector: (row) => roundTo(row.IP, 1),
          sortable: true,
          width: "5rem",
        },
        {
          name: "Pitches",
          selector: (row) => row.Pitches,
          sortable: true,
          width: "6rem",
        },
        {
          name: "H",
          selector: (row) => row.H,
          sortable: true,
          width: "5rem",
        },
        {
          name: "2B",
          selector: (row) => row["2B-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "3B",
          selector: (row) => row["3B-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR",
          selector: (row) => row["HR-A"],
          sortable: true,
          width: "5rem",
        },
        {
          name: "R",
          selector: (row) => row.R,
          sortable: true,
          width: "5rem",
        },
        {
          name: "ER",
          selector: (row) => row.ER,
          sortable: true,
          width: "5rem",
        },
        {
          name: "HBP",
          selector: (row) => row.HB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "SO",
          selector: (row) => row.SO,
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB",
          selector: (row) => row.BB,
          sortable: true,
          width: "5rem",
        },
        {
          name: "ERA",
          selector: (row) => roundTo(row.ERA, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "FIP",
          selector: (row) => roundTo(row.FIP, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "xFIP",
          selector: (row) => roundTo(row.xFIP, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "RA9",
          selector: (row) => roundTo(row.RA9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K/9",
          selector: (row) => roundTo(row.K9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "BB/9",
          selector: (row) => roundTo(row.BB9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "H/9",
          selector: (row) => roundTo(row.H9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "HR/9",
          selector: (row) => roundTo(row.HR9, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "K%",
          selector: (row) => roundTo(row["K%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K%"),
        },
        {
          name: "BB%",
          selector: (row) => roundTo(row["BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("BB%"),
        },
        {
          name: "K-BB%",
          selector: (row) => roundTo(row["K-BB%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("K-BB%"),
        },
        {
          name: "HR/FB",
          selector: (row) => roundTo(row["HR/FB"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("HR/FB"),
        },
        {
          name: "IR-A%",
          selector: (row) => roundTo(row["IR-A%"], 1) + "%",
          sortable: true,
          width: "5rem",
          sortFunction: createPercentageSortFn("IR-A%"),
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["pWPA"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["pWPA/LI"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"], 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WAR",
          selector: (row) => roundTo(row.WAR, 1),
          sortable: true,
          width: "5rem",
          cell: (row) => <WARCell value={row.WAR} isTeam={true} />,
        },
      ];
  }
};

export const getReportColumns = (onReportSelect) => [
  {
    name: "Team",
    selector: (row) => row.teamName,
    sortable: true,
    width: "25%",
  },
  {
    name: "Date Created",
    selector: (row) => row.dateCreated,
    sortable: true,
    width: "25%",
    format: (row) => new Date(row.dateCreated).toLocaleDateString(),
  },
  {
    name: "# Pitchers",
    selector: (row) => row.numPitchers,
    sortable: true,
    width: "20%",
  },
  {
    name: "# Hitters",
    selector: (row) => row.numHitters,
    sortable: true,
    width: "20%",
  },
  {
    name: "Actions",
    cell: (row) => (
      <button
        onClick={() => onReportSelect(row)}
        className="px-4 py-2 text-sm bg-[#007BA7] text-white rounded hover:bg-blue-50 transition-colors duration-200"
      >
        View
      </button>
    ),
    width: "10%",
    button: true,
  },
];
