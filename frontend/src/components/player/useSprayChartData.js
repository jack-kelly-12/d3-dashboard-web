import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchAPI } from "../../config/api";

export const useSprayChartData = (playerId, initialYear, division) => {
  const [playerData, setPlayerData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [selectedZones, setSelectedZones] = useState([]);
  const [handFilter, setHandFilter] = useState({ L: true, R: true });
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const hasFetchedRef = useRef(false);
  const lastPlayerIdRef = useRef(playerId);

  useEffect(() => {
    if (lastPlayerIdRef.current !== playerId) {
      hasFetchedRef.current = false;
      lastPlayerIdRef.current = playerId;
    }

    const fetchData = async () => {
      if (!selectedYear) return;
      
      if (!hasFetchedRef.current) {
        setLoading(true);
      } else {
        setIsTransitioning(true);
      }
      
      try {
        const data = await fetchAPI(
          `/spraychart_data/${playerId}?year=${selectedYear}&division=${division}`
        );
        const bats = data.bats || "-";
        const team = data.team_name || "-";
        const playerInfo = `${bats ? bats.substring(0, 1).toUpperCase() : "-"} | ${selectedYear} | ${team}`;

        setEvents(Array.isArray(data.events) ? data.events : []);
        setPlayerData({
          player_name: data.player_name || "-",
          playerInfo,
          counts: data.counts || {},
        });
        
        const years = data.available_years || [];
        setAvailableYears(years);
        
        setError(null);
        hasFetchedRef.current = true;
      } catch (err) {
        console.error("Error fetching player data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    };

    fetchData();
  }, [division, playerId, selectedYear]);

  const filteredEvents = useMemo(() => {
    if (!events.length) return [];
    
    const allowedHands = new Set([
      ...(handFilter.L ? ["L"] : []),
      ...(handFilter.R ? ["R"] : []),
    ]);
    const hrZones = new Set(selectedZones.filter(z => z.endsWith("-hr")));
    const baseZones = new Set(selectedZones.filter(z => !z.endsWith("-hr")));

    return events.filter((e) => {
      if (allowedHands.size > 0) {
        const hand = (e.pitcher_throws || "").toUpperCase().startsWith("L") ? "L" : 
                     (e.pitcher_throws || "").toUpperCase().startsWith("R") ? "R" : null;
        if (hand && !allowedHands.has(hand)) return false;
      }
      
      if (selectedZones.length > 0) {
        if (!e.field_zone) return false;
        const baseZone = e.field_zone.endsWith("-hr") ? e.field_zone.replace("-hr", "") : e.field_zone;
        const hrZone = baseZone + "-hr";
        const isHR = e.is_hr || e.field_zone.endsWith("-hr");
        
        return isHR ? hrZones.has(hrZone) : baseZones.has(baseZone);
      }
      return true;
    });
  }, [events, handFilter, selectedZones]);

  const aggregates = useMemo(() => {
    const evts = filteredEvents.length ? filteredEvents : events;
    const outfieldZones = ["left-field", "center-field", "right-field"];
    const infieldZones = ["third-base", "shortstop", "up-the-middle", "second-base", "first-base"];

    const outCounts = { "left-field": 0, "center-field": 0, "right-field": 0 };
    const outHR = { "left-field": 0, "center-field": 0, "right-field": 0 };
    const inCounts = { "third-base": 0, "shortstop": 0, "second-base": 0, "first-base": 0, "up-the-middle": 0 };

    let bbGround = 0, bbFly = 0, bbLined = 0, bbPopped = 0;
    let dirPull = 0, dirOppo = 0, dirMiddle = 0;
    let pa = 0, hits = 0, bb = 0, hbp = 0, sf = 0;
    const wobas = [];

    evts.forEach((e) => {
      const z = e.field_zone;
      if (z) {
        const isHR = z.endsWith("-hr");
        const base = isHR ? z.replace("-hr", "") : z;
        if (outfieldZones.includes(base)) {
          isHR ? outHR[base]++ : outCounts[base]++;
        } else if (infieldZones.includes(base)) {
          inCounts[base]++;
        }
      }

      if (e.is_ground) bbGround++;
      if (e.is_fly) bbFly++;
      if (e.is_lined) bbLined++;
      if (e.is_popped) bbPopped++;
      if (e.direction === 'pull') dirPull++;
      if (e.direction === 'oppo') dirOppo++;
      if (e.direction === 'middle') dirMiddle++;

      if (e.is_pa) {
        pa++;
        if (typeof e.woba === 'number') wobas.push(e.woba);
        if (e.is_bb) bb++;
        if (e.is_hbp) hbp++;
        if (e.is_sf) sf++;
        if (e.is_single || e.is_double || e.is_triple || e.is_hr) hits++;
      }
    });

    const outNonHRTotal = outfieldZones.reduce((s, k) => s + outCounts[k], 0);
    const outHRTotal = outfieldZones.reduce((s, k) => s + outHR[k], 0);
    const inTotal = infieldZones.reduce((s, k) => s + inCounts[k], 0);
    const allBattedBalls = outNonHRTotal + outHRTotal + inTotal;

    const pct = (n) => allBattedBalls ? Math.round((n / allBattedBalls) * 100) : 0;

    const outfield = outfieldZones.map((z) => ({
      id: z,
      percentage: pct(outCounts[z]),
      hrCount: outHR[z],
      hrPercentage: pct(outHR[z]),
    }));

    const infield = infieldZones.map((z) => ({
      id: z,
      percentage: pct(inCounts[z]),
    }));

    const bbTotal = bbGround + bbFly + bbLined + bbPopped;
    const dirTotal = dirPull + dirOppo + dirMiddle;
    const hasDirection = dirTotal > 0;
    const ab = pa - bb - hbp - sf;

    const byHand = (hand) => {
      const subset = evts.filter(e => (e.pitcher_throws || '').toUpperCase().startsWith(hand));
      let s_pa = 0, s_hits = 0, s_bb = 0, s_hbp = 0, s_sf = 0;
      const s_w = [];
      
      subset.forEach(e => {
        if (e.is_pa) {
          s_pa++;
          if (typeof e.woba === 'number') s_w.push(e.woba);
          if (e.is_bb) s_bb++;
          if (e.is_hbp) s_hbp++;
          if (e.is_sf) s_sf++;
          if (e.is_single || e.is_double || e.is_triple || e.is_hr) s_hits++;
        }
      });
      
      const s_ab = s_pa - s_bb - s_hbp - s_sf;
      return {
        PA: s_pa,
        battingAvg: s_ab > 0 ? s_hits / s_ab : 0,
        onBasePercentage: (s_ab + s_bb + s_hbp + s_sf) > 0 ? (s_hits + s_bb + s_hbp) / (s_ab + s_bb + s_hbp + s_sf) : 0,
        wOBA: s_w.length ? s_w.reduce((a, b) => a + b, 0) / s_w.length : 0,
      };
    };

    return {
      outfieldZones: outfield,
      infieldZones: infield,
      stats: {
        PA: pa,
        battingAvg: ab > 0 ? hits / ab : 0,
        onBasePercentage: (ab + bb + hbp + sf) > 0 ? (hits + bb + hbp) / (ab + bb + hbp + sf) : 0,
        wOBA: wobas.length ? wobas.reduce((a, b) => a + b, 0) / wobas.length : 0,
        batted: {
          air: bbTotal ? 100 - Math.round((bbGround / bbTotal) * 100) : 0,
          ground: bbTotal ? Math.round((bbGround / bbTotal) * 100) : 0,
          pull: hasDirection ? Math.round((dirPull / dirTotal) * 100) : null,
          oppo: hasDirection ? Math.round((dirOppo / dirTotal) * 100) : null,
          middle: hasDirection ? Math.round((dirMiddle / dirTotal) * 100) : null,
          pullAir: hasDirection ? Math.round((evts.filter(e => e.direction === 'pull' && (e.is_fly || e.is_lined)).length / dirTotal) * 100) : null,
          backspinGroundball: hasDirection ? Math.round((evts.filter(e => e.direction === 'oppo' && e.is_ground).length / dirTotal) * 100) : null,
        },
        vsRHP: byHand('R'),
        vsLHP: byHand('L'),
      }
    };
  }, [events, filteredEvents]);

  const clearZones = useCallback(() => setSelectedZones([]), []);

  return {
    playerData,
    events,
    filteredEvents,
    aggregates,
    loading,
    isTransitioning,
    error,
    selectedZones,
    setSelectedZones,
    handFilter,
    setHandFilter,
    clearZones,
    availableYears,
    selectedYear,
    setSelectedYear,
  };
};

export const formatAvg = (val) => `.${((val || 0) * 1000).toFixed(0).padStart(3, "0")}`;

export const normalizeZone = (z) => {
  if (!z) return z;
  const isHR = z.endsWith("-hr");
  const base = isHR ? z.replace("-hr", "") : z;
  const abbrevMap = {
    "left-field": "LF",
    "center-field": "CF",
    "right-field": "RF",
    "third-base": "3B",
    "shortstop": "SS",
    "second-base": "2B",
    "first-base": "1B",
    "up-the-middle": "Middle"
  };
  const abbrev = abbrevMap[base] || base;
  return isHR ? `${abbrev} (HR)` : abbrev;
};

