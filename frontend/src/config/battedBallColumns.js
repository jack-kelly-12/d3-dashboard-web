import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";

export const columnsBattedBall = [
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
  { name: "Bats", selector: (row) => row.batter_hand?.charAt(0).toUpperCase() ?? "—", sortable: true, width: "5rem", className: "text-center" },
  { name: "PA", selector: (row) => row.count, sortable: true, width: "5rem", className: "text-center" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "Count", selector: (row) => row.count, sortable: true, width: "5rem", className: "text-center" },
  { name: "Oppo%", selector: (row) => row.oppo_pct ? `${roundTo(Number(row.oppo_pct), 1)}%` : "—", sortable: true, width: "6rem", className: "text-center" },
  { name: "Middle%", selector: (row) => row.middle_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.middle_pct != null ? `${roundTo(Number(row.middle_pct), 1)}%` : "—" },
  { name: "Pull%", selector: (row) => row.pull_pct ? `${roundTo(Number(row.pull_pct), 1)}%` : "—", sortable: true, width: "6rem", className: "text-center" },
  { name: "GB%", selector: (row) => row.gb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.gb_pct != null ? `${roundTo(Number(row.gb_pct), 1)}%` : "—" },
  { name: "LD%", selector: (row) => row.ld_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.ld_pct != null ? `${roundTo(Number(row.ld_pct), 1)}%` : "—" },
  { name: "Pop%", selector: (row) => row.pop_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.pop_pct != null ? `${roundTo(Number(row.pop_pct), 1)}%` : "—" },
  { name: "FB%", selector: (row) => row.fb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.fb_pct != null ? `${roundTo(Number(row.fb_pct), 1)}%` : "—" },
  { name: "Pull Air%", selector: (row) => row.pull_air_pct ? `${roundTo(Number(row.pull_air_pct), 1)}%` : "—", sortable: true, width: "7rem", className: "text-center" },
  { name: "Backside GB%", selector: (row) => row.oppo_gb_pct ? `${roundTo(Number(row.oppo_gb_pct), 1)}%` : "—", sortable: true, width: "8rem", className: "text-center" },
];

export const columnsBattedBallForStatTable = [
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "Count", selector: (row) => row.count, sortable: true, width: "5rem", className: "text-center" },
  { name: "Oppo%", selector: (row) => row.oppo_pct ? `${roundTo(Number(row.oppo_pct), 1)}%` : "—", sortable: true, width: "6rem", className: "text-center" },
  { name: "Middle%", selector: (row) => row.middle_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.middle_pct != null ? `${roundTo(Number(row.middle_pct), 1)}%` : "—" },
  { name: "Pull%", selector: (row) => row.pull_pct ? `${roundTo(Number(row.pull_pct), 1)}%` : "—", sortable: true, width: "6rem", className: "text-center" },
  { name: "GB%", selector: (row) => row.gb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.gb_pct != null ? `${roundTo(Number(row.gb_pct), 1)}%` : "—" },
  { name: "LD%", selector: (row) => row.ld_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.ld_pct != null ? `${roundTo(Number(row.ld_pct), 1)}%` : "—" },
  { name: "Pop%", selector: (row) => row.pop_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.pop_pct != null ? `${roundTo(Number(row.pop_pct), 1)}%` : "—" },
  { name: "FB%", selector: (row) => row.fb_pct, sortable: true, width: "6rem", className: "text-center", cell: (row) => row.fb_pct != null ? `${roundTo(Number(row.fb_pct), 1)}%` : "—" },
  { name: "Pull Air%", selector: (row) => row.pull_air_pct ? `${roundTo(Number(row.pull_air_pct), 1)}%` : "—", sortable: true, width: "7rem", className: "text-center" },
  { name: "Backside GB%", selector: (row) => row.oppo_gb_pct ? `${roundTo(Number(row.oppo_gb_pct), 1)}%` : "—", sortable: true, width: "8rem", className: "text-center" },
];


