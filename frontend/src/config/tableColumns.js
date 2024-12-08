import { Rows } from "lucide-react";
import { PFCell } from "../components/cells/PFCell";
import { roundTo } from "../utils/mathUtils";

export const columnsGuts = [
  { name: "Year", selector: (row) => row.Year, width: "80px" },
  { name: "Division", selector: (row) => row.Division, width: "100px" },
  { name: "wOBA", selector: (row) => roundTo(row.wOBA, 3), width: "80px" },
  {
    name: "wOBA Scale",
    selector: (row) => roundTo(row.wOBAScale, 2),
    width: "120px",
  },
  { name: "wBB", selector: (row) => roundTo(row.wBB, 2), width: "80px" },
  { name: "wHBP", selector: (row) => roundTo(row.wHBP, 2), width: "80px" },
  { name: "w1B", selector: (row) => roundTo(row.w1B, 2), width: "80px" },
  { name: "w2B", selector: (row) => roundTo(row.w2B, 2), width: "80px" },
  { name: "w3B", selector: (row) => roundTo(row.w3B, 2), width: "80px" },
  { name: "wHR", selector: (row) => roundTo(row.wHR, 2), width: "80px" },
  { name: "wSB", selector: (row) => roundTo(row.runSB, 2), width: "80px" },
  { name: "wCS", selector: (row) => roundTo(row.runCS, 2), width: "80px" },
  { name: "R/PA", selector: (row) => roundTo(row.runsPA, 2), width: "80px" },
  { name: "R/W", selector: (row) => roundTo(row.runsWin, 2), width: "80px" },
  { name: "cFIP", selector: (row) => roundTo(row.cFIP, 2), width: "80px" },
  { name: "R/Out", selector: (row) => roundTo(row.runsOut, 2), width: "80px" },
  {
    name: "csRate",
    selector: (row) => roundTo(row.csRate, 1),
    width: "80px",
  },
];

export const columnsPF = [
  {
    name: "Team",
    selector: (row) => row.team_name,
    sortable: true,
    width: "20%",
  },
  {
    name: "Years",
    selector: (row) => row.Years,
    width: "10%",
  },
  {
    name: "Runs @ Home",
    selector: (row) => roundTo(row.H, 2),
    sortable: true,
    width: "15%",
  },
  {
    name: "Runs on Road",
    selector: (row) => roundTo(row.R, 2),
    sortable: true,
    width: "15%",
  },
  {
    name: "Home Games",
    selector: (row) => row.total_home_games,
    sortable: true,
    width: "15%",
  },
  {
    name: "Away Games",
    selector: (row) => row.total_away_games,
    sortable: true,
    width: "15%",
  },
  {
    name: "PF",
    selector: (row) => roundTo(row.PF, 0),
    sortable: true,
    width: "10%",
    cell: (row) => <PFCell value={row.PF} />,
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
        className="px-4 py-2 text-sm bg-[#007BA7] text-white rounded hover:bg-[#006990] transition-colors duration-200"
      >
        View
      </button>
    ),
    width: "10%",
    button: true,
  },
];
