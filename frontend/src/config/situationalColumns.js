import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";

export const columnsSituationalBatters = [
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
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem" },
  { name: "PA", selector: (row) => row.pa_overall, sortable: true, width: "5rem" },
  { name: "BA", selector: (row) => row.ba_overall, sortable: true, width: "6rem", cell: (row) => row.ba_overall != null ? roundTo(Number(row.ba_overall), 3) : "—" },
  { name: "wOBA", selector: (row) => row.woba_overall, sortable: true, width: "6.5rem", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "PA RISP", selector: (row) => row.pa_risp, sortable: true, width: "6.5rem" },
  { name: "BA RISP", selector: (row) => row.ba_risp, sortable: true, width: "6.5rem", cell: (row) => row.ba_risp != null ? roundTo(Number(row.ba_risp), 3) : "—" },
  { name: "wOBA RISP", selector: (row) => row.woba_risp, sortable: true, width: "7.5rem", cell: (row) => row.woba_risp != null ? roundTo(Number(row.woba_risp), 3) : "—" },
  { name: "PA LI+", selector: (row) => row.pa_high_leverage, sortable: true, width: "6.5rem" },
  { name: "BA LI+", selector: (row) => row.ba_high_leverage, sortable: true, width: "6.5rem", cell: (row) => row.ba_high_leverage != null ? roundTo(Number(row.ba_high_leverage), 3) : "—" },
  { name: "wOBA LI+", selector: (row) => row.woba_high_leverage, sortable: true, width: "7.5rem", cell: (row) => row.woba_high_leverage != null ? roundTo(Number(row.woba_high_leverage), 3) : "—" },
  { name: "PA LI-", selector: (row) => row.pa_low_leverage, sortable: true, width: "6.5rem" },
  { name: "BA LI-", selector: (row) => row.ba_low_leverage, sortable: true, width: "6.5rem", cell: (row) => row.ba_low_leverage != null ? roundTo(Number(row.ba_low_leverage), 3) : "—" },
  { name: "wOBA LI-", selector: (row) => row.woba_low_leverage, sortable: true, width: "7.5rem", cell: (row) => row.woba_low_leverage != null ? roundTo(Number(row.woba_low_leverage), 3) : "—" },
  { name: "RE24", selector: (row) => row.re24_overall, sortable: true, width: "6.5rem", cell: (row) => row.re24_overall != null ? roundTo(Number(row.re24_overall), 1) : "—" },
  { name: "Clutch", selector: (row) => row.clutch, sortable: true, width: "6rem", cell: (row) => row.clutch != null ? roundTo(Number(row.clutch), 1) : "—" },
];

export const columnsSituationalPitchers = [
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
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem" },
  { name: "BF", selector: (row) => row.pa_overall, sortable: true, width: "5rem" },
  { name: "o-BA", selector: (row) => row.ba_overall, sortable: true, width: "6rem", cell: (row) => row.ba_overall != null ? roundTo(Number(row.ba_overall), 3) : "—" },
  { name: "o-wOBA", selector: (row) => row.woba_overall, sortable: true, width: "7rem", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "BF RISP", selector: (row) => row.pa_risp, sortable: true, width: "6.5rem" },
  { name: "o-BA RISP", selector: (row) => row.ba_risp, sortable: true, width: "6.5rem", cell: (row) => row.ba_risp != null ? roundTo(Number(row.ba_risp), 3) : "—" },
  { name: "o-wOBA RISP", selector: (row) => row.woba_risp, sortable: true, width: "7.5rem", cell: (row) => row.woba_risp != null ? roundTo(Number(row.woba_risp), 3) : "—" },
  { name: "RE24", selector: (row) => row.re24_overall, sortable: true, width: "6.5rem", cell: (row) => row.re24_overall != null ? roundTo(Number(row.re24_overall), 1) : "—" },
  { name: "Clutch", selector: (row) => row.clutch, sortable: true, width: "6rem", cell: (row) => row.clutch != null ? roundTo(Number(row.clutch), 1) : "—" },
];

export const columnsSituationalBattersForStatTable = [
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem" },
  { name: "PA", selector: (row) => row.pa_overall, sortable: true, width: "5rem" },
  { name: "BA", selector: (row) => row.ba_overall, sortable: true, width: "6rem", cell: (row) => row.ba_overall != null ? roundTo(Number(row.ba_overall), 3) : "—" },
  { name: "wOBA", selector: (row) => row.woba_overall, sortable: true, width: "6.5rem", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "PA RISP", selector: (row) => row.pa_risp, sortable: true, width: "6.5rem" },
  { name: "BA RISP", selector: (row) => row.ba_risp, sortable: true, width: "6.5rem", cell: (row) => row.ba_risp != null ? roundTo(Number(row.ba_risp), 3) : "—" },
  { name: "wOBA RISP", selector: (row) => row.woba_risp, sortable: true, width: "7.5rem", cell: (row) => row.woba_risp != null ? roundTo(Number(row.woba_risp), 3) : "—" },
  { name: "PA LI+", selector: (row) => row.pa_high_leverage, sortable: true, width: "6.5rem" },
  { name: "BA LI+", selector: (row) => row.ba_high_leverage, sortable: true, width: "6.5rem", cell: (row) => row.ba_high_leverage != null ? roundTo(Number(row.ba_high_leverage), 3) : "—" },
  { name: "wOBA LI+", selector: (row) => row.woba_high_leverage, sortable: true, width: "7.5rem", cell: (row) => row.woba_high_leverage != null ? roundTo(Number(row.woba_high_leverage), 3) : "—" },
  { name: "PA LI-", selector: (row) => row.pa_low_leverage, sortable: true, width: "6.5rem" },
  { name: "BA LI-", selector: (row) => row.ba_low_leverage, sortable: true, width: "6.5rem", cell: (row) => row.ba_low_leverage != null ? roundTo(Number(row.ba_low_leverage), 3) : "—" },
  { name: "wOBA LI-", selector: (row) => row.woba_low_leverage, sortable: true, width: "7.5rem", cell: (row) => row.woba_low_leverage != null ? roundTo(Number(row.woba_low_leverage), 3) : "—" },
  { name: "RE24", selector: (row) => row.re24_overall, sortable: true, width: "6.5rem", cell: (row) => row.re24_overall != null ? roundTo(Number(row.re24_overall), 1) : "—" },
  { name: "Clutch", selector: (row) => row.clutch, sortable: true, width: "6rem", cell: (row) => row.clutch != null ? roundTo(Number(row.clutch), 1) : "—" },
];