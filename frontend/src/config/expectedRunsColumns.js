import { roundTo } from "../utils/mathUtils";

export function getExpectedRunsColumns() {
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
      name: "Bases",
      selector: (row) => row.bases,
      sortable: true,
      width: "8rem",
    },
    {
      name: "ERV 0 Outs",
      selector: (row) => roundTo(row.erv_0, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "ERV 1 Out",
      selector: (row) => roundTo(row.erv_1, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "ERV 2 Outs",
      selector: (row) => roundTo(row.erv_2, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "Prob 0 Outs",
      selector: (row) => roundTo(row.prob_0, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "Prob 1 Out",
      selector: (row) => roundTo(row.prob_1, 3),
      sortable: true,
      width: "8rem",
    },
    {
      name: "Prob 2 Outs",
      selector: (row) => roundTo(row.prob_2, 3),
      sortable: true,
      width: "8rem",
    },
  ];
}