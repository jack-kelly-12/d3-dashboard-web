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
      className="px-4 py-2 border rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-transparent"
    />
  );

  return (
    <BaseballTable
      title="Park Factors"
      data={filteredData}
      columns={columnsPF}
      filename="park_factors.csv"
      searchComponent={searchComponent}
    />
  );
};

export default ParkFactorsTable;
