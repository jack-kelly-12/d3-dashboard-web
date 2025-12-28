import React, { useMemo, useCallback, useState, useEffect } from "react";
import { BaseballTable } from "./BaseballTable";

const BASE_STATE_ORDER_MAP = {
  "_ _ _": 1, // empty bases
  "1 _ _": 2, // runner on first only
  "_ 2 _": 3, // runner on second only
  "_ _ 3": 4, // runner on third only
  "1 2 _": 5, // runners on first and second
  "1 _ 3": 6, // runners on first and third
  "_ 2 3": 7, // runners on second and third
  "1 2 3": 8, // bases loaded
};

const ExpectedRunsTable = ({ data, years, selectedYear, onYearChange }) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [displayMode, setDisplayMode] = useState("expected"); // "expected" or "probability"

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const getBaseStateOrder = useCallback((baseState) => {
    if (BASE_STATE_ORDER_MAP[baseState] !== undefined) {
      return BASE_STATE_ORDER_MAP[baseState];
    }

    // Normalize base state representation
    const has1B = baseState.includes("1") || baseState.includes("1B");
    const has2B = baseState.includes("2") || baseState.includes("2B");
    const has3B = baseState.includes("3") || baseState.includes("3B");

    if (has1B && has2B && has3B) return 8; // Bases loaded
    if (has1B && has2B && !has3B) return 5; // First and second
    if (has1B && !has2B && has3B) return 6; // First and third
    if (!has1B && has2B && has3B) return 7; // Second and third
    if (has1B && !has2B && !has3B) return 2; // First only
    if (!has1B && has2B && !has3B) return 3; // Second only
    if (!has1B && !has2B && has3B) return 4; // Third only
    return 1; // Empty bases
  }, []);

  const formatValue = useCallback(
    (value) => {
      const numValue = parseFloat(value);
      return displayMode === "expected"
        ? numValue.toFixed(3)
        : (numValue * 100).toFixed(1) + "%";
    },
    [displayMode]
  );

  const transformedData = useMemo(() => {
    return data
      .map((row) => {
        const prefix = displayMode === "expected" ? "ERV" : "Prob";
        return {
          year: row.Year,
          baseState: row.Bases,
          baseStateOrder: getBaseStateOrder(row.Bases),
          outs0: formatValue(row[`${prefix}_0`]),
          outs1: formatValue(row[`${prefix}_1`]),
          outs2: formatValue(row[`${prefix}_2`]),
        };
      })
      .sort((a, b) => a.baseStateOrder - b.baseStateOrder);
  }, [data, getBaseStateOrder, displayMode, formatValue]);

  const columnTitle = displayMode === "expected" ? "Exp. Runs" : "Prob.";

  const columns = useMemo(
    () => [
      {
        name: "Year",
        selector: (row) => row.year,
        sortable: true,
        width: isMobile ? "20%" : "15%",
      },
      {
        name: "Bases",
        selector: (row) => row.baseState,
        sortable: true,
        width: isMobile ? "20%" : "25%",
        cell: (row) => (
          <div
            className={`font-mono text-gray-700 ${isMobile ? "text-xs" : ""}`}
          >
            {row.baseState}
          </div>
        ),
        sortFunction: (rowA, rowB) => {
          return (
            getBaseStateOrder(rowA.baseState) -
            getBaseStateOrder(rowB.baseState)
          );
        },
      },
      {
        name: isMobile ? "0" : `0 Outs ${columnTitle}`,
        selector: (row) => row.outs0,
        sortable: true,
        width: isMobile ? "20%" : "20%",
        cell: (row) => (
          <div
            className={`font-mono text-black-600 font-medium ${
              isMobile ? "text-xs" : ""
            }`}
          >
            {row.outs0}
          </div>
        ),
      },
      {
        name: isMobile ? "1" : `1 Out ${columnTitle}`,
        selector: (row) => row.outs1,
        sortable: true,
        width: isMobile ? "20%" : "20%",
        cell: (row) => (
          <div
            className={`font-mono text-black-600 font-medium ${
              isMobile ? "text-xs" : ""
            }`}
          >
            {row.outs1}
          </div>
        ),
      },
      {
        name: isMobile ? "2" : `2 Outs ${columnTitle}`,
        selector: (row) => row.outs2,
        sortable: true,
        width: isMobile ? "20%" : "20%",
        cell: (row) => (
          <div
            className={`font-mono text-black-600 font-medium ${
              isMobile ? "text-xs" : ""
            }`}
          >
            {row.outs2}
          </div>
        ),
      },
    ],
    [getBaseStateOrder, isMobile, columnTitle]
  );

  return (
    <div className="w-full overflow-hidden">
      <div className={`p-2 md:p-4 border-b border-gray-200`}>
        <div
          className={`flex flex-col md:flex-row items-start md:items-center md:justify-between ${
            isMobile ? "space-y-2" : ""
          }`}
        >
          <h2 className="text-sm md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Run Expectancy
          </h2>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm text-gray-700">
                Display:
              </label>
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value)}
                className="px-2 py-1 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expected">Expected Runs</option>
                <option value="probability">Scoring Probability</option>
              </select>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <BaseballTable
          data={transformedData}
          columns={columns}
          filename={
            displayMode === "expected"
              ? "run_expectancy.csv"
              : "scoring_probability.csv"
          }
          responsive={true}
          dense={isMobile}
          fixedHeader={true}
          fixedHeaderScrollHeight={isMobile ? "400px" : "600px"}
        />
      </div>
    </div>
  );
};

export default ExpectedRunsTable;
