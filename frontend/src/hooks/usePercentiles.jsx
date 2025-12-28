import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAPI } from "../config/api";
import { isBattingTab } from "../utils/playerDataUtils";

export const usePercentiles = ({
  playerId,
  playerYears,
  activeTab,
  division,
  conference,
  selectedYear,
  fallbackYearsByTab,
}) => {
  const cacheRef = useRef(new Map());
  const inFlightRef = useRef(new Map());
  const [percentiles, setPercentiles] = useState({ batting: null, pitching: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabType = useMemo(() => (isBattingTab(activeTab) ? "batting" : "pitching"), [activeTab]);

  const availableYears = useMemo(() => {
    const key = tabType === "batting" ? "batting_years" : "pitching_years";
    const fromPlayerYears = playerYears?.[key] || [];
    if (fromPlayerYears.length) return fromPlayerYears;
    const fromFallback = fallbackYearsByTab?.[key] || [];
    return fromFallback;
  }, [playerYears, tabType, fallbackYearsByTab]);

  const mostRecentYear = useMemo(() => {
    const fromPlayerYears = tabType === "batting" ? playerYears?.most_recent_batting : playerYears?.most_recent_pitching;
    if (fromPlayerYears) return fromPlayerYears;
    const fromFallback = tabType === "batting" ? fallbackYearsByTab?.most_recent_batting : fallbackYearsByTab?.most_recent_pitching;
    return fromFallback || null;
  }, [playerYears, tabType, fallbackYearsByTab]);

  const targetYear = useMemo(() => {
    if (!availableYears?.length) return null;
    if (selectedYear && availableYears.includes(selectedYear)) return selectedYear;
    return mostRecentYear || null;
  }, [availableYears, selectedYear, mostRecentYear]);

  const normalizedConference = conference === "conference" ? "auto" : (conference || "all");

  const keyFor = useCallback((year) => {
    return `${playerId}-${year}-${division}-${normalizedConference}`;
  }, [playerId, division, normalizedConference]);

  const isDataCached = useCallback((year) => {
    if (!year) return false;
    const cacheKey = keyFor(year);
    return cacheRef.current.has(cacheKey);
  }, [keyFor]);

  const doFetch = useCallback(async (year) => {
    const cacheKey = keyFor(year);
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }
    if (inFlightRef.current.has(cacheKey)) {
      return inFlightRef.current.get(cacheKey);
    }

    const buildUrl = () => {
      let url = `/api/player-percentiles/${encodeURIComponent(playerId)}/${year}/${division}`;
      if (normalizedConference && normalizedConference !== "all") {
        url += `?conference=${encodeURIComponent(normalizedConference)}`;
      }
      return url;
    };

    const promise = fetchAPI(buildUrl())
      .then((resp) => {
        cacheRef.current.set(cacheKey, resp);
        return resp;
      })
      .finally(() => {
        inFlightRef.current.delete(cacheKey);
      });

    inFlightRef.current.set(cacheKey, promise);
    return promise;
  }, [division, keyFor, normalizedConference, playerId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError(null);
      if (!playerId || !division || !targetYear) {
        setPercentiles({ batting: null, pitching: null });
        return;
      }
      
      // Check if data is already cached
      if (isDataCached(targetYear)) {
        const cachedData = cacheRef.current.get(keyFor(targetYear));
        if (!cancelled) {
          setPercentiles(cachedData);
        }
        return;
      }
      
      setIsLoading(true);
      try {
        const resp = await doFetch(targetYear);
        if (!cancelled) {
          setPercentiles(resp);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [playerId, division, targetYear, normalizedConference, doFetch, isDataCached, keyFor]);

  const prefetchYears = useCallback((years) => {
    if (!years || !years.length) return;
    years.forEach((y) => {
      if (!y) return;
      const cacheKey = keyFor(y);
      if (!cacheRef.current.has(cacheKey) && !inFlightRef.current.has(cacheKey)) {
        doFetch(y).catch(() => {});
      }
    });
  }, [doFetch, keyFor]);

  return { percentiles, isLoading, error, tabType, availableYears, mostRecentYear, targetYear, prefetchYears };
};


