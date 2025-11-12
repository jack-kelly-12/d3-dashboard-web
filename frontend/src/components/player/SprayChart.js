import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { fetchAPI } from "../../config/api";

const SprayChart = ({
  width = 600,
  height = 570,
  playerId,
  year,
  division,
}) => {
  const svgRef = useRef();
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [events, setEvents] = useState([]);
  const [handFilter, setHandFilter] = useState({ L: true, R: true });

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);

      try {
        const data = await fetchAPI(
          `/spraychart_data/${playerId}?year=${year}&division=${division}`
        );
        const counts = data.counts || {};
        const bats = data.bats || "-";
        const team = data.team_name || "-";

        const playerInfo = `${
          bats ? bats.substring(0, 1).toUpperCase() : "-"
        } | ${year} | ${team}`;

        const incomingEvents = Array.isArray(data.events) ? data.events : [];
        setEvents(incomingEvents);

        const processedData = {
          player_name: data.player_name || "-",
          playerInfo: playerInfo,
          counts,
        };

        setPlayerData(processedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching player data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [division, playerId, year]);

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const allowedHands = new Set([
      ...(handFilter.L ? ["L"] : []),
      ...(handFilter.R ? ["R"] : []),
    ]);
    const zoneSet = new Set(selectedZones);
    return events.filter((e) => {
      if (allowedHands.size > 0) {
        const hand = (e.pitcher_throws || "").toUpperCase().startsWith("L") ? "L" : (e.pitcher_throws || "").toUpperCase().startsWith("R") ? "R" : null;
        if (hand && !allowedHands.has(hand)) return false;
      }
      if (zoneSet.size > 0) {
        if (!e.field_zone) return false;
        const baseZone = e.field_zone.endsWith("-hr") ? e.field_zone.replace("-hr", "") : e.field_zone;
        const hrZone = baseZone + "-hr";
        if (!(zoneSet.has(baseZone) || zoneSet.has(hrZone))) return false;
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
        const base = z.endsWith("-hr") ? z.replace("-hr", "") : z;
        if (outfieldZones.includes(base)) {
          outCounts[base] += 1;
          if (e.is_hr || z.endsWith("-hr")) outHR[base] += 1;
        } else if (infieldZones.includes(base)) {
          inCounts[base] += 1;
        }
      }

      if (e.is_ground) bbGround += 1;
      if (e.is_fly) bbFly += 1;
      if (e.is_lined) bbLined += 1;
      if (e.is_popped) bbPopped += 1;

      if (e.direction === 'pull') dirPull += 1;
      if (e.direction === 'oppo') dirOppo += 1;
      if (e.direction === 'middle') dirMiddle += 1;

      if (e.is_pa) {
        pa += 1;
        if (typeof e.woba === 'number') wobas.push(e.woba);
        if (e.is_bb) bb += 1;
        if (e.is_hbp) hbp += 1;
        if (e.is_sf) sf += 1;
        if (e.is_single || e.is_double || e.is_triple || e.is_hr) hits += 1;
      }
    });

    const outTotal = outfieldZones.reduce((s, k) => s + outCounts[k] + outHR[k], 0);
    const inTotal = infieldZones.reduce((s, k) => s + inCounts[k], 0);

    const outfield = outfieldZones.map((z) => ({
      id: z,
      percentage: outTotal ? Math.round(((outCounts[z] + outHR[z]) / outTotal) * 100) : 0,
      hrCount: outHR[z],
    }));
    const infield = [
      { id: "third-base", percentage: inTotal ? Math.round((inCounts["third-base"] / inTotal) * 100) : 0 },
      { id: "shortstop", percentage: inTotal ? Math.round((inCounts["shortstop"] / inTotal) * 100) : 0 },
      { id: "up-the-middle", percentage: inTotal ? Math.round((inCounts["up-the-middle"] / inTotal) * 100) : 0 },
      { id: "second-base", percentage: inTotal ? Math.round((inCounts["second-base"] / inTotal) * 100) : 0 },
      { id: "first-base", percentage: inTotal ? Math.round((inCounts["first-base"] / inTotal) * 100) : 0 },
    ];

    const bbTotal = bbGround + bbFly + bbLined + bbPopped;
    const gb_pct = bbTotal ? Math.round((bbGround / bbTotal) * 100) : 0;
    const air_pct = bbTotal ? 100 - gb_pct : 0;

    const dirTotal = dirPull + dirOppo + dirMiddle;
    const pull_pct = dirTotal ? Math.round((dirPull / dirTotal) * 100) : 0;
    const oppo_pct = dirTotal ? Math.round((dirOppo / dirTotal) * 100) : 0;
    const middle_pct = dirTotal ? Math.round((dirMiddle / dirTotal) * 100) : 0;

    const pull_air_pct = dirTotal ? Math.round(((evts.filter(e => e.direction === 'pull' && (e.is_fly || e.is_lined)).length) / dirTotal) * 100) : 0;
    const oppo_gb_pct = dirTotal ? Math.round(((evts.filter(e => e.direction === 'oppo' && e.is_ground).length) / dirTotal) * 100) : 0;

    const ab = pa - bb - hbp - sf;
    const ba = ab > 0 ? hits / ab : 0;
    const obp = (ab + bb + hbp + sf) > 0 ? (hits + bb + hbp) / (ab + bb + hbp + sf) : 0;
    const woba = wobas.length ? wobas.reduce((a, b) => a + b, 0) / wobas.length : 0;

    const byHand = (hand) => {
      const subset = evts.filter(e => (e.pitcher_throws || '').toUpperCase().startsWith(hand));
      let s_pa = 0, s_hits = 0, s_bb = 0, s_hbp = 0, s_sf = 0; const s_w = [];
      subset.forEach(e => {
        if (e.is_pa) {
          s_pa += 1;
          if (typeof e.woba === 'number') s_w.push(e.woba);
          if (e.is_bb) s_bb += 1;
          if (e.is_hbp) s_hbp += 1;
          if (e.is_sf) s_sf += 1;
          if (e.is_single || e.is_double || e.is_triple || e.is_hr) s_hits += 1;
        }
      });
      const s_ab = s_pa - s_bb - s_hbp - s_sf;
      return {
        PA: s_pa,
        battingAvg: s_ab > 0 ? s_hits / s_ab : 0,
        onBasePercentage: (s_ab + s_bb + s_hbp + s_sf) > 0 ? (s_hits + s_bb + s_hbp) / (s_ab + s_bb + s_hbp + s_sf) : 0,
        wOBA: s_w.length ? s_w.reduce((a,b)=>a+b,0)/s_w.length : 0,
      };
    };

    const vsR = byHand('R');
    const vsL = byHand('L');

    return {
      outfieldZones: outfield,
      infieldZones: infield,
      stats: {
        battingAvg: ba,
        PA: pa,
        onBasePercentage: obp,
        wOBA: woba,
        batted: {
          air: air_pct,
          ground: gb_pct,
          pull: pull_pct,
          oppo: oppo_pct,
          middle: middle_pct,
          pullAir: pull_air_pct,
          backspinGroundball: oppo_gb_pct,
        },
        vsRHP: vsR,
        vsLHP: vsL,
      }
    };
  }, [events, filteredEvents]);

  useEffect(() => {
    if (!svgRef.current || !playerData) return;

    const containerWidth = svgRef.current.parentElement.clientWidth;
    const containerHeight = Math.min(containerWidth, 570);

    const chartWidth = containerWidth || width;
    const chartHeight = containerHeight || height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `-20 0 ${width + 40} ${height}`);
    svg.attr("width", chartWidth);
    svg.attr("height", chartHeight);

    const title = playerData.player_name || "-";
    const playerInfo = playerData.playerInfo || "-";
    const stats = aggregates.stats || {};
    const outfieldZoneData = aggregates.outfieldZones || [];
    const infieldZoneData = aggregates.infieldZones || [];

    const isVerySmallScreen = chartWidth < 400;
    const isSmallScreen = chartWidth < 600;

    const headerHeight = isVerySmallScreen ? 72 : (isSmallScreen ? 78 : 94);
    const margin =
      isVerySmallScreen || isSmallScreen
        ? { top: headerHeight + 16, right: 10, bottom: 30, left: 10 }
        : { top: headerHeight + 24, right: 20, bottom: 120, left: 20 };

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#F5FBFF");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const innerWidth = width - margin.left;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", isSmallScreen ? width - margin.right : width)
      .attr("height", headerHeight)
      .attr("fill", "#E1F5FE")
      .attr("rx", 5)
      .attr("ry", 5);

    const header = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${isVerySmallScreen ? 14 : 18})`
      );

    const titleFontSize = isVerySmallScreen
      ? "16px"
      : isSmallScreen
      ? "17px"
      : "20px";
    const subtitleFontSize = isVerySmallScreen
      ? "14px"
      : isSmallScreen
      ? "15px"
      : "18px";

    header
      .append("text")
      .attr("x", 10)
      .attr("y", 15)
      .attr("font-weight", "bold")
      .attr("font-size", titleFontSize)
      .attr("fill", "#2C3E50")
      .text(title);

    header
      .append("text")
      .attr("x", 10)
      .attr("y", isVerySmallScreen ? 35 : 40)
      .attr("font-size", subtitleFontSize)
      .attr("fill", "#2C3E50")
      .text(playerInfo);

    const normalizeZone = (z) => {
      if (!z) return z;
      const base = z.endsWith("-hr") ? z.replace("-hr", "") : z;
      return base
        .split("-")
        .map((s) => (s.length > 2 ? s[0].toUpperCase() + s.slice(1) : s.toUpperCase()))
        .join(" ");
    };
    const zoneText = selectedZones.length === 0 ? "All zones" : `Zones: ${selectedZones.map(normalizeZone).join(", ")}`;
    const handText = handFilter.L && handFilter.R ? "" : (handFilter.R ? "vs RHP" : (handFilter.L ? "vs LHP" : ""));
    const filterText = handText ? `${zoneText} • ${handText}` : zoneText;

    header
      .append("text")
      .attr("x", 10)
      .attr("y", isVerySmallScreen ? 56 : 65)
      .attr("font-size", isVerySmallScreen ? "12px" : "14px")
      .attr("fill", "#1F3B57")
      .text(filterText);

    header
      .append("g")
      .attr("transform", `translate(${innerWidth - 60}, 0)`)
      .call((g) => {
        const gradient = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", "d3-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");

        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#4299e1");

        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#5a67d8");

        g.append("rect")
          .attr("width", 36)
          .attr("height", 36)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", "url(#d3-gradient)");

        g.append("text")
          .attr("x", 18)
          .attr("y", 24)
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", "18px")
          .attr("fill", "white")
          .text("D3");
      });

    const xScale = d3.scaleLinear().domain([-550, 550]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([-20, 200]).range([innerHeight, 0]);

    const field = g.append("g").attr("class", "field");

    const centerX = xScale(0);
    const centerY = yScale(0);

    const arcRadius = Math.min(innerWidth, innerHeight) * 0.7;
    const infieldRadius = arcRadius * 0.55;

    const infieldPie = d3
      .pie()
      .startAngle(-0.785398)
      .endAngle(0.785398)
      .value(() => 1)
      .sort(null)
      .padAngle(0);

    const infieldData = [1, 1, 1, 1, 1];
    const infieldSlices = infieldPie(infieldData);

    const infieldArc = d3.arc().innerRadius(0).outerRadius(infieldRadius);

    infieldSlices.forEach((slice, i) => {
      const percentage = infieldZoneData[i]?.percentage || 0;
      const zoneId = infieldZoneData[i]?.id || `infield-${i}`;

      let fillColor = "#FFFFFF";
      if (percentage > 0 && percentage < 25) {
        fillColor = "#FFE4E1";
      } else if (percentage >= 25 && percentage < 40) {
        fillColor = "#FFCCCC";
      } else if (percentage >= 40) {
        fillColor = "#FF9999";
      }

      const isSelected = selectedZones.includes(zoneId);
      const isDimmedIn = selectedZones.length > 0 && !isSelected;
      
      let sliceFillIn = fillColor;
      let sliceOpacityIn = 1.0;
      
      if (isSelected) {
        sliceFillIn = fillColor;
        sliceOpacityIn = 1.0;
      } else if (isDimmedIn) {
        sliceFillIn = "#E5E7EB";
        sliceOpacityIn = 0.1;
      }

      field
        .append("path")
        .attr("d", infieldArc(slice))
        .attr("transform", `translate(${centerX},${centerY})`)
        .attr("fill", sliceFillIn)
        .attr("stroke", "#000")
        .attr("stroke-width", selectedZones.includes(zoneId) ? 1.5 : 0.5)
        .attr("opacity", sliceOpacityIn)
        .attr("cursor", "pointer")
        .attr("data-zone-id", zoneId)
        .on("click", (event) => {
          event.stopPropagation();
          setSelectedZones((prev) => {
            const already = prev.includes(zoneId);
            if (already) return prev.filter((z) => z !== zoneId);
            return [...prev, zoneId];
          });
        });

      const textAngle = (slice.startAngle + slice.endAngle) / 2;
      const textRadius = infieldRadius * 0.65;
      const textX = centerX + Math.sin(textAngle) * textRadius;
      const textY = centerY - Math.cos(textAngle) * textRadius;

      if (percentage > 0) {
        const infieldFontSize = isVerySmallScreen
          ? "18px"
          : isSmallScreen
          ? "14px"
          : "14px";

        field
          .append("text")
          .attr("x", textX)
          .attr("y", textY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", infieldFontSize)
          .attr("fill", "#333")
          .attr("opacity", isDimmedIn ? 0.1 : 1)
          .text(`${percentage}%`);
      }
    });

    const outfieldPie = d3
      .pie()
      .startAngle(-0.785398)
      .endAngle(0.785398)
      .value(() => 1)
      .sort(null)
      .padAngle(0);

    const outfieldData = [1, 1, 1];
    const outfieldSlices = outfieldPie(outfieldData);

    const outfieldArc = d3
      .arc()
      .innerRadius(infieldRadius)
      .outerRadius(arcRadius)
      .context(null);

    outfieldSlices.forEach((slice, i) => {
      const percentage = outfieldZoneData[i]?.percentage || 0;
      const zoneId = outfieldZoneData[i]?.id || `outfield-${i}`;
      const hrZoneId = `${zoneId}-hr`;

      let fillColor = "#FFE4E1";
      if (percentage >= 50) {
        fillColor = "#FF6666";
      } else if (percentage >= 33) {
        fillColor = "#FF9999";
      } else if (percentage >= 17) {
        fillColor = "#FFCCCC";
      }

      const isSelected = selectedZones.includes(zoneId);
      const isDimmed = selectedZones.length > 0 && !isSelected;
      
      let sliceFill = fillColor;
      let sliceOpacity = 0.95;
      
      if (isSelected) {
        sliceFill = fillColor;
        sliceOpacity = 1.0;
      } else if (isDimmed) {
        sliceFill = "#E5E7EB";
        sliceOpacity = 0.1;
      }

      field
        .append("path")
        .attr("d", outfieldArc(slice))
        .attr("transform", `translate(${centerX}, ${centerY})`)
        .attr("fill", sliceFill)
        .attr("stroke", "#000")
        .attr("stroke-width", selectedZones.includes(zoneId) ? 2 : 1)
        .attr("opacity", sliceOpacity)
        .attr("cursor", "pointer")
        .attr("data-zone-id", zoneId)
        .on("click", (event) => {
          event.stopPropagation();
          setSelectedZones((prev) => {
            const already = prev.includes(zoneId);
            if (already) return prev.filter((z) => z !== zoneId);
            return [...prev, zoneId];
          });
        })
        .raise();

      const textAngle = (slice.startAngle + slice.endAngle) / 2;
      const textRadius = arcRadius * 0.7;
      const textX = centerX + Math.sin(textAngle) * textRadius;
      const textY = centerY - Math.cos(textAngle) * textRadius;

      const percentageFontSize = isVerySmallScreen
        ? "30px"
        : isSmallScreen
        ? "16px"
        : "28px";

      field
        .append("text")
        .attr("x", textX)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", percentageFontSize)
        .attr("fill", "#333")
        .attr("opacity", isDimmed ? 0.1 : 1)
        .text(`${percentage}%`);

      const numberAngle = (slice.startAngle + slice.endAngle) / 2;
      const numberRadius = arcRadius * 1.15;
      const numberX = centerX + Math.sin(numberAngle) * numberRadius;
      const numberY = centerY - Math.cos(numberAngle) * numberRadius;

      const circleRadius = isVerySmallScreen ? 12 : isSmallScreen ? 15 : 18;

      if (!isVerySmallScreen || outfieldZoneData[i]?.hrCount > 0) {
        const isDimmedHR = selectedZones.length > 0 && !selectedZones.includes(hrZoneId);
        
        field
          .append("circle")
          .attr("cx", numberX)
          .attr("cy", numberY)
          .attr("r", circleRadius)
          .attr("fill", "#E1F5FE")
          .attr("stroke", "#0D47A1")
          .attr("stroke-width", selectedZones.includes(hrZoneId) ? 2 : 1.5)
          .attr("opacity", isDimmedHR ? 0.1 : 1)
          .attr("cursor", "pointer")
          .attr("data-zone-id", hrZoneId)
          .on("click", (event) => {
            event.stopPropagation();
            setSelectedZones((prev) => {
              const already = prev.includes(hrZoneId);
              if (already) return prev.filter((z) => z !== hrZoneId);
              return [...prev, hrZoneId];
            });
          });
      }

      const hrCount = outfieldZoneData[i]?.hrCount || 0;

      if (!isVerySmallScreen || hrCount > 0) {
        const hrFontSize = isVerySmallScreen
          ? "15px"
          : isSmallScreen
          ? "16px"
          : "18px";

        const isDimmedHR = selectedZones.length > 0 && !selectedZones.includes(hrZoneId);
        
        field
          .append("text")
          .attr("x", numberX)
          .attr("y", numberY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", hrFontSize)
          .attr("fill", "#0D47A1")
          .attr("opacity", isDimmedHR ? 0.1 : 1)
          .attr("cursor", "pointer")
          .attr("data-zone-id", hrZoneId)
          .on("click", (event) => {
            event.stopPropagation();
            setSelectedZones((prev) => {
              const already = prev.includes(hrZoneId);
              if (already) return prev.filter((z) => z !== hrZoneId);
              return [...prev, hrZoneId];
            });
          })
          .text(hrCount);
      }
    });

    svg.on("click", () => {
      setSelectedZones([]);
      setSelectedCells([]);
    });

    if (!isVerySmallScreen && !isSmallScreen) {
      const statsContainer = svg
        .append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

      statsContainer
        .append("rect")
        .attr("x", margin.left)
        .attr("y", -5)
        .attr("width", innerWidth - margin.right)
        .attr("height", 115)
        .attr("fill", "#E1F5FE")
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("stroke", "#90CAF9")
        .attr("stroke-width", 1);

      const createTable = (
        g,
        x,
        y,
        cols,
        rows,
        cellWidth,
        cellHeight,
        headerColor,
        borderColor
      ) => {
        const tableWidth = cellWidth * cols.length;
        const tableHeight = cellHeight * (rows.length + 1);

        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", tableWidth)
          .attr("height", tableHeight)
          .attr("fill", "#FFFFFF")
          .attr("stroke", borderColor)
          .attr("stroke-width", 1);

        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", tableWidth)
          .attr("height", cellHeight)
          .attr("fill", headerColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1);

        cols.forEach((col, i) => {
          if (i > 0) {
            g.append("line")
              .attr("x1", x + i * cellWidth)
              .attr("y1", y)
              .attr("x2", x + i * cellWidth)
              .attr("y2", y + tableHeight)
              .attr("stroke", borderColor)
              .attr("stroke-width", 1);
          }

          g.append("text")
            .attr("x", x + i * cellWidth + cellWidth / 2)
            .attr("y", y + cellHeight / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-weight", "bold")
            .attr("font-size", "9px")
            .attr("fill", "#0D47A1")
            .text(col);
        });

        rows.forEach((row, i) => {
          const rowY = y + (i + 1) * cellHeight;

          g.append("line")
            .attr("x1", x)
            .attr("y1", rowY)
            .attr("x2", x + tableWidth)
            .attr("y2", rowY)
            .attr("stroke", borderColor)
            .attr("stroke-width", 1);

          row.forEach((cell, j) => {
            const cellId = `${cols[j]}-${cell}`;
            const isCellSelected = selectedCells.includes(cellId);
            g.append("rect")
              .attr("x", x + j * cellWidth)
              .attr("y", rowY)
              .attr("width", cellWidth)
              .attr("height", cellHeight)
              .attr("fill", isCellSelected ? "#FFE082" : "transparent")
              .attr("stroke", isCellSelected ? "#FF8F00" : "none")
              .attr("stroke-width", isCellSelected ? 2 : 0)
              .attr("data-cell-id", cellId);

            g.append("text")
              .attr("x", x + j * cellWidth + cellWidth / 2)
              .attr("y", rowY + cellHeight / 2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "12px")
              .attr("fill", "#333")
              .attr("pointer-events", "none")
              .text(cell);
          });
        });

        return tableWidth;
      };

      const leftStats = statsContainer
        .append("g")
        .attr("transform", `translate(${margin.left + 25}, 30)`);

      const leftCols = [
        "Air%",
        "Ground%",
        "Pull%",
        "Middle%",
        "Oppo%",
        "Pull Air%",
        "Back. GB%",
      ];

      const leftRows = [
        [
          `${stats.batted?.air || 0}%`,
          `${stats.batted?.ground || 0}%`,
          `${stats.batted?.pull || 0}%`,
          `${stats.batted?.middle || 0}%`,
          `${stats.batted?.oppo || 0}%`,
          `${stats.batted?.pullAir || 0}%`,
          `${stats.batted?.backspinGroundball || 0}%`,
        ],
      ];

      createTable(
        leftStats,
        0,
        0,
        leftCols,
        leftRows,
        45,
        25,
        "#BBDEFB",
        "#90CAF9"
      );

      const rightStats = statsContainer
        .append("g")
        .attr("transform", `translate(${width - 250 - margin.right}, 10)`);

      const rightCols = ["", "PA", "BA", "OBP", "wOBA"];
      const rightRows = [
        [
          "Overall",
          `${stats.PA || 0}`,
          `.${((stats.battingAvg || 0) * 1000).toFixed(0).padStart(3, "0")}`,
          `.${((stats.onBasePercentage || 0) * 1000)
            .toFixed(0)
            .padStart(3, "0")}`,
          `.${((stats.wOBA || 0) * 1000).toFixed(0).padStart(3, "0")}`,
        ],
        [
          "vs RHP",
          `${stats.vsRHP?.PA || 0}`,
          `.${((stats.vsRHP?.battingAvg || 0) * 1000)
            .toFixed(0)
            .padStart(3, "0")}`,
          `.${((stats.vsRHP?.onBasePercentage || 0) * 1000)
            .toFixed(0)
            .padStart(3, "0")}`,
          `.${((stats.vsRHP?.wOBA || 0) * 1000).toFixed(0).padStart(3, "0")}`,
        ],
        [
          "vs LHP",
          `${stats.vsLHP?.PA || 0}`,
          `.${((stats.vsLHP?.battingAvg || 0) * 1000)
            .toFixed(0)
            .padStart(3, "0")}`,
          `.${((stats.vsLHP?.onBasePercentage || 0) * 1000)
            .toFixed(0)
            .padStart(3, "0")}`,
          `.${((stats.vsLHP?.wOBA || 0) * 1000).toFixed(0).padStart(3, "0")}`,
        ],
      ];

      const tableWidth = createTable(
        rightStats,
        0,
        0,
        rightCols,
        rightRows,
        45,
        22,
        "#BBDEFB",
        "#90CAF9"
      );

      const addRowClick = (rowIndex, hand) => {
        rightStats
          .append("rect")
          .attr("x", 0)
          .attr("y", rowIndex * 22 + 22)
          .attr("width", tableWidth)
          .attr("height", 22)
          .attr("fill", "transparent")
          .attr("cursor", "pointer")
          .on("click", (event) => {
            event.stopPropagation();
            setHandFilter((prev) => {
              const onlyR = prev.R && !prev.L;
              const onlyL = prev.L && !prev.R;
              if (hand === 'R') {
                return onlyR ? { L: true, R: true } : { L: false, R: true };
              } else {
                return onlyL ? { L: true, R: true } : { L: true, R: false };
              }
            });
          });
      };
      addRowClick(1, 'R');
      addRowClick(2, 'L');
      const isOverall = handFilter.L && handFilter.R;
      const isROnly = handFilter.R && !handFilter.L;
      const isLOnly = handFilter.L && !handFilter.R;
      const highlightRow = (rowIndex, active) => {
        const rect = rightStats
          .append("rect")
          .attr("x", 0)
          .attr("y", rowIndex * 22 + 22)
          .attr("width", tableWidth)
          .attr("height", 22)
          .attr("rx", 3)
          .attr("ry", 3)
          .attr("fill", active ? "#E6F0FF" : "transparent")
          .attr("stroke", active ? "#3B82F6" : "none")
          .attr("pointer-events", "none");
        rect.lower();
      };
      highlightRow(0, isOverall);
      highlightRow(1, isROnly);
      highlightRow(2, isLOnly);
    }
  }, [playerData, aggregates, width, height, selectedZones, handFilter, selectedCells]);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && playerData) {
        const forceUpdate = {};
        setPlayerData({ ...playerData, ...forceUpdate });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [playerData]);

  if (loading) {
    return null;
  }

  if (error && !playerData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="text-xl font-bold mb-2">Error loading data</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  
  const containerWidth = svgRef.current?.parentElement?.clientWidth || width;

  const clearZones = () => setSelectedZones([]);

  const exportToSVG = () => {
    try {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const clonedSvg = svgEl.cloneNode(true);
      
      const rect = svgEl.getBoundingClientRect();
      clonedSvg.setAttribute('width', Math.max(800, Math.floor(rect.width)));
      clonedSvg.setAttribute('height', Math.max(600, Math.floor(rect.height)));
      clonedSvg.setAttribute('viewBox', `0 0 ${Math.max(800, Math.floor(rect.width))} ${Math.max(600, Math.floor(rect.height))}`);
      
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', '#F5FBFF');
      clonedSvg.insertBefore(background, clonedSvg.firstChild);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${(playerData?.player_name || 'spraychart').replace(/\s+/g,'_')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export SVG', e);
    }
  };

  const exportToJPG = () => {
    try {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const clonedSvg = svgEl.cloneNode(true);
      
      const rect = svgEl.getBoundingClientRect();
      const width = Math.max(800, Math.floor(rect.width));
      const height = Math.max(600, Math.floor(rect.height));
      clonedSvg.setAttribute('width', width);
      clonedSvg.setAttribute('height', height);
      clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', '#F5FBFF');
      clonedSvg.insertBefore(background, clonedSvg.firstChild);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#F5FBFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${(playerData?.player_name || 'spraychart').replace(/\s+/g,'_')}.jpg`;
          a.click();
          URL.revokeObjectURL(a.href);
        }, 'image/jpeg', 0.95);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error('Failed to export JPG', e);
    }
  };

  return (
    <div className="w-full">
      {containerWidth < 400 && playerData && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-gray-600">Overall Stats</div>
              <div>PA: {aggregates?.stats?.PA || 0}</div>
              <div>BA: .{(((aggregates?.stats?.battingAvg || 0)) * 1000).toFixed(0).padStart(3, "0")}</div>
              <div>wOBA: .{(((aggregates?.stats?.wOBA || 0)) * 1000).toFixed(0).padStart(3, "0")}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-gray-600">Spray Pattern</div>
              <div>Pull: {aggregates?.stats?.batted?.pull || 0}%</div>
              <div>Middle: {aggregates?.stats?.batted?.middle || 0}%</div>
              <div>Oppo: {aggregates?.stats?.batted?.oppo || 0}%</div>
            </div>
          </div>
        </div>
      )}
  
      <div
        className="w-full"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          border: "1px solid #90CAF9",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#F5FBFF",
          padding: containerWidth < 400 ? "4px" : "8px",
        }}
      >
        <div className="mb-3 px-3 pt-3 pb-2 border-b border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-800">
              {selectedZones.length === 0 ? "All balls in play" : `Filtered: ${selectedZones.join(", ")}`}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={clearZones} 
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear Zones
              </button>
              <button 
                onClick={() => exportToSVG()} 
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Export SVG
              </button>
              <button 
                onClick={() => exportToJPG()} 
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Export JPG
              </button>
            </div>
          </div>
          
          {/* Pitcher Filter Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600">vs Pitcher:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setHandFilter({ L: true, R: true })}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  handFilter.L && handFilter.R
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHandFilter({ L: false, R: true })}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  handFilter.R && !handFilter.L
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                RHP
              </button>
              <button
                onClick={() => setHandFilter({ L: true, R: false })}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  handFilter.L && !handFilter.R
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                LHP
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {handFilter.L && handFilter.R 
                ? "Showing all pitchers" 
                : handFilter.R 
                ? "Right-handed pitchers only" 
                : "Left-handed pitchers only"
              }
            </div>
          </div>
        </div>
        <div className="px-3 pb-3">
          <svg
            ref={svgRef}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className="spray-chart"
            style={{ 
              display: "block", 
              maxHeight: containerWidth < 400 ? "350px" : "570px",
              height: "auto"
            }}
          />
        </div>
      </div>
  
      {containerWidth < 400 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-semibold text-gray-600 mb-2">Field Zones</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="inline-block w-3 h-3 bg-red-400 rounded mr-2"></span>
              High frequency (40%+)
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-red-200 rounded mr-2"></span>
              Medium frequency (17-39%)
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-red-100 rounded mr-2"></span>
              Low frequency (&lt;17%)
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-600 rounded-full mr-2"></span>
              Home run count
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprayChart;
