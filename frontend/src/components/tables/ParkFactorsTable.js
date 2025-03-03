import React, { useState, useEffect } from "react";
import { BaseballTable } from "./BaseballTable";
import { columnsPF } from "../../config/tableColumns";

const ParkFactorsTable = ({ data, searchTerm, onSearchChange }) => {
  const filteredData = data.filter((row) =>
    row.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const searchComponent = (
    <input
      type="text"
      placeholder="Search team..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className={`px-3 py-1 border rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
        isMobile ? "text-xs w-full md:w-auto" : "text-sm"
      }`}
    />
  );

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Park Factors
          </h2>
          <div className={`${isMobile ? "w-32" : ""}`}>{searchComponent}</div>
        </div>
      </div>
      <BaseballTable
        data={filteredData}
        columns={columnsPF}
        filename="park_factors.csv"
        stickyColumns={[0]}
      />
    </div>
  );
};

export default ParkFactorsTable;
