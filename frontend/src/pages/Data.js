import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "../components/tables/BaseballTable";
import InfoBanner from "../components/data/InfoBanner";
import DataControls from "../components/data/DataControls";
import { fetchAPI } from "../config/api";
import { getDataColumns } from "../config/tableColumns";
import TeamLogo from "../components/data/TeamLogo";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { useSubscription } from "../contexts/SubscriptionContext";

const MemoizedTable = React.memo(({ data, dataType, filename }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <BaseballTable
      data={data}
      columns={getDataColumns(dataType)}
      filename={filename}
      stickyColumns={[0, 1]}
    />
  </div>
));

const Data = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremiumUser, isLoading: isSubscriptionLoading } = useSubscription();

  const [state, setState] = useState({
    dataType: searchParams.get("dataType") || "player_hitting",
    selectedYears: searchParams.get("years")?.split(",").map(Number) || [2025],
    searchTerm: searchParams.get("search") || "",
    minPA: Number(searchParams.get("minPA")) || 50,
    minIP: Number(searchParams.get("minIP")) || 10,
    selectedConference: searchParams.get("conference") || "",
    division: Number(searchParams.get("division")) || 3,
  });

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conferences, setConferences] = useState([]);

  useEffect(() => {
    if (isPremiumUser) {
      setState((prev) => ({
        ...prev,
        division: searchParams.get("division")
          ? Number(searchParams.get("division"))
          : prev.division,
      }));
    }
  }, [isPremiumUser, searchParams]);

  const endpointMap = useMemo(
    () => ({
      player_hitting: (year) =>
        `/api/batting_war/${year}?division=${state.division}`,
      player_pitching: (year) =>
        `/api/pitching_war/${year}?division=${state.division}`,
      team_hitting: (year) =>
        `/api/batting_team_war/${year}?division=${state.division}`,
      team_pitching: (year) =>
        `/api/pitching_team_war/${year}?division=${state.division}`,
    }),
    [state.division]
  );

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await fetchAPI(
          `/conferences?division=${state.division}`
        );
        setConferences(response.sort());
      } catch (err) {
        console.error("Error fetching conferences:", err);
      }
    };
    fetchConferences();
  }, [state.division]);

  const updateSearchParams = useCallback(
    (newState) => {
      const debouncedUpdate = debounce((state) => {
        const params = {
          dataType: state.dataType,
          years: state.selectedYears.join(","),
          search: state.searchTerm,
          minPA: state.minPA.toString(),
          minIP: state.minIP.toString(),
          conference: state.selectedConference,
        };

        if (isPremiumUser) {
          params.division = state.division.toString();
        }

        setSearchParams(params);
      }, 300);
      debouncedUpdate(newState);
    },
    [setSearchParams, isPremiumUser]
  );

  const transformData = useCallback(
    (row) => ({
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
            teamName={row.Conference}
            showConference={true}
            className="h-8 w-8"
          />
        </div>
      ),
    }),
    []
  );

  const fetchData = useCallback(async () => {
    if (!state.selectedYears.length || isSubscriptionLoading) return;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        state.selectedYears.map((year) =>
          fetchAPI(endpointMap[state.dataType](year)).catch((err) => {
            if (err.status === 403) {
              throw new Error(
                "Premium subscription required to access D1/D2 data"
              );
            }
            console.error(`Error fetching ${year}:`, err);
            return [];
          })
        )
      );

      const combinedData = results.flat();
      if (combinedData.length === 0) {
        setError("No data found for the selected years");
        return;
      }

      setData(combinedData.map(transformData));
      setError(null);
    } catch (err) {
      setError(err.message);
      setState((prev) => ({ ...prev, division: 3 }));
    } finally {
      setIsLoading(false);
    }
  }, [
    state.dataType,
    state.selectedYears,
    endpointMap,
    transformData,
    isSubscriptionLoading,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = state.searchTerm.toLowerCase();
      const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
      const team = item.Team?.toLowerCase() || "";
      const meetsQualifier =
        state.dataType === "player_pitching"
          ? item.IP >= state.minIP
          : state.dataType === "player_hitting"
          ? item.PA >= state.minPA
          : true;
      const meetsConference = state.selectedConference
        ? item.Conference === state.selectedConference
        : true;

      return (
        meetsQualifier &&
        meetsConference &&
        (name.includes(searchStr) || team.includes(searchStr))
      );
    });
  }, [data, state]);

  useEffect(() => {
    updateSearchParams(state);
  }, [state, updateSearchParams]);

  const handleStateChange = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isPageLoading = isSubscriptionLoading || isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <InfoBanner dataType={state.dataType} />
        <DataControls
          {...state}
          setDataType={(val) => handleStateChange("dataType", val)}
          setSelectedYears={(val) => handleStateChange("selectedYears", val)}
          setMinPA={(val) => handleStateChange("minPA", val)}
          setMinIP={(val) => handleStateChange("minIP", val)}
          setSearchTerm={(val) => handleStateChange("searchTerm", val)}
          setConference={(val) => handleStateChange("selectedConference", val)}
          setDivision={(val) => handleStateChange("division", val)}
          conferences={conferences}
          isPremiumUser={isPremiumUser}
        />
        {isPageLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <MemoizedTable
            data={filteredData}
            dataType={state.dataType}
            filename={`${state.dataType}_${state.selectedYears.join("-")}.csv`}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(Data);
