import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";
import { WARCell } from "../utils/colorUtils";

export const columnsValueLeaderboard = [
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
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "12rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "10rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem", className: "text-center" },
  { name: "PA", selector: (row) => row.pa, sortable: true, width: "5rem", className: "text-center" },
  { name: "IP", selector: (row) => row.ip, sortable: true, width: "5rem", className: "text-center", cell: (row) => (row.ip != null ? Number(row.ip).toFixed(1) : "—") },

  { name: "bWAR", selector: (row) => row.batting_war, sortable: true, width: "6rem", className: "text-center", cell: (row) => <WARCell value={row.batting_war} percentile={row.batting_war_percentile} /> },
  { name: "pWAR", selector: (row) => row.pitching_war, sortable: true, width: "6rem", className: "text-center", cell: (row) => <WARCell value={row.pitching_war} percentile={row.pitching_war_percentile} /> },
  { name: "WAR", selector: (row) => row.total_war, sortable: true, width: "6rem", className: "text-center font-bold", cell: (row) => <WARCell value={row.total_war} percentile={row.total_war_percentile} bold={true} /> },

  { name: "bWPA", selector: (row) => row.batting_wpa, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.batting_wpa != null ? roundTo(Number(row.batting_wpa), 1) : "—") },
  { name: "pWPA", selector: (row) => row.pitching_wpa, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.pitching_wpa != null ? roundTo(Number(row.pitching_wpa), 1) : "—") },
  { name: "WPA", selector: (row) => row.total_wpa, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.total_wpa != null ? roundTo(Number(row.total_wpa), 1) : "—") },

  { name: "bWPA/LI", selector: (row) => row.batting_wpa_li, sortable: true, width: "7rem", className: "text-center", cell: (row) => (row.batting_wpa_li != null ? roundTo(Number(row.batting_wpa_li), 1) : "—") },
  { name: "pWPA/LI", selector: (row) => row.pitching_wpa_li, sortable: true, width: "7rem", className: "text-center", cell: (row) => (row.pitching_wpa_li != null ? roundTo(Number(row.pitching_wpa_li), 1) : "—") },
  { name: "WPA/LI", selector: (row) => row.total_wpa_li, sortable: true, width: "7rem", className: "text-center", cell: (row) => (row.total_wpa_li != null ? roundTo(Number(row.total_wpa_li), 1) : "—") },

  { name: "bRE24", selector: (row) => row.batting_rea, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => (row.batting_rea != null ? roundTo(Number(row.batting_rea), 1) : "—") },
  { name: "pRE24", selector: (row) => row.pitching_rea, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => (row.pitching_rea != null ? roundTo(Number(row.pitching_rea), 1) : "—") },
  { name: "RE24", selector: (row) => row.total_rea, sortable: true, width: "6.5rem", className: "text-center", cell: (row) => (row.total_rea != null ? roundTo(Number(row.total_rea), 1) : "—") },

  { name: "bClutch", selector: (row) => row.batting_clutch, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.batting_clutch != null ? roundTo(Number(row.batting_clutch), 1) : "—") },
  { name: "pClutch", selector: (row) => row.pitching_clutch, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.pitching_clutch != null ? roundTo(Number(row.pitching_clutch), 1) : "—") },
  { name: "Clutch", selector: (row) => row.total_clutch, sortable: true, width: "6rem", className: "text-center", cell: (row) => (row.total_clutch != null ? roundTo(Number(row.total_clutch), 1) : "—") },
];





