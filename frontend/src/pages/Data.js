import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "../components/tables/BaseballTable";
import InfoBanner from "../components/data/InfoBanner";
import DataControls from "../components/data/DataControls";
import { fetchAPI } from "../config/api";
import { getDataColumns } from "../config/tableColumns";
import TeamLogo from "../components/data/TeamLogo";
import { useSearchParams } from "react-router-dom";

const Data = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [dataType, setDataType] = useState(
    searchParams.get("dataType") || "player_hitting"
  );
  const [selectedYears, setSelectedYears] = useState(
    searchParams.get("years")?.split(",").map(Number) || [2024]
  );
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [minPA, setMinPA] = useState(Number(searchParams.get("minPA")) || 50);
  const [minIP, setMinIP] = useState(Number(searchParams.get("minIP")) || 10);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(
    searchParams.get("conference") || ""
  );

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await fetchAPI("/conferences");
        setConferences(response.sort());
      } catch (err) {
        console.error("Error fetching conferences:", err);
      }
    };
    fetchConferences();
  }, []);

  // Fetch data based on selected filters
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

        const transformedData = combinedData.map((row) => ({
          ...row,
          renderedTeam: (
            <div className="flex items-center gap-2">
              <TeamLogo
                teamId={row.prev_team_id}
                conferenceId={row.conference_id}
                className="h-8 w-8"
              />
            </div>
          ),
          renderedConference: (
            <div className="w-full flex justify-center items-center gap-2">
              <TeamLogo
                teamId={row.prev_team_id}
                conferenceId={row.conference_id}
                className="h-8 w-8"
              />
            </div>
          ),
        }));

        setData(transformedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataType, selectedYears]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
      const team = item.Team?.toLowerCase() || "";
      const meetsQualifier =
        dataType === "player_pitching"
          ? item.IP >= minIP
          : dataType === "player_hitting"
          ? item.PA >= minPA
          : true;
      const meetsConference = selectedConference
        ? item.Conference === selectedConference
        : true;

      return (
        meetsQualifier &&
        meetsConference &&
        (name.includes(searchStr) || team.includes(searchStr))
      );
    });
  }, [data, searchTerm, minPA, minIP, selectedConference, dataType]);

  useEffect(() => {
    setSearchParams({
      dataType,
      years: selectedYears.join(","),
      search: searchTerm,
      minPA: minPA.toString(),
      minIP: minIP.toString(),
      conference: selectedConference,
    });
  }, [
    dataType,
    selectedYears,
    searchTerm,
    minPA,
    minIP,
    selectedConference,
    setSearchParams,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
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
          conference={selectedConference}
          setConference={setSelectedConference}
          conferences={conferences}
        />
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
