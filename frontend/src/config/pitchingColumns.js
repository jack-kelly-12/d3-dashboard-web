import React from "react";
import { Link } from "react-router-dom";
import { roundTo } from "../utils/mathUtils";
import { WARCell } from "../utils/colorUtils";

const createPercentageSortFn = (field) => (rowA, rowB) => {
  const a = parseFloat(String(rowA[field]).replace("%", "")) || 0;
  const b = parseFloat(String(rowB[field]).replace("%", "")) || 0;
  return a - b;
};

export function getPitchingColumns(forStatTable = false) {
  return [
    {
      name: "Player",
      selector: (row) => row.player_name,
      sortable: true,
      width: "9.375rem",
      cell: forStatTable ? undefined : (row) =>
        String(row.player_id || "").startsWith("d3d-") ? (
          <Link
            to={`/player/${row.player_id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {row.player_name || "Unknown Player"}
          </Link>
        ) : (
          <span className="font-medium">{row.player_name || "Unknown Player"}</span>
        ),
    },
    {
      name: "Team",
      width: "10rem",
      selector: (row) => row.team_name,
      sortable: true,
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
    { name: "Class", selector: (row) => row.class, sortable: true, width: "6rem" },
    { name: "Throws", selector: (row) => row.throws ? row.throws.charAt(0).toUpperCase() : '-', sortable: true, width: "5rem" },
    
    {
      name: "W",
      selector: (row) => row.w,
      sortable: true,
      width: "4rem",
    },
    {
      name: "L",
      selector: (row) => row.l,
      sortable: true,
      width: "4rem",
    },
    {
      name: "SV",
      selector: (row) => row.sv,
      sortable: true,
      width: "4rem",
    },
    {
      name: "GS",
      selector: (row) => row.gs,
      sortable: true,
      width: "4rem",
    },
    {
      name: "APP",
      selector: (row) => row.app,
      sortable: true,
      width: "5rem",
    },
    {
      name: "IP",
      selector: (row) => row.ip,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.ip, 1),
    },
    {
      name: "BF",
      selector: (row) => row.bf,
      sortable: true,
      width: "4rem",
    },
    
    {
      name: "H",
      selector: (row) => row.h,
      sortable: true,
      width: "4rem",
    },
    {
      name: "R",
      selector: (row) => row.r,
      sortable: true,
      width: "4rem",
    },
    {
      name: "ER",
      selector: (row) => row.er,
      sortable: true,
      width: "4rem",
    },
    {
      name: "BB",
      selector: (row) => row.bb,
      sortable: true,
      width: "4rem",
    },
    {
      name: "SO",
      selector: (row) => row.so,
      sortable: true,
      width: "4rem",
    },
    {
      name: "HBP",
      selector: (row) => row.hbp,
      sortable: true,
      width: "5rem",
    },
    {
      name: "HR",
      selector: (row) => row.hr_a,
      sortable: true,
      width: "4rem",
    },
    {
      name: "2B",
      selector: (row) => row["2b_a"],
      sortable: true,
      width: "4rem",
    },
    {
      name: "3B",
      selector: (row) => row["3b_a"],
      sortable: true,
      width: "4rem",
    },
    
    {
      name: "ERA",
      selector: (row) => row.era,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.era, 2),
    },
    {
      name: "RA9",
      selector: (row) => row.ra9,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.ra9, 2),
    },
    {
      name: "ERA+",
      selector: (row) => row["era+"],
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row["era+"], 0),
    },
    
    {
      name: "FIP",
      selector: (row) => row.fip,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.fip, 2),
    },
    {
      name: "xFIP",
      selector: (row) => row.xfip,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.xfip, 2),
    },
    
    {
      name: "K/9",
      selector: (row) => row.k9,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.k9, 2),
    },
    {
      name: "BB/9",
      selector: (row) => row.bb9,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.bb9, 2),
    },
    {
      name: "HR/9",
      selector: (row) => row.hr9,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.hr9, 2),
    },
    {
      name: "H/9",
      selector: (row) => row.h9,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.h9, 2),
    },
    
    {
      name: "K%",
      selector: (row) => row.k_pct,
      sortable: true,
      width: "5rem",
      cell: (row) => `${roundTo(row.k_pct, 1)}%`,
      sortFunction: createPercentageSortFn("k_pct"),
    },
    {
      name: "BB%",
      selector: (row) => row.bb_pct,
      sortable: true,
      width: "5rem",
      cell: (row) => `${roundTo(row.bb_pct, 1)}%`,
      sortFunction: createPercentageSortFn("bb_pct"),
    },
    {
      name: "K-BB%",
      selector: (row) => row.k_minus_bb_pct,
      sortable: true,
      width: "6rem",
      cell: (row) => `${roundTo(row.k_minus_bb_pct, 1)}%`,
      sortFunction: createPercentageSortFn("k_minus_bb_pct"),
    },
    {
      name: "HR/FB",
      selector: (row) => row.hr_div_fb,
      sortable: true,
      width: "6rem",
      cell: (row) => `${roundTo(row.hr_div_fb, 1)}%`,
      sortFunction: createPercentageSortFn("hr_div_fb"),
    },
    {
      name: "IR-A%",
      selector: (row) => row.ir_a_pct,
      sortable: true,
      width: "6rem",
      cell: (row) => `${roundTo(row.ir_a_pct, 1)}%`,
      sortFunction: createPercentageSortFn("ir_a_pct"),
    },
    
    {
      name: "GMLI",
      selector: (row) => row.gmli,
      sortable: true,
      width: "5rem",
      cell: (row) => roundTo(row.gmli, 2),
    },
    {
      name: "Clutch",
      selector: (row) => row.clutch,
      sortable: true,
      width: "6rem",
      cell: (row) => roundTo(row.clutch, 3),
    },
    {
      name: "pWPA",
      selector: (row) => row.pwpa,
      sortable: true,
      width: "6rem",
      cell: (row) => roundTo(row.pwpa, 3),
    },
    {
      name: "pWPA/LI",
      selector: (row) => row.pwpa_li,
      sortable: true,
      width: "7rem",
      cell: (row) => roundTo(row.pwpa_li, 3),
    },
    {
      name: "pREA",
      selector: (row) => row.prea,
      sortable: true,
      width: "6rem",
      cell: (row) => roundTo(row.prea, 3),
    },
    
    {
      name: "WAR",
      selector: (row) => row.war,
      sortable: true,
      width: "5rem",
      cell: (row) => <WARCell value={row.war} percentile={row.war_percentile} />,
    },
    {
      name: "SOS Adj WAR",
      selector: (row) => row.sos_adj_war,
      sortable: true,
      width: "8rem",
      cell: (row) => <WARCell value={row.sos_adj_war} percentile={row.war_percentile} />,
    },
    
    {
      name: "Pitches",
      selector: (row) => row.pitches,
      sortable: true,
      width: "6rem",
    },
    {
      name: "Inh Run",
      selector: (row) => row.inh_run,
      sortable: true,
      width: "6rem",
    },
    {
      name: "Inh Run Score",
      selector: (row) => row.inh_run_score,
      sortable: true,
      width: "8rem",
    },
    {
      name: "GO",
      selector: (row) => row.go,
      sortable: true,
      width: "4rem",
    },
    {
      name: "FO",
      selector: (row) => row.fo,
      sortable: true,
      width: "4rem",
    },
  ];
}
