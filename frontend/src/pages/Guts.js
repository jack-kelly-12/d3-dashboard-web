import React, { useState, useEffect } from "react";
import GutsTable from "../components/tables/GutsTable";
import ParkFactorsTable from "../components/tables/ParkFactorsTable";
import ExpectedRunsTable from "../components/tables/ExpectedRunsTable";
import { fetchAPI } from "../config/api";

const Guts = () => {
  const [gutsData, setGutsData] = useState([]);
  const [pfData, setPFData] = useState([]);
  const [erData, setERData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [gutsResults, pfResults, erResults] = await Promise.all([
          fetchAPI("/api/guts"),
          fetchAPI("/api/park-factors"),
          fetchAPI("/api/expected-runs"),
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#007BA7] border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Guts</h1>
              <p className="text-gray-600 mb-6">
                Explore league-wide constants and park factors that influence
                player and team performance.
              </p>
              <div className="space-y-8">
                <GutsTable data={gutsData} />
                <ExpectedRunsTable data={erData} />
                <ParkFactorsTable
                  data={pfData}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guts;
