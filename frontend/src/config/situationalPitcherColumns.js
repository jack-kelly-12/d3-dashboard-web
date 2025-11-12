import { roundTo } from "../utils/mathUtils";

export const columnsSituationalPitchers = [
  { name: "Player", selector: (row) => row.player_name, sortable: true, width: "10rem" },
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
