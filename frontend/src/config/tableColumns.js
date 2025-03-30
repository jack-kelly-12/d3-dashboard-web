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

export const columnsValue = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",

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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Pos",
    selector: (row) => row.Pos,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "Year",
    selector: (row) => row.Year,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "PA",
    selector: (row) => row.PA,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "IP",
    selector: (row) => row.IP,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.IP?.toFixed(1) || "—",
  },
  {
    name: "Batting",
    selector: (row) => row.Batting,
    sortable: true,
    width: "6.25rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Batting?.toFixed(1) || "—",
  },
  {
    name: "Baserunning",
    selector: (row) => row.Baserunning,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Baserunning?.toFixed(1) || "—",
  },
  {
    name: "Position",
    selector: (row) => row.Adjustment,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Adjustment?.toFixed(1) || "—",
  },
  {
    name: "RE24",
    selector: (row) => row.REA,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.REA?.toFixed(1) || "—",
  },
  {
    name: "Clutch",
    selector: (row) => row["Clutch"],
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["Clutch"]?.toFixed(1) || "—",
  },
  {
    name: "bWAR",
    selector: (row) => row.bWAR,
    sortable: true,
    width: "6.25rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => <WARCell value={row.bWAR} />,
  },
  {
    name: "pWAR",
    selector: (row) => row.pWAR,
    sortable: true,
    width: "6.25rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => <WARCell value={row.pWAR} />,
  },
  {
    name: "WAR",
    selector: (row) => row.WAR,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center font-bold",
    cell: (row) => <WARCell value={row.WAR} bold={true} />,
  },
  {
    name: "WPA/LI",
    selector: (row) => row["WPA/LI"],
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["WPA/LI"]?.toFixed(1) || "—",
  },
  {
    name: "WPA",
    selector: (row) => row.WPA,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.WPA?.toFixed(1) || "—",
  },
];

export const columnsSituational = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",

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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Season,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "PA",
    selector: (row) => row.PA_Overall,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "BA",
    selector: (row) => row.BA_Overall,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_Overall?.toFixed(3) || "—",
  },
  {
    name: "wOBA",
    selector: (row) => row.wOBA_Overall,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_Overall?.toFixed(3) || "—",
  },
  {
    name: "PA w/ RISP",
    selector: (row) => row.PA_RISP || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "BA w/ RISP",
    selector: (row) => row.BA_RISP,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_RISP?.toFixed(3) || "—",
  },
  {
    name: "wOBA w/ RISP",
    selector: (row) => row.wOBA_RISP,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_RISP?.toFixed(3) || "—",
  },
  {
    name: "LI+ PA",
    selector: (row) => row.PA_High_Leverage || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "LI+ BA",
    selector: (row) => row.BA_High_Leverage,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_High_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI+ wOBA",
    selector: (row) => row.wOBA_High_Leverage,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_High_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI- PA",
    selector: (row) => row.PA_Low_Leverage || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "LI- BA",
    selector: (row) => row.BA_Low_Leverage,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_Low_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI- wOBA",
    selector: (row) => row.wOBA_Low_Leverage,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_Low_Leverage?.toFixed(3) || "—",
  },
  {
    name: "Clutch",
    selector: (row) => row.Clutch,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Clutch?.toFixed(3) || "—",
  },
];

export const columnsSituationalPitcher = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",
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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Season,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "BF",
    selector: (row) => row.PA_Overall || 0,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "o-BA",
    selector: (row) => row.BA_Overall,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_Overall?.toFixed(3) || "—",
  },
  {
    name: "o-wOBA",
    selector: (row) => row.wOBA_Overall,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_Overall?.toFixed(3) || "—",
  },
  {
    name: "BF w/ RISP",
    selector: (row) => row.PA_RISP || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "o-BA w/ RISP",
    selector: (row) => row.BA_RISP,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_RISP?.toFixed(3) || "—",
  },
  {
    name: "o-wOBA w/ RISP",
    selector: (row) => row.wOBA_RISP,
    sortable: true,
    width: "7.75rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_RISP?.toFixed(3) || "—",
  },
  {
    name: "LI+ BF",
    selector: (row) => row.PA_High_Leverage || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "LI+ o-BA",
    selector: (row) => row.BA_High_Leverage,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_High_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI+ o-wOBA",
    selector: (row) => row.wOBA_High_Leverage,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_High_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI- BF",
    selector: (row) => row.PA_Low_Leverage || 0,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "LI- o-BA",
    selector: (row) => row.BA_Low_Leverage,
    sortable: true,
    width: "6.875rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.BA_Low_Leverage?.toFixed(3) || "—",
  },
  {
    name: "LI- o-wOBA",
    selector: (row) => row.wOBA_Low_Leverage,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wOBA_Low_Leverage?.toFixed(3) || "—",
  },
  {
    name: "Clutch",
    selector: (row) => row.Clutch,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Clutch?.toFixed(3) || "—",
  },
];

