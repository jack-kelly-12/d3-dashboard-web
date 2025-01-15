import React, { useState, useEffect } from "react";
import GutsTable from "../components/tables/GutsTable";
import ParkFactorsTable from "../components/tables/ParkFactorsTable";
import ExpectedRunsTable from "../components/tables/ExpectedRunsTable";
import { fetchAPI } from "../config/api";
import InfoBanner from "../components/data/InfoBanner";

const Guts = () => {
  const [gutsData, setGutsData] = useState([]);
  const [pfData, setPFData] = useState([]);
  const [erData, setERData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("2024");
  const years = ["2024", "2023", "2022", "2021"];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [gutsResults, pfResults, erResults] = await Promise.all([
          fetchAPI("/api/guts"),
          fetchAPI("/api/park-factors"),
          fetchAPI(`/api/expected-runs?year=${selectedYear}`),
        ]);

        setGutsData(Array.isArray(gutsResults) ? gutsResults : []);
        setPFData(Array.isArray(pfResults) ? pfResults : []);
        setERData(Array.isArray(erResults) ? erResults : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setGutsData([]);
        setPFData([]);
        setERData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-4 md:space-y-8">
            <InfoBanner dataType="guts" />

            <div className="bg-white p-6 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-6 sm:space-y-4 md:space-y-8">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <GutsTable data={gutsData} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <ExpectedRunsTable
                    data={erData}
                    years={years}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <ParkFactorsTable
                    data={pfData}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guts;
