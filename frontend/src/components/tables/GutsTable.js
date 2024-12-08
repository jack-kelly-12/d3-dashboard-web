import React from "react";
import { BaseballTable } from "./BaseballTable";
import { columnsGuts } from "../../config/tableColumns";
import { roundTo } from "../../utils/mathUtils.js";

const GutsTable = ({ data }) => {
  const csvData = data.map((row) => ({
    ...row,
    wOBA: roundTo(row.wOBA, 3),
    wOBAScale: roundTo(row.wOBAScale, 3),
    wBB: roundTo(row.wBB, 3),
    wHBP: roundTo(row.wHBP, 3),
    w1B: roundTo(row.w1B, 3),
    w2B: roundTo(row.w2B, 3),
    w3B: roundTo(row.w3B, 3),
    wHR: roundTo(row.wHR, 3),
    runSB: roundTo(row.runSB, 3),
    runCS: roundTo(row.runCS, 3),
    runsPA: roundTo(row.runsPA, 3),
    runsWin: roundTo(row.runsWin, 3),
    cFIP: roundTo(row.cFIP, 3),
    runsOut: roundTo(row.runsOut, 3),
    csRate: roundTo(row.csRate * 100, 1),
  }));

  return (
    <BaseballTable
      title="League Constants"
      data={csvData}
      columns={columnsGuts}
      filename="guts_data.csv"
    />
  );
};

export default GutsTable;
