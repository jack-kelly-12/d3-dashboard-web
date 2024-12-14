import React, { useState, useEffect } from "react";
import { BaseballTable } from "../components/tables/BaseballTable";
import InfoBanner from "../components/data/InfoBanner";
import DataControls from "../components/data/DataControls";
import { fetchAPI } from "../config/api";
import { getDataColumns } from "../config/tableColumns";

const Data = () => {
  const [dataType, setDataType] = useState("player_hitting");
  const [selectedYears, setSelectedYears] = useState([2024]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPA, setMinPA] = useState(50);
  const [minIP, setMinIP] = useState(10);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpointMap = {
      player_hitting: (year) => `/api/batting_war/${year}`,
      player_pitching: (year) => `/api/pitching_war/${year}`,
      team_hitting: (year) => `/api/batting_team_war/${year}`,
      team_pitching: (year) => `/api/pitching_team_war/${year}`,
    };

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!selectedYears.length) {
          throw new Error("Please select at least one year");
        }

        const promises = selectedYears.map(async (year) => {
          try {
            return await fetchAPI(endpointMap[dataType](year));
          } catch (err) {
            console.error(`Error fetching data for year ${year}:`, err);
            return [];
          }
        });

        const results = await Promise.all(promises);
        const combinedData = results.flat();

        if (combinedData.length === 0) {
          setError("No data found for the selected years");
          return;
        }

        setData(combinedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataType, selectedYears]);

  const filteredData = data.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
    const team = item.Team?.toLowerCase() || "";
    const meetsQualifier =
      dataType === "player_pitching"
        ? item.IP >= minIP
        : dataType === "player_hitting"
        ? item.PA >= minPA
        : true;

    return (
      meetsQualifier && (name.includes(searchStr) || team.includes(searchStr))
    );
  });

  return (
    <div className="flex-1 overflow-x-hidden">
      <div className="max-w-[calc(100vw-256px)] mx-auto px-6 py-8">
        <InfoBanner dataType={dataType} />

        <DataControls
          dataType={dataType}
          setDataType={setDataType}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          minPA={minPA}
          setMinPA={setMinPA}
          minIP={minIP}
          setMinIP={setMinIP}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-[#041F3D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <BaseballTable
              data={filteredData}
              columns={getDataColumns(dataType)}
              filename={`${dataType}_${selectedYears.join("-")}.csv`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;
