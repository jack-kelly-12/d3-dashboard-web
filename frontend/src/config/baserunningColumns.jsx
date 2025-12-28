import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";

export const columnsBaserunningLeaderboard = [
  { name: "#", selector: (row) => row.rank, sortable: true, width: "4rem", className: "px-3 py-2 text-xs font-medium text-center" },
  {
    name: "Player",
    selector: (row) => row.player_name,
    sortable: true,
    width: "10rem",
    cell: (row) =>
      String(row.player_id).substring(0, 4) === "d3d-" ? (
        <Link to={`/player/${row.player_id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">{row.player_name}</Link>
      ) : (
        <span className="font-medium">{row.player_name}</span>
      ),
  },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "SB", selector: (row) => row.sb, sortable: true, width: "5rem", className: "text-center" },
  { name: "CS", selector: (row) => row.cs, sortable: true, width: "5rem", className: "text-center" },
  { name: "SB%", selector: (row) => row.sb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.sb_pct != null ? `${roundTo(Number(row.sb_pct), 1)}%` : "—" },
  { name: "XBT", selector: (row) => row.ebt, sortable: true, width: "5rem", className: "text-center" },
  { name: "XBT%", selector: (row) => row.ebt / row.opportunities, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.xbt_pct != null ? `${roundTo(Number(row.xbt_pct), 1)}%` : "—" },
  { name: "Picked", selector: (row) => row.picked, sortable: true, width: "6rem", className: "text-center" },
  { name: "wSB", selector: (row) => row.wsb, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wsb != null ? roundTo(Number(row.wsb), 1) : "—" },
  { name: "wGDP", selector: (row) => row.wgdp, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wgdp != null ? roundTo(Number(row.wgdp), 1) : "—" },
  { name: "wTEB", selector: (row) => row.wteb, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wteb != null ? roundTo(Number(row.wteb), 1) : "—" },
  { name: "BsR", selector: (row) => row.baserunning, sortable: true, width: "6rem", className: "text-center font-bold", cell: (row) => row.baserunning != null ? roundTo(Number(row.baserunning), 1) : "—" },
];

export const columnsBaserunningLeaderboardForStatTable = [
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "SB", selector: (row) => row.sb, sortable: true, width: "5rem", className: "text-center" },
  { name: "CS", selector: (row) => row.cs, sortable: true, width: "5rem", className: "text-center" },
  { name: "SB%", selector: (row) => row.sb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.sb_pct != null ? `${roundTo(Number(row.sb_pct), 1)}%` : "—" },
  { name: "XBT", selector: (row) => row.ebt, sortable: true, width: "5rem", className: "text-center" },
  { name: "XBT%", selector: (row) => row.ebt / row.opportunities, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.xbt_pct != null ? `${roundTo(Number(row.xbt_pct), 1)}%` : "—" },
  { name: "Picked", selector: (row) => row.picked, sortable: true, width: "6rem", className: "text-center" },
  { name: "wSB", selector: (row) => row.wsb, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wsb != null ? roundTo(Number(row.wsb), 1) : "—" },
  { name: "wGDP", selector: (row) => row.wgdp, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wgdp != null ? roundTo(Number(row.wgdp), 1) : "—" },
  { name: "wTEB", selector: (row) => row.wteb, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.wteb != null ? roundTo(Number(row.wteb), 1) : "—" },
  { name: "BsR", selector: (row) => row.baserunning, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.baserunning != null ? roundTo(Number(row.baserunning), 1) : "—" },
];


