import { roundTo } from "../utils/mathUtils";

export function getParkFactorsColumns() {
  return [
    {
      name: "Team",
      selector: (row) => row.team_name,
      sortable: true,
      width: "12rem",
    },
    {
      name: "Division",
      selector: (row) => row.division,
      sortable: true,
      width: "5rem",
    },
    {
      name: "Years",
      selector: (row) => {
        if (row.reg_factor >= 0.9) return "4+ yrs";
        if (row.reg_factor >= 0.8) return "3 yrs";
        if (row.reg_factor >= 0.7) return "2 yrs";
        return "1 yr";
      },
      sortable: true,
      width: "6rem",
    },
    {
      name: "PF",
      selector: (row) => roundTo(row.pf, 0),
      sortable: true,
      width: "6rem",
    },
    {
      name: "1B PF",
      selector: (row) => roundTo(row['1b_pf'], 0),
      sortable: true,
      width: "6rem",
    },
    {
      name: "2B PF",
      selector: (row) => roundTo(row['2b_pf'], 0),
      sortable: true,
      width: "6rem",
    },
    {
      name: "3B PF",
      selector: (row) => roundTo(row['3b_pf'], 0),
      sortable: true,
      width: "6rem",
    },
    {
        name: "HR PF",
        selector: (row) => roundTo(row['hr_pf'], 0),
        sortable: true,
        width: "6rem",
    },
    {
      name: "BB PF",
      selector: (row) => roundTo(row['bb_pf'], 0),
      sortable: true,
      width: "6rem",
    },
    {
      name: "HBP PF",
      selector: (row) => roundTo(row.hbp_pf, 0),
      sortable: true,
      width: "6rem",
    },
    {
      name: "Error PF",
      selector: (row) => roundTo(row.e_pf, 0),
      sortable: true,
      width: "6rem",
    },
  ];
}
