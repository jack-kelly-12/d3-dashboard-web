import { roundTo } from "../utils/mathUtils";

export function getGutsColumns() {
  return [
    {
      name: "Year",
      selector: (row) => row.year,
      sortable: true,
      width: "6rem",
    },
    {
      name: "Division",
      selector: (row) => row.division,
      sortable: true,
      width: "7.5rem",
    },
    {
      name: "wOBA",
      selector: (row) => roundTo(row.woba, 3),
      sortable: true,
      width: "6rem",
    },
    {
      name: "wOBA Scale",
      selector: (row) => roundTo(row.woba_scale, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "wBB",
      selector: (row) => roundTo(row.wbb, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "wHBP",
      selector: (row) => roundTo(row.whbp, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "w1B",
      selector: (row) => roundTo(row.w1b, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "w2B",
      selector: (row) => roundTo(row.w2b, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "w3B",
      selector: (row) => roundTo(row.w3b, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "wHR",
      selector: (row) => roundTo(row.whr, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "wSB",
      selector: (row) => roundTo(row.runs_sb, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "wCS",
      selector: (row) => roundTo(row.runs_cs, 3),
      sortable: true,
      width: "5.5rem",
    },
    {
      name: "R/PA",
      selector: (row) => roundTo(row.runs_pa, 3),
      sortable: true,
      width: "6rem",
    },
    {
      name: "R/W",
      selector: (row) => roundTo(row.runs_win, 1),
      sortable: true,
      width: "6rem",
    },
    {
      name: "cFIP",
      selector: (row) => roundTo(row.cfip, 3),
      sortable: true,
      width: "6rem",
    },
    {
      name: "R/Out",
      selector: (row) => roundTo(row.runs_out, 3),
      sortable: true,
      width: "6rem",
    },
    {
      name: "CS%",
      selector: (row) => roundTo((row.cs_rate || 0) * 100, 1) + "%",
      sortable: true,
      width: "5rem",
    },
  ];
}
