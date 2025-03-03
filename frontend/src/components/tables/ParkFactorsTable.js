import React from "react";
import { BaseballTable } from "./BaseballTable";
import { columnsPF } from "../../config/tableColumns";

const ParkFactorsTable = ({ data, searchTerm, onSearchChange }) => {
  const filteredData = data.filter((row) =>
    row.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchComponent = (
    <input
      type="text"
      placeholder="Search team..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="px-4 py-2 border rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Park Factors
          </h2>
          {searchComponent}
        </div>
      </div>
      <BaseballTable
        data={filteredData}
        columns={columnsPF}
        filename="park_factors.csv"
      />
    </div>
  );
};

export default ParkFactorsTable;
