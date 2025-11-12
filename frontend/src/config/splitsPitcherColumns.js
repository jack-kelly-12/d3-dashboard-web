import { roundTo } from "../utils/mathUtils";

export const columnsSplitsPitchers = [
  { name: "#", selector: (row) => row.rank, sortable: true, width: "4rem" },
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
  { name: "Team", selector: (row) => row.team_name, sortable: true, width: "10rem" },
  { name: "Conference", selector: (row) => row.conference, sortable: true, width: "8rem" },
  { name: "Year", selector: (row) => row.year, sortable: true, width: "5rem" },
  { name: "BF", selector: (row) => row.pa_overall, sortable: true, width: "5rem" },
  { name: "o-wOBA", selector: (row) => row.woba_overall, sortable: true, width: "7rem", cell: (row) => row.woba_overall != null ? roundTo(Number(row.woba_overall), 3) : "—" },
  { name: "BF vs RHH", selector: (row) => row.pa_vs_rhh, sortable: true, width: "7rem" },
  { name: "BF vs LHH", selector: (row) => row.pa_vs_lhh, sortable: true, width: "7rem" },
  { name: "o-BA vs RHH", selector: (row) => row.ba_vs_rhh, sortable: true, width: "8rem", cell: (row) => row.ba_vs_rhh != null ? roundTo(Number(row.ba_vs_rhh), 3) : "—" },
  { name: "o-BA vs LHH", selector: (row) => row.ba_vs_lhh, sortable: true, width: "8rem", cell: (row) => row.ba_vs_lhh != null ? roundTo(Number(row.ba_vs_lhh), 3) : "—" },
  { name: "o-OBP", selector: (row) => row.ob_pct_overall, sortable: true, width: "7rem", cell: (row) => row.ob_pct_overall != null ? roundTo(Number(row.ob_pct_overall), 3) : "—" },
  { name: "o-SLG", selector: (row) => row.slg_pct_overall, sortable: true, width: "7rem", cell: (row) => row.slg_pct_overall != null ? roundTo(Number(row.slg_pct_overall), 3) : "—" },
];