export const columnsBaserunning = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",

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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Year,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "SB",
    selector: (row) => row.SB,
    sortable: true,
    width: "4.375rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "CS",
    selector: (row) => row.CS,
    sortable: true,
    width: "4.375rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "SB%",
    selector: (row) => row["SB%"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SB%"]?.toFixed(1) + "%" || "—",
  },
  {
    name: "XBT",
    selector: (row) => row.XBT,
    sortable: true,
    width: "4.375rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "XBT%",
    selector: (row) => row.XBT / row.Opportunities,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) =>
      row.Opportunities
        ? (100 * (row.XBT / row.Opportunities)).toFixed(1) + "%"
        : "—",
  },
  {
    name: "Picked",
    selector: (row) => row.Picked,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.Picked || "0",
  },
  {
    name: "wSB",
    selector: (row) => row.wSB,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wSB?.toFixed(1) || "0.0",
  },
  {
    name: "wGDP",
    selector: (row) => row.wGDP,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wGDP?.toFixed(1) || "0.0",
  },
  {
    name: "wTEB",
    selector: (row) => row.wTEB,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row.wTEB?.toFixed(1) || "0.0",
  },
  {
    name: "BsR",
    selector: (row) => row.Baserunning,
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center font-bold",
    cell: (row) => row.Baserunning?.toFixed(1) || "—",
  },
];

export const columnsBatted = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",

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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Season,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "Count",
    selector: (row) => row.count,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "Oppo%",
    selector: (row) => row.oppo_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => (row.oppo_pct ? `${row.oppo_pct}% ` : "-"),
  },
  {
    name: "Middle%",
    selector: (row) => row.middle_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => `${row.middle_pct}%`,
  },
  {
    name: "Pull%",
    selector: (row) => row.pull_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => (row.pull_pct ? `${row.pull_pct}%` : "-"),
  },
  {
    name: "GB%",
    selector: (row) => row.gb_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => `${row.gb_pct}%`,
  },
  {
    name: "LD%",
    selector: (row) => row.ld_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => `${row.ld_pct}%`,
  },
  {
    name: "Pop%",
    selector: (row) => row.pop_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => `${row.pop_pct}%`,
  },
  {
    name: "FB%",
    selector: (row) => row.fb_pct,
    sortable: true,
    width: "5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => `${row.fb_pct}%`,
  },
  {
    name: "Pull Air%",
    selector: (row) => row.pull_air_pct,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => (row.pull_air_pct ? `${row.pull_air_pct}%` : "-"),
  },
  {
    name: "Backside GB%",
    selector: (row) => row.oppo_gb_pct,
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => (row.oppo_gb_pct ? `${row.oppo_gb_pct}%` : row.oppo_gb_pct),
  },
];

