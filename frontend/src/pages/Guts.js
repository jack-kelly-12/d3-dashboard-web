import React, { useState, useEffect } from "react";
import GutsTable from "../components/tables/GutsTable";
import ParkFactorsTable from "../components/tables/ParkFactorsTable";
import ExpectedRunsTable from "../components/tables/ExpectedRunsTable";
import RankingsTable from "../components/tables/RankingsTable";
import { fetchAPI } from "../config/api";
import InfoBanner from "../components/data/InfoBanner";
import { useSubscription } from "../contexts/SubscriptionContext";
import AuthManager from "../managers/AuthManager";

const divisions = [
  { label: "Division 1", value: 1 },
  { label: "Division 2", value: 2 },
  { label: "Division 3", value: 3 },
];

const Guts = () => {
  const [gutsData, setGutsData] = useState([]);
  const [rankingsData, setRankingsData] = useState([]);
  const [pfData, setPFData] = useState([]);
  const [erData, setERData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [rankingsSearchTerm, setRankingsSearchTerm] = useState("");
  const [pfSearchTerm, setPfSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedDivision, setSelectedDivision] = useState(3);
  const { isPremiumUser, isLoadingPremium } = useSubscription();
  const years = ["2025", "2024", "2023", "2022", "2021"];

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user && isPremiumUser) {
          const urlParams = new URLSearchParams(window.location.search);
          const divisionParam = urlParams.get("division");
          if (divisionParam) {
            setSelectedDivision(Number(divisionParam));
          }
        }

        if (isMounted) {
          setIsAuthReady(true);
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, [isPremiumUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthReady || isLoadingPremium) return;

      setIsLoading(true);
      try {
        const [gutsResults, pfResults, erResults, rankingsResults] =
          await Promise.all([
            fetchAPI(`/api/guts?division=${selectedDivision}`),
            fetchAPI(`/api/park-factors?division=${selectedDivision}`),
            fetchAPI(
              `/api/expected-runs?year=${selectedYear}&division=${selectedDivision}`
            ),
            fetchAPI(`/api/rankings?division=${selectedDivision}`),
          ]);

        setGutsData(Array.isArray(gutsResults) ? gutsResults : []);
        setPFData(Array.isArray(pfResults) ? pfResults : []);
        setERData(Array.isArray(erResults) ? erResults : []);
        setRankingsData(Array.isArray(rankingsResults) ? rankingsResults : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setGutsData([]);
        setPFData([]);
        setERData([]);
        setRankingsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedDivision, isAuthReady, isLoadingPremium]);

  useEffect(() => {
    if (isPremiumUser) {
      const url = new URL(window.location);
      url.searchParams.set("division", selectedDivision.toString());
      window.history.replaceState({}, "", url);
    }
  }, [selectedDivision, isPremiumUser]);

  const DivisionSelector = () => {
    if (!isPremiumUser) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-gray-700">Division:</label>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(Number(e.target.value))}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            hover:border-gray-300 transition-colors w-32"
        >
          {divisions.map((div) => (
            <option key={div.value} value={div.value}>
              {div.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (!isAuthReady || isLoading || isLoadingPremium) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6">
          <InfoBanner dataType="guts" />
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <DivisionSelector />
            <div className="space-y-6">
              <RankingsTable
                data={rankingsData}
                division={selectedDivision}
                searchTerm={rankingsSearchTerm}
                onSearchChange={setRankingsSearchTerm}
              />

              <GutsTable data={gutsData} />

              <ExpectedRunsTable
                data={erData}
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />

              <ParkFactorsTable
                data={pfData}
                searchTerm={pfSearchTerm}
                onSearchChange={setPfSearchTerm}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guts;
