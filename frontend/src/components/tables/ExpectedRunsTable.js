import React from "react";
import { BaseballTable } from "./BaseballTable";

const ExpectedRunsTable = ({ data, years, selectedYear, onYearChange }) => {
  const transformedData = data.map((row) => ({
    year: row.Year,
    baseState: row.Bases,
    outs0: row["0"].toFixed(3),
    outs1: row["1"].toFixed(3),
    outs2: row["2"].toFixed(3),
  }));

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