export const columnsSplits = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",

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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Season,
    sortable: true,
    width: "6.5rem",
  },
  {
    name: "PA",
    selector: (row) => row["PA_Overall"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "PA vs RHP",
    selector: (row) => row["PA_vs RHP"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["PA_vs RHP"] || 0,
  },
  {
    name: "PA vs LHP",
    selector: (row) => row["PA_vs LHP"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["PA_vs LHP"] || 0,
  },
  {
    name: "BA",
    selector: (row) => row["BA_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "BA vs RHP",
    selector: (row) => row["BA_vs RHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_vs RHP"]?.toFixed(3) || "—",
  },
  {
    name: "BA vs LHP",
    selector: (row) => row["BA_vs LHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_vs LHP"]?.toFixed(3) || "—",
  },
  {
    name: "OBP",
    selector: (row) => row["OBP_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "OBP vs RHP",
    selector: (row) => row["OBP_vs RHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_vs RHP"]?.toFixed(3) || "—",
  },
  {
    name: "OBP vs LHP",
    selector: (row) => row["OBP_vs LHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_vs LHP"]?.toFixed(3) || "—",
  },
  {
    name: "SLG",
    selector: (row) => row["SLG_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "SLG vs RHP",
    selector: (row) => row["SLG_vs RHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_vs RHP"]?.toFixed(3) || "—",
  },
  {
    name: "SLG vs LHP",
    selector: (row) => row["SLG_vs LHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_vs LHP"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA",
    selector: (row) => row["wOBA_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA vs RHP",
    selector: (row) => row["wOBA_vs RHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_vs RHP"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA vs LHP",
    selector: (row) => row["wOBA_vs LHP"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_vs LHP"]?.toFixed(3) || "—",
  },
];

export const columnsPF = [
  {
    name: "Team",
    selector: (row) => row.team_name,
    sortable: true,
    className: "px-4 py-3 font-medium",
    width: "10rem",
  },
  {
    name: "Basic",
    selector: (row) => roundTo(row.PF, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF} />,
  },
  {
    name: "1B",
    selector: (row) => roundTo(row.PF_singles, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_singles} />,
  },
  {
    name: "2B",
    selector: (row) => roundTo(row.PF_doubles, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_doubles} />,
  },
  {
    name: "3B",
    selector: (row) => roundTo(row.PF_triples, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_triples} />,
  },
  {
    name: "HR",
    selector: (row) => roundTo(row.PF_home_runs, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_home_runs} />,
  },
  {
    name: "BB",
    selector: (row) => roundTo(row.PF_walks, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_walks} />,
  },
  {
    name: "SO",
    selector: (row) => roundTo(row.PF_strikeouts, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_strikeouts} />,
  },
  {
    name: "IFFB",
    selector: (row) => roundTo(row.PF_infield_flys, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_infield_flys} />,
  },
  {
    name: "LD",
    selector: (row) => roundTo(row.PF_line_drives, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_line_drives} />,
  },
  {
    name: "GB",
    selector: (row) => roundTo(row.PF_ground_balls, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_ground_balls} />,
  },
  {
    name: "FIP",
    selector: (row) => roundTo(row.PF_FIP, 0),
    sortable: true,
    className: "px-4 py-3 text-center font-bold",
    width: "5rem",
    cell: (row) => <PFCell value={row.PF_FIP} />,
  },
];

export const getDataColumns = (dataType) => {
  switch (dataType) {
    default:
      return [];
    case "splits_pitcher":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",
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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Year",
          selector: (row) => row.Season,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "BF",
          selector: (row) => row["PA_Overall"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "vs RHH",
          selector: (row) => row["PA_vs RHH"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "vs LHH",
          selector: (row) => row["PA_vs LHH"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "BA",
          selector: (row) => row["BA_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "BA vs RHH",
          selector: (row) => row["BA_vs RHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_vs RHH"]?.toFixed(3) || "—",
        },
        {
          name: "BA vs LHH",
          selector: (row) => row["BA_vs LHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_vs LHH"]?.toFixed(3) || "—",
        },
        {
          name: "OBP",
          selector: (row) => row["OBP_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "OBP vs RHH",
          selector: (row) => row["OBP_vs RHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_vs RHH"]?.toFixed(3) || "—",
        },
        {
          name: "OBP vs LHH",
          selector: (row) => row["OBP_vs LHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_vs LHH"]?.toFixed(3) || "—",
        },
        {
          name: "SLG",
          selector: (row) => row["SLG_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "SLG vs RHH",
          selector: (row) => row["SLG_vs RHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_vs RHH"]?.toFixed(3) || "—",
        },
        {
          name: "SLG vs LHH",
          selector: (row) => row["SLG_vs LHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_vs LHH"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA",
          selector: (row) => row["wOBA_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA vs RHH",
          selector: (row) => row["wOBA_vs RHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_vs RHH"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA vs LHH",
          selector: (row) => row["wOBA_vs LHH"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_vs LHH"]?.toFixed(3) || "—",
        },
      ];
    case "situational_pitcher":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",
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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6rem",
        },
        {
          name: "Year",
          selector: (row) => row.Season,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "BF",
          selector: (row) => row.PA_Overall || 0,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "o-BA",
          selector: (row) => row.BA_Overall,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_Overall?.toFixed(3) || "—",
        },
        {
          name: "o-wOBA",
          selector: (row) => row.wOBA_Overall,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_Overall?.toFixed(3) || "—",
        },
        {
          name: "BF w/ RISP",
          selector: (row) => row.PA_RISP || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "o-BA w/ RISP",
          selector: (row) => row.BA_RISP,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_RISP?.toFixed(3) || "—",
        },
        {
          name: "o-wOBA w/ RISP",
          selector: (row) => row.wOBA_RISP,
          sortable: true,
          width: "7.75rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_RISP?.toFixed(3) || "—",
        },
        {
          name: "LI+ BF",
          selector: (row) => row.PA_High_Leverage || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "LI+ o-BA",
          selector: (row) => row.BA_High_Leverage,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_High_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI+ o-wOBA",
          selector: (row) => row.wOBA_High_Leverage,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_High_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI- BF",
          selector: (row) => row.PA_Low_Leverage || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "LI- o-BA",
          selector: (row) => row.BA_Low_Leverage,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_Low_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI- o-wOBA",
          selector: (row) => row.wOBA_Low_Leverage,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_Low_Leverage?.toFixed(3) || "—",
        },
        {
          name: "Clutch",
          selector: (row) => row.Clutch,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.Clutch?.toFixed(3) || "—",
        },
      ];
    case "splits":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",

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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "Year",
          selector: (row) => row.Season,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "PA",
          selector: (row) => row["PA_Overall"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "PA vs RHP",
          selector: (row) => row["PA_vs RHP"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["PA_vs RHP"] || 0,
        },
        {
          name: "PA vs LHP",
          selector: (row) => row["PA_vs LHP"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["PA_vs LHP"] || 0,
        },
        {
          name: "BA",
          selector: (row) => row["BA_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "BA vs RHP",
          selector: (row) => row["BA_vs RHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_vs RHP"]?.toFixed(3) || "—",
        },
        {
          name: "BA vs LHP",
          selector: (row) => row["BA_vs LHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["BA_vs LHP"]?.toFixed(3) || "—",
        },
        {
          name: "OBP",
          selector: (row) => row["OBP_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "OBP vs RHP",
          selector: (row) => row["OBP_vs RHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_vs RHP"]?.toFixed(3) || "—",
        },
        {
          name: "OBP vs LHP",
          selector: (row) => row["OBP_vs LHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["OBP_vs LHP"]?.toFixed(3) || "—",
        },
        {
          name: "SLG",
          selector: (row) => row["SLG_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "SLG vs RHP",
          selector: (row) => row["SLG_vs RHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_vs RHP"]?.toFixed(3) || "—",
        },
        {
          name: "SLG vs LHP",
          selector: (row) => row["SLG_vs LHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SLG_vs LHP"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA",
          selector: (row) => row["wOBA_Overall"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_Overall"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA vs RHP",
          selector: (row) => row["wOBA_vs RHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_vs RHP"]?.toFixed(3) || "—",
        },
        {
          name: "wOBA vs LHP",
          selector: (row) => row["wOBA_vs LHP"],
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["wOBA_vs LHP"]?.toFixed(3) || "—",
        },
      ];
    case "batted_ball":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",

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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "Year",
          selector: (row) => row.Season,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "Count",
          selector: (row) => row.count,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "Oppo%",
          selector: (row) => row.oppo_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => (row.oppo_pct ? `${roundTo(row.oppo_pct, 1)}%` : "—"),
        },
        {
          name: "Middle%",
          selector: (row) => row.middle_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) =>
            row.middle_pct ? `${roundTo(row.middle_pct, 1)}%` : "-",
        },
        {
          name: "Pull%",
          selector: (row) => row.pull_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => (row.pull_pct ? `${roundTo(row.pull_pct, 1)}%` : "—"),
        },
        {
          name: "GB%",
          selector: (row) => row.gb_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => `${roundTo(row.gb_pct, 1)}%`,
        },
        {
          name: "LD%",
          selector: (row) => row.ld_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => `${roundTo(row.ld_pct, 1)}%`,
        },
        {
          name: "Pop%",
          selector: (row) => row.pop_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => `${roundTo(row.pop_pct, 1)}%`,
        },
        {
          name: "FB%",
          selector: (row) => row.fb_pct,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => `${roundTo(row.fb_pct, 1)}%`,
        },
        {
          name: "Pull Air%",
          selector: (row) => row.pull_air_pct,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) =>
            row.pull_air_pct ? `${roundTo(row.pull_air_pct, 1)}%` : "—",
        },
        {
          name: "Backside GB%",
          selector: (row) => row.oppo_gb_pct,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) =>
            row.oppo_gb_pct ? `${roundTo(row.oppo_gb_pct, 1)}%` : "—",
        },
      ];
    case "situational":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",
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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "Year",
          selector: (row) => row.Season,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "PA",
          selector: (row) => row.PA_Overall,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "BA",
          selector: (row) => row.BA_Overall,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_Overall?.toFixed(3) || "—",
        },
        {
          name: "wOBA",
          selector: (row) => row.wOBA_Overall,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_Overall?.toFixed(3) || "—",
        },
        {
          name: "PA w/ RISP",
          selector: (row) => row.PA_RISP || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "BA w/ RISP",
          selector: (row) => row.BA_RISP,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_RISP?.toFixed(3) || "—",
        },
        {
          name: "wOBA w/ RISP",
          selector: (row) => row.wOBA_RISP,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_RISP?.toFixed(3) || "—",
        },
        {
          name: "LI+ PA",
          selector: (row) => row.PA_High_Leverage || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "LI+ BA",
          selector: (row) => row.BA_High_Leverage,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_High_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI+ wOBA",
          selector: (row) => row.wOBA_High_Leverage,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_High_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI- PA",
          selector: (row) => row.PA_Low_Leverage || 0,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "LI- BA",
          selector: (row) => row.BA_Low_Leverage,
          sortable: true,
          width: "6.875rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.BA_Low_Leverage?.toFixed(3) || "—",
        },
        {
          name: "LI- wOBA",
          selector: (row) => row.wOBA_Low_Leverage,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wOBA_Low_Leverage?.toFixed(3) || "—",
        },
        {
          name: "Clutch",
          selector: (row) => row.Clutch,
          sortable: true,
          width: "7.5rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.Clutch?.toFixed(3) || "—",
        },
      ];
    case "baserunning":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",
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
          selector: (row) => row.Team,
          cell: (row) => row.renderedTeam,
          sortable: true,
          width: "4rem",
        },
        {
          name: "Conference",
          selector: (row) => row.Conference,
          cell: (row) => row.renderedConference,
          sortable: true,
          width: "6.5rem",
        },
        {
          name: "Year",
          selector: (row) => row.Year,
          sortable: true,
          width: "5rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "SB",
          selector: (row) => row.SB,
          sortable: true,
          width: "4.375rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "CS",
          selector: (row) => row.CS,
          sortable: true,
          width: "4.375rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "SB%",
          selector: (row) => row["SB%"],
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row["SB%"]?.toFixed(1) + "%" || "—",
        },
        {
          name: "XBT",
          selector: (row) => row.XBT,
          sortable: true,
          width: "4.375rem",
          className: "px-3 py-2 text-xs text-center",
        },
        {
          name: "XBT%",
          selector: (row) => row.XBT / row.Opportunities,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) =>
            row.Opportunities
              ? (100 * (row.XBT / row.Opportunities)).toFixed(1) + "%"
              : "—",
        },
        {
          name: "Picked",
          selector: (row) => row.Picked,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.Picked || "0",
        },
        {
          name: "wSB",
          selector: (row) => row.wSB,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wSB?.toFixed(1) || "0.0",
        },
        {
          name: "wGDP",
          selector: (row) => row.wGDP,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wGDP?.toFixed(1) || "0.0",
        },
        {
          name: "wTEB",
          selector: (row) => row.wTEB,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center",
          cell: (row) => row.wTEB?.toFixed(1) || "0.0",
        },
        {
          name: "BsR",
          selector: (row) => row.Baserunning,
          sortable: true,
          width: "5.625rem",
          className: "px-3 py-2 text-xs text-center font-bold",
          cell: (row) => row.Baserunning?.toFixed(1) || "—",
        },
      ];
    case "player_hitting":
      return [
        {
          name: "Player",
          selector: (row) => row.Player,
          sortable: true,
          width: "9.375rem",
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
          name: "RE24",
          selector: (row) => roundTo(row["REA"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["WPA"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["WPA/LI"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"] || 0, 1),
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
          width: "9.375rem",
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
          name: "W",
          selector: (row) => row.W,
          sortable: true,
          width: "6rem",
        },
        {
          name: "L",
          selector: (row) => row.L,
          sortable: true,
          width: "6rem",
        },
        {
          name: "SV",
          selector: (row) => row.SV,
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
          selector: (row) => roundTo(row.gmLI || 0, 2),
          sortable: true,
          width: "5rem",
        },
        {
          name: "RE24",
          selector: (row) => roundTo(row["pREA"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA",
          selector: (row) => roundTo(row["pWPA"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "WPA/LI",
          selector: (row) => roundTo(row["pWPA/LI"] || 0, 1),
          sortable: true,
          width: "6rem",
        },
        {
          name: "Clutch",
          selector: (row) => roundTo(row["Clutch"] || 0, 1),
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
          name: "RE24",
          selector: (row) => roundTo(row["REA"], 1),
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
          name: "G",
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
          name: "W",
          selector: (row) => row.W,
          sortable: true,
          width: "6rem",
        },
        {
          name: "L",
          selector: (row) => row.L,
          sortable: true,
          width: "6rem",
        },
        {
          name: "SV",
          selector: (row) => row.SV,
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
          name: "RE24",
          selector: (row) => roundTo(row["pREA"], 1),
          sortable: true,
          width: "6rem",
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

export const columnsSplitsPitcher = [
  {
    name: "#",
    selector: (row) => row.rank,
    sortable: true,
    width: "4rem",
    className: "px-3 py-2 text-xs font-medium text-center",
  },
  {
    name: "Player",
    selector: (row) => row.Player,
    sortable: true,
    width: "9.375rem",
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
    selector: (row) => row.Team,
    cell: (row) => row.renderedTeam,
    sortable: true,
    width: "4rem",
  },
  {
    name: "Conference",
    selector: (row) => row.Conference,
    cell: (row) => row.renderedConference,
    sortable: true,
    width: "6rem",
  },
  {
    name: "Year",
    selector: (row) => row.Season,
    sortable: true,
    width: "6.5rem",
  },
  {
    name: "BF",
    selector: (row) => row["PA_Overall"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "vs RHH",
    selector: (row) => row["PA_vs RHH"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "vs LHH",
    selector: (row) => row["PA_vs LHH"],
    sortable: true,
    width: "5.625rem",
    className: "px-3 py-2 text-xs text-center",
  },
  {
    name: "BA",
    selector: (row) => row["BA_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "BA vs RHH",
    selector: (row) => row["BA_vs RHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_vs RHH"]?.toFixed(3) || "—",
  },
  {
    name: "BA vs LHH",
    selector: (row) => row["BA_vs LHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["BA_vs LHH"]?.toFixed(3) || "—",
  },
  {
    name: "OBP",
    selector: (row) => row["OBP_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "OBP vs RHH",
    selector: (row) => row["OBP_vs RHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_vs RHH"]?.toFixed(3) || "—",
  },
  {
    name: "OBP vs LHH",
    selector: (row) => row["OBP_vs LHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["OBP_vs LHH"]?.toFixed(3) || "—",
  },
  {
    name: "SLG",
    selector: (row) => row["SLG_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "SLG vs RHH",
    selector: (row) => row["SLG_vs RHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_vs RHH"]?.toFixed(3) || "—",
  },
  {
    name: "SLG vs LHH",
    selector: (row) => row["SLG_vs LHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["SLG_vs LHH"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA",
    selector: (row) => row["wOBA_Overall"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_Overall"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA vs RHH",
    selector: (row) => row["wOBA_vs RHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_vs RHH"]?.toFixed(3) || "—",
  },
  {
    name: "wOBA vs LHH",
    selector: (row) => row["wOBA_vs LHH"],
    sortable: true,
    width: "7.5rem",
    className: "px-3 py-2 text-xs text-center",
    cell: (row) => row["wOBA_vs LHH"]?.toFixed(3) || "—",
  },
];

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
