import React from "react";
import { roundTo } from "../utils/mathUtils";
import { WARCell } from "../utils/colorUtils";

const createPercentageSortFn = (field) => (rowA, rowB) => {
  const a = parseFloat(String(rowA[field]).replace("%", "")) || 0;
  const b = parseFloat(String(rowB[field]).replace("%", "")) || 0;
  return a - b;
};

export function getTeamBattingColumns() {
  return [
    {
      name: "Team",
      selector: (row) => row.team_name,
      sortable: true,
      width: "10rem",
      cell: (row) => (
        <span className="font-medium">{row.team_name || "Unknown Team"}</span>
      ),
    },
    {
      name: "Conference",
      selector: (row) => row.conference,
      sortable: true,
      width: "8rem",
    },
    {
      name: "Year",
      selector: (row) => row.year,
      sortable: true,
      width: "5rem",
    },
    { name: "Division", selector: (row) => row.division, sortable: true, width: "6rem" },
    
    { name: "GP", selector: (row) => row.gp, sortable: true, width: "5rem" },
    { name: "GS", selector: (row) => row.gs, sortable: true, width: "5rem" },
    { name: "PA", selector: (row) => row.pa, sortable: true, width: "5rem" },
    { name: "AB", selector: (row) => row.ab, sortable: true, width: "5rem" },
    
    { name: "H", selector: (row) => row.h, sortable: true, width: "5rem" },
    { name: "2B", selector: (row) => row["2b"], sortable: true, width: "5rem" },
    { name: "3B", selector: (row) => row["3b"], sortable: true, width: "5rem" },
    { name: "HR", selector: (row) => row.hr, sortable: true, width: "5rem" },
    { name: "R", selector: (row) => row.r, sortable: true, width: "5rem" },
    { name: "RBI", selector: (row) => row.rbi || 0, sortable: true, width: "5rem" },
    
    { name: "SB", selector: (row) => row.sb, sortable: true, width: "5rem" },
    { name: "CS", selector: (row) => row.cs || 0, sortable: true, width: "5rem" },
    {
      name: "SB%",
      selector: (row) => roundTo(row.sb_pct, 1) + "%",
      sortable: true,
      width: "5rem",
      sortFunction: createPercentageSortFn("sb_pct"),
    },
    
    { name: "BB", selector: (row) => row.bb, sortable: true, width: "5rem" },
    { name: "HBP", selector: (row) => row.hbp, sortable: true, width: "5rem" },
    { name: "Picked", selector: (row) => row.picked, sortable: true, width: "6rem" },
    { name: "Sac", selector: (row) => row.sac, sortable: true, width: "5rem" },
    { name: "SF", selector: (row) => row.sf, sortable: true, width: "5rem" },
    { name: "SO", selector: (row) => row.k || 0, sortable: true, width: "5rem" },
    
    { name: "BA", selector: (row) => roundTo(row.ba, 3), sortable: true, width: "5rem" },
    { name: "OBP", selector: (row) => roundTo(row.ob_pct, 3), sortable: true, width: "5rem" },
    { name: "SLG", selector: (row) => roundTo(row.slg_pct, 3), sortable: true, width: "5rem" },
    { name: "OPS", selector: (row) => roundTo(row.ob_pct + row.slg_pct, 3), sortable: true, width: "5rem" },
    { name: "ISO", selector: (row) => roundTo(row.iso, 3), sortable: true, width: "5rem" },
    { name: "wOBA", selector: (row) => roundTo(row.woba, 3), sortable: true, width: "5rem" },
    
    {
      name: "K%",
      selector: (row) => roundTo(row.k_pct, 1) + "%",
      sortable: true,
      width: "5rem",
      sortFunction: createPercentageSortFn("k_pct"),
    },
    {
      name: "BB%",
      selector: (row) => roundTo(row.bb_pct, 1) + "%",
      sortable: true,
      width: "5rem",
      sortFunction: createPercentageSortFn("bb_pct"),
    },
    
    { name: "wRC", selector: (row) => roundTo(row.wrc, 1), sortable: true, width: "6rem" },
    { name: "wRC+", selector: (row) => roundTo(row.wrc_plus, 0), sortable: true, width: "5rem" },
    { name: "OPS+", selector: (row) => roundTo(row.ops_plus, 0), sortable: true, width: "5rem" },
    
    { name: "RE24", selector: (row) => roundTo(row.rea || 0, 1), sortable: true, width: "6rem" },
    { name: "WPA", selector: (row) => roundTo(row.wpa || 0, 1), sortable: true, width: "6rem" },
    { name: "WPA/LI", selector: (row) => roundTo(row.wpa_li || 0, 1), sortable: true, width: "6rem" },
    { name: "Clutch", selector: (row) => roundTo(row.clutch || 0, 1), sortable: true, width: "6rem" },
    
    { name: "Batting", selector: (row) => roundTo(row.batting, 1), sortable: true, width: "6rem" },
    { name: "Base Run", selector: (row) => roundTo(row.baserunning, 1), sortable: true, width: "6rem" },
    { name: "Pos. Adj", selector: (row) => roundTo(row.adjustment, 1), sortable: true, width: "6rem" },
    {
      name: "WAR",
      selector: (row) => roundTo(row.war, 1),
      sortable: true,
      width: "5rem",
      cell: (row) => <WARCell value={row.war} percentile={row.war_percentile} isTeam={true} />,
    },
    
    { name: "SOS-Adj WAR", selector: (row) => roundTo(row.sos_adj_war || 0, 3), sortable: true, width: "7rem", cell: (row) => <WARCell value={row.sos_adj_war} percentile={row.war_percentile} isTeam={true} />, },
    { name: "EBT", selector: (row) => roundTo(row.ebt || 0, 1), sortable: true, width: "6rem" },
    { name: "wGDP", selector: (row) => roundTo(row.wgdp || 0, 1), sortable: true, width: "6rem" },
    { name: "wSB", selector: (row) => roundTo(row.wsb || 0, 1), sortable: true, width: "6rem" },
    { name: "wTEB", selector: (row) => roundTo(row.wteb || 0, 1), sortable: true, width: "6rem" },
    { name: "GDP", selector: (row) => roundTo(row.gdp || 0, 1), sortable: true, width: "5rem" },
    { name: "GDP Opps", selector: (row) => row.gdp_opps || 0, sortable: true, width: "7rem" },
    { name: "Outs OB", selector: (row) => row.outs_ob || 0, sortable: true, width: "6rem" },
    { name: "R/PA", selector: (row) => roundTo(row.r_div_pa || 0, 3), sortable: true, width: "6rem" },
  ];
}




