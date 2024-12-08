import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { roundTo } from "../../utils/mathUtils";
import { WARCell } from "../../utils/colorUtils";

const StatTable = ({ stats, type }) => {
  const getBattingColumns = () => [
    {
      name: "Team",
      selector: (row) => row.Team,
      sortable: true,
      width: "150px",
    },
    {
      name: "Conference",
      selector: (row) => row.Conference,
      sortable: true,
      width: "150px",
    },
    {
      name: "Season",
      selector: (row) => row.Season,
      sortable: true,
      width: "100px",
    },
    {
      name: "Year",
      selector: (row) => row.Yr,
      sortable: true,
      width: "80px",
    },
    {
      name: "GP",
      selector: (row) => row.GP,
      sortable: true,
      width: "80px",
    },
    {
      name: "AB",
      selector: (row) => row.AB,
      sortable: true,
      width: "80px",
    },
    {
      name: "PA",
      selector: (row) => row.PA,
      sortable: true,
      width: "80px",
    },
    {
      name: "H",
      selector: (row) => row.H,
      sortable: true,
      width: "80px",
    },
    {
      name: "2B",
      selector: (row) => row["2B"],
      sortable: true,
      width: "80px",
    },
    {
      name: "3B",
      selector: (row) => row["3B"],
      sortable: true,
      width: "80px",
    },
    {
      name: "HR",
      selector: (row) => row.HR,
      sortable: true,
      width: "80px",
    },
    {
      name: "R",
      selector: (row) => row.R,
      sortable: true,
      width: "80px",
    },
    {
      name: "SB",
      selector: (row) => row.SB,
      sortable: true,
      width: "80px",
    },
    {
      name: "BB",
      selector: (row) => row.BB,
      sortable: true,
      width: "80px",
    },
    {
      name: "HBP",
      selector: (row) => row.HBP,
      sortable: true,
      width: "80px",
    },
    {
      name: "Picked",
      selector: (row) => row.Picked,
      sortable: true,
      width: "90px",
    },
    {
      name: "Sac. Bunt",
      selector: (row) => row.Sac,
      sortable: true,
      width: "100px",
    },
    {
      name: "BA",
      selector: (row) => roundTo(row.BA, 3),
      sortable: true,
      width: "80px",
    },
    {
      name: "SLG",
      selector: (row) => roundTo(row.SlgPct, 3),
      sortable: true,
      width: "80px",
    },
    {
      name: "ISO",
      selector: (row) => roundTo(row.ISO, 3),
      sortable: true,
      width: "80px",
    },
    {
      name: "OBP",
      selector: (row) => roundTo(row.OBPct, 3),
      sortable: true,
      width: "80px",
    },
    {
      name: "wOBA",
      selector: (row) => roundTo(row.wOBA, 3),
      sortable: true,
      width: "80px",
    },
    {
      name: "K%",
      selector: (row) => roundTo(row["K%"], 1) + "%",
      sortable: true,
      width: "80px",
    },
    {
      name: "BB%",
      selector: (row) => roundTo(row["BB%"], 1) + "%",
      sortable: true,
      width: "80px",
    },
    {
      name: "SB%",
      selector: (row) => roundTo(row["SB%"], 1) + "%",
      sortable: true,
      width: "80px",
    },
    {
      name: "wRC+",
      selector: (row) => roundTo(row["wRC+"], 0),
      sortable: true,
      width: "80px",
    },
    {
      name: "OPS+",
      selector: (row) => roundTo(row["OPS+"], 0),
      sortable: true,
      width: "80px",
    },
    {
      name: "Batting",
      selector: (row) => roundTo(row["Batting"], 1),
      sortable: true,
      width: "100px",
    },
    {
      name: "Base Run",
      selector: (row) => roundTo(row["Baserunning"], 1),
      sortable: true,
      width: "100px",
    },
    {
      name: "Adj",
      selector: (row) => roundTo(row["Adjustment"], 1),
      sortable: true,
      width: "100px",
    },
    {
      name: "WAR",
      selector: (row) => roundTo(row.WAR, 1),
      sortable: true,
      width: "80px",
      cell: (row) => <WARCell value={row.WAR} />,
    },
  ];

  const getPitchingColumns = () => [
    {
      name: "Team",
      selector: (row) => row.Team,
      sortable: true,
      width: "150px",
    },
    {
      name: "Conference",
      selector: (row) => row.Conference,
      sortable: true,
      width: "150px",
    },
    {
      name: "Season",
      selector: (row) => row.Season,
      sortable: true,
      width: "90px",
    },
    {
      name: "Year",
      selector: (row) => row.Yr,
      sortable: true,
      width: "80px",
    },
    {
      name: "App",
      selector: (row) => row.App,
      sortable: true,
      width: "80px",
    },
    {
      name: "GS",
      selector: (row) => row.GS,
      sortable: true,
      width: "80px",
    },
    {
      name: "IP",
      selector: (row) => row.IP,
      sortable: true,
      width: "80px",
    },
    {
      name: "Pitches",
      selector: (row) => row.Pitches,
      sortable: true,
      width: "100px",
    },
    {
      name: "H",
      selector: (row) => row.H,
      sortable: true,
      width: "80px",
    },
    {
      name: "2B",
      selector: (row) => row["2B-A"],
      sortable: true,
      width: "80px",
    },
    {
      name: "3B",
      selector: (row) => row["3B-A"],
      sortable: true,
      width: "80px",
    },
    {
      name: "HR",
      selector: (row) => row["HR-A"],
      sortable: true,
      width: "80px",
    },
    {
      name: "R",
      selector: (row) => row.R,
      sortable: true,
      width: "80px",
    },
    {
      name: "ER",
      selector: (row) => row.ER,
      sortable: true,
      width: "80px",
    },
    {
      name: "HB",
      selector: (row) => row.HB,
      sortable: true,
      width: "80px",
    },
    {
      name: "BB",
      selector: (row) => row.BB,
      sortable: true,
      width: "80px",
    },
    {
      name: "ERA",
      selector: (row) => roundTo(row.ERA, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "FIP",
      selector: (row) => roundTo(row.FIP, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "xFIP",
      selector: (row) => roundTo(row.xFIP, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "ERA+",
      selector: (row) => roundTo(row["ERA+"], 0),
      sortable: true,
      width: "80px",
    },
    {
      name: "LI",
      selector: (row) => roundTo(row.gmLI, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "RA9",
      selector: (row) => roundTo(row.RA9, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "K/9",
      selector: (row) => roundTo(row.K9, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "BB/9",
      selector: (row) => roundTo(row.BB9, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "H/9",
      selector: (row) => roundTo(row.H9, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "HR/9",
      selector: (row) => roundTo(row.HR9, 2),
      sortable: true,
      width: "80px",
    },
    {
      name: "K%",
      selector: (row) => roundTo(row["K%"], 1) + "%",
      sortable: true,
      width: "80px",
    },
    {
      name: "BB%",
      selector: (row) => roundTo(row["BB%"], 1) + "%",
      sortable: true,
      width: "80px",
    },
    {
      name: "K-BB%",
      selector: (row) => roundTo(row["K-BB%"], 1) + "%",
      sortable: true,
      width: "90px",
    },
    {
      name: "HR/FB",
      selector: (row) => roundTo(row["HR/FB"], 1) + "%",
      sortable: true,
      width: "90px",
    },
    {
      name: "IR-A%",
      selector: (row) => roundTo(row["IR-A%"], 1) + "%",
      sortable: true,
      width: "90px",
    },
    {
      name: "WAR",
      selector: (row) => roundTo(row.WAR, 1),
      sortable: true,
      width: "80px",
      cell: (row) => <WARCell value={row.WAR} />,
    },
  ];

  return (
    <BaseballTable
      data={stats}
      columns={type === "batting" ? getBattingColumns() : getPitchingColumns()}
      filename={`player_${type}_stats.csv`}
    />
  );
};

export default StatTable;
