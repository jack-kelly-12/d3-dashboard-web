import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";

export const columnsSplitsBatters = [
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
  { name: "PA", selector: (row) => row.pa_overall, sortable: true, width: "5rem", className: "text-center" },
  { name: "wOBA", selector: (row) => row.woba_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "PA vs RHP", selector: (row) => row.pa_vs_rhp, sortable: true, width: "7rem", className: "text-center" },
  { name: "PA vs LHP", selector: (row) => row.pa_vs_lhp, sortable: true, width: "7rem", className: "text-center" },
  { name: "BA vs RHP", selector: (row) => row.ba_vs_rhp, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.ba_vs_rhp != null ? roundTo(Number(row.ba_vs_rhp), 3) : "—" },
  { name: "BA vs LHP", selector: (row) => row.ba_vs_lhp, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.ba_vs_lhp != null ? roundTo(Number(row.ba_vs_lhp), 3) : "—" },
  { name: "OBP", selector: (row) => row.ob_pct_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.ob_pct_overall != null ? roundTo(Number(row.ob_pct_overall), 3) : "—" },
  { name: "SLG", selector: (row) => row.slg_pct_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.slg_pct_overall != null ? roundTo(Number(row.slg_pct_overall), 3) : "—" },
];

export const columnsSplitsPitchers = [
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
  { name: "BF", selector: (row) => row.pa_overall, sortable: true, width: "5rem", className: "text-center" },
  { name: "o-wOBA", selector: (row) => row.woba_overall, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "BF vs RHH", selector: (row) => row.pa_vs_rhh, sortable: true, width: "7rem", className: "text-center" },
  { name: "BF vs LHH", selector: (row) => row.pa_vs_lhh, sortable: true, width: "7rem", className: "text-center" },
  { name: "o-BA vs RHH", selector: (row) => row.ba_vs_rhh, sortable: true, width: "8rem", className: "text-center", cell: (row) => row.ba_vs_rhh != null ? roundTo(Number(row.ba_vs_rhh), 3) : "—" },
  { name: "o-BA vs LHH", selector: (row) => row.ba_vs_lhh, sortable: true, width: "8rem", className: "text-center", cell: (row) => row.ba_vs_lhh != null ? roundTo(Number(row.ba_vs_lhh), 3) : "—" },
  { name: "o-OBP", selector: (row) => row.ob_pct_overall, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.ob_pct_overall != null ? roundTo(Number(row.ob_pct_overall), 3) : "—" },
  { name: "o-SLG", selector: (row) => row.slg_pct_overall, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.slg_pct_overall != null ? roundTo(Number(row.slg_pct_overall), 3) : "—" },
];

export const columnsSplitsBattersForStatTable = [
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "PA", selector: (row) => row.pa_overall, sortable: true, width: "5rem", className: "text-center" },
  { name: "wOBA", selector: (row) => row.woba_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "PA vs RHP", selector: (row) => row.pa_vs_rhp, sortable: true, width: "7rem", className: "text-center" },
  { name: "PA vs LHP", selector: (row) => row.pa_vs_lhp, sortable: true, width: "7rem", className: "text-center" },
  { name: "BA vs RHP", selector: (row) => row.ba_vs_rhp, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.ba_vs_rhp != null ? roundTo(Number(row.ba_vs_rhp), 3) : "—" },
  { name: "BA vs LHP", selector: (row) => row.ba_vs_lhp, sortable: true, width: "7rem", className: "text-center", cell: (row) => row.ba_vs_lhp != null ? roundTo(Number(row.ba_vs_lhp), 3) : "—" },
  { name: "OBP", selector: (row) => row.ob_pct_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.ob_pct_overall != null ? roundTo(Number(row.ob_pct_overall), 3) : "—" },
  { name: "SLG", selector: (row) => row.slg_pct_overall, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => row.slg_pct_overall != null ? roundTo(Number(row.slg_pct_overall), 3) : "—" },
];