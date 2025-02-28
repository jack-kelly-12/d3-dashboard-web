import React, { useMemo, useCallback } from "react";
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

  const columns = [
    {
      name: "Year",
      selector: (row) => row.year,
      sortable: true,
      width: "20%",
    },
    {
      name: "Base State",
      selector: (row) => row.baseState,
      sortable: true,
      width: "30%",
      cell: (row) => (
        <div className="font-mono text-gray-700">{row.baseState}</div>
      ),
      sortFunction: (rowA, rowB) => {
        return (
          getBaseStateOrder(rowA.baseState) - getBaseStateOrder(rowB.baseState)
        );
      },
    },
    {
      name: "0 Outs",
      selector: (row) => row.outs0,
      sortable: true,
      width: "16.6%",
      cell: (row) => (
        <div className="font-mono text-black-600 font-medium">{row.outs0}</div>
      ),
    },
    {
      name: "1 Out",
      selector: (row) => row.outs1,
      sortable: true,
      width: "16.6%",
      cell: (row) => (
        <div className="font-mono text-black-600 font-medium">{row.outs1}</div>
      ),
    },
    {
      name: "2 Outs",
      selector: (row) => row.outs2,
      sortable: true,
      width: "16.6%",
      cell: (row) => (
        <div className="font-mono text-black-600 font-medium">{row.outs2}</div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Run Expectancy Matrix
          </h2>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <BaseballTable
        data={transformedData}
        columns={columns}
        filename="run_expectancy.csv"
      />
    </div>
  );
};

export default ExpectedRunsTable;
