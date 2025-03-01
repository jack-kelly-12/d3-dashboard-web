import React, { useState, useEffect } from "react";
import { BaseballTable } from "./BaseballTable";
import { columnsPF } from "../../config/tableColumns";

const ParkFactorsTable = ({ data, searchTerm, onSearchChange }) => {
  // Add responsive state
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // Add resize listener on mount
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine if we're in mobile view
  const isMobile = windowWidth < 768;

  const filteredData = data.filter((row) =>
    row.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchComponent = (
    <input
      type="text"
      placeholder={isMobile ? "Team..." : "Search team..."}
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full md:w-auto px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm border rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="p-2 md:p-4 border-b border-gray-200">
        <div
          className={`flex ${
            isMobile
              ? "flex-col space-y-2"
              : "flex-row items-center justify-between"
          }`}
        >
          <h2 className="text-sm md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Park Factors
          </h2>
          {searchComponent}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <BaseballTable
          data={filteredData}
          columns={columnsPF}
          filename="park_factors.csv"
          responsive={true}
          dense={isMobile}
          fixedHeader={true}
          fixedHeaderScrollHeight={isMobile ? "400px" : "600px"}
        />
      </div>
    </div>
  );
};

export default ParkFactorsTable;
