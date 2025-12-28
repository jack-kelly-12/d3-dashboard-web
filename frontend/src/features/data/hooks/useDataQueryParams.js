import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { DEFAULT_YEAR, DEFAULT_DIVISION } from "../../../config/constants";

export function useDataQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialState = useMemo(
    () => ({
      dataType: searchParams.get("dataType") || "player_hitting",
      selectedYears:
        searchParams.get("years")?.split(",").map(Number) || [DEFAULT_YEAR],
      searchTerm: searchParams.get("search") || "",
      minPA: Number(searchParams.get("minPA")) || 50,
      minIP: Number(searchParams.get("minIP")) || 10,
      selectedConference: searchParams.get("conference") || "",
      division: Number(searchParams.get("division")) || DEFAULT_DIVISION,
      selectedListId: searchParams.get("listId") || "",
    }),
    [searchParams]
  );

  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      division: searchParams.get("division")
        ? Number(searchParams.get("division"))
        : prev.division,
    }));
  }, [searchParams]);

  const debouncedUpdate = useMemo(
    () =>
      debounce((s) => {
        const params = {
          dataType: s.dataType,
          years: s.selectedYears.join(","),
          search: s.searchTerm,
          minPA: s.minPA.toString(),
          minIP: s.minIP.toString(),
          conference: s.selectedConference,
        };

        params.division = s.division.toString();
        if (s.selectedListId && s.dataType.includes("player")) {
          params.listId = s.selectedListId;
        }

        setSearchParams(params);
      }, 300),
    [setSearchParams]
  );

  useEffect(() => {
    debouncedUpdate(state);
  }, [state, debouncedUpdate]);

  const setDataType = useCallback((val) => setState((p) => ({ ...p, dataType: val })), []);
  const setSelectedYears = useCallback(
    (val) => setState((p) => ({ ...p, selectedYears: val })),
    []
  );
  const setMinPA = useCallback((val) => setState((p) => ({ ...p, minPA: val })), []);
  const setMinIP = useCallback((val) => setState((p) => ({ ...p, minIP: val })), []);
  const setSearchTerm = useCallback(
    (val) => setState((p) => ({ ...p, searchTerm: val })),
    []
  );
  const setConference = useCallback(
    (val) => setState((p) => ({ ...p, selectedConference: val })),
    []
  );
  const setDivision = useCallback(
    (val) => setState((p) => ({ ...p, division: val })),
    []
  );
  const setSelectedListId = useCallback(
    (val) => setState((p) => ({ ...p, selectedListId: val })),
    []
  );

  return {
    state,
    setState,
    setDataType,
    setSelectedYears,
    setMinPA,
    setMinIP,
    setSearchTerm,
    setConference,
    setDivision,
    setSelectedListId,
  };
}



