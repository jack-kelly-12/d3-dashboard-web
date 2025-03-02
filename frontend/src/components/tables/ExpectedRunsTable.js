import React, { useMemo, useCallback, useState } from "react";
import { BaseballTable } from "./BaseballTable";

// Define the base state order map outside the component to avoid dependencies
const BASE_STATE_ORDER_MAP = {
  "_ _ _": 1, // empty bases
  "1 _ _": 2, // runner on first only
  "_ 2 _": 3, // runner on second only
  "_ _ 3": 4, // runner on third only
  "1B 2B _": 5, // runners on first and second
  "1 _ 3": 6, // runners on first and third
  "_ 2 3": 7, // runners on second and third
  "1B 2B 3B": 8, // bases loaded
};

const ExpectedRunsTable = ({ data, years, selectedYear, onYearChange }) => {
  // Add responsive state
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // Add resize listener on mount
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine if we're in mobile view
  const isMobile = windowWidth < 768;

  // Use useCallback to memoize the function
  const getBaseStateOrder = useCallback((baseState) => {
    // Direct match
    if (BASE_STATE_ORDER_MAP[baseState] !== undefined) {
      return BASE_STATE_ORDER_MAP[baseState];
    }

    // Try to handle different notations
    if (
      baseState === "1B 2B 3B" ||
      (baseState.includes("1B") &&
        baseState.includes("2B") &&
        baseState.includes("3B"))
    ) {
      return 8; // Bases loaded
    }
    if (
      baseState === "1B 2B _" ||
      (baseState.includes("1B") &&
        baseState.includes("2B") &&
        !baseState.includes("3B"))
    ) {
      return 5; // First and second
    }
    if (
      baseState === "1B _ 3B" ||
      (baseState.includes("1B") &&
        !baseState.includes("2B") &&
        baseState.includes("3B"))
    ) {
      return 6; // First and third
    }
    if (
      baseState === "_ 2B 3B" ||
      (!baseState.includes("1B") &&
        baseState.includes("2B") &&
        baseState.includes("3B"))
    ) {
      return 7; // Second and third
    }
    if (
      baseState.includes("1B") &&
      !baseState.includes("2B") &&
      !baseState.includes("3B")
    ) {
      return 2; // First only
    }
    if (
      !baseState.includes("1B") &&
      baseState.includes("2B") &&
      !baseState.includes("3B")
    ) {
      return 3; // Second only
    }
    if (
      !baseState.includes("1B") &&
      !baseState.includes("2B") &&
      baseState.includes("3B")
    ) {
      return 4; // Third only
    }
    if (
      !baseState.includes("1B") &&
      !baseState.includes("2B") &&
      !baseState.includes("3B")
    ) {
      return 1; // Empty bases
    }

    return 999; // Unknown state
  }, []); // Now no dependencies as we're using the constant defined outside

  const transformedData = useMemo(() => {
    return data
      .map((row) => ({
        year: row.Year,
        baseState: row.Bases,
        baseStateOrder: getBaseStateOrder(row.Bases),
        outs0: parseFloat(row["0"]).toFixed(3),
        outs1: parseFloat(row["1"]).toFixed(3),
        outs2: parseFloat(row["2"]).toFixed(3),
      }))
      .sort((a, b) => a.baseStateOrder - b.baseStateOrder);
  }, [data, getBaseStateOrder]);

  // Responsive columns configuration
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
        name: isMobile ? "0" : "0 Outs",
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
        name: isMobile ? "1" : "1 Out",
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
        name: isMobile ? "2" : "2 Outs",
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
    [getBaseStateOrder, isMobile]
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
            Run Expectancy Matrix
          </h2>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full md:w-auto px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <BaseballTable
          data={transformedData}
          columns={columns}
          filename="run_expectancy.csv"
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
