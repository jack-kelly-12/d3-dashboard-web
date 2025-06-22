import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { fetchAPI } from "../../config/api";

// Create a cache object outside the component to persist between renders
const apiCache = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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

  // Create a memoized cache key based on the dependencies
  const cacheKey = useMemo(
    () => `spraychart-${playerId}-${year}-${division}`,
    [playerId, year, division]
  );

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);

      try {
        const cachedData = apiCache.get(cacheKey);
        const now = Date.now();

        if (cachedData && now - cachedData.timestamp < CACHE_EXPIRATION) {
          setPlayerData(cachedData.data);
          setError(null);
          setLoading(false);
          return;
        }

        const data = await fetchAPI(
          `/spraychart-data/${playerId}?year=${year}&division=${division}`
        );

        const counts = data.counts || {};
        const splits = data.splits_data || {};
        const battedBall = data.batted_ball_data || {};

        const totalOutfield =
          (counts.to_lf || 0) +
          (counts.to_cf || 0) +
          (counts.to_rf || 0) +
          (counts.to_lf_hr || 0) +
          (counts.to_cf_hr || 0) +
          (counts.to_rf_hr || 0);

        const leftFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_lf || 0) + (counts.to_lf_hr || 0)) / totalOutfield) *
                100
            )
          : 0;
        const centerFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_cf || 0) + (counts.to_cf_hr || 0)) / totalOutfield) *
                100
            )
          : 0;
        const rightFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_rf || 0) + (counts.to_rf_hr || 0)) / totalOutfield) *
                100
            )
          : 0;

        const totalInfield =
          (counts.to_3b || 0) +
          (counts.to_ss || 0) +
          (counts.up_middle || 0) +
          (counts.to_2b || 0) +
          (counts.to_1b || 0);

        const thirdBasePct = totalInfield
          ? Math.round(((counts.to_3b || 0) / totalInfield) * 100)
          : 0;
        const shortstopPct = totalInfield
          ? Math.round(((counts.to_ss || 0) / totalInfield) * 100)
          : 0;
        const upMiddlePct = totalInfield
          ? Math.round(((counts.up_middle || 0) / totalInfield) * 100)
          : 0;
        const secondBasePct = totalInfield
          ? Math.round(((counts.to_2b || 0) / totalInfield) * 100)
          : 0;
        const firstBasePct = totalInfield
          ? Math.round(((counts.to_1b || 0) / totalInfield) * 100)
          : 0;

        const bats = data.bats || battedBall.batter_hand || "-";
        const team = data.team_name || battedBall.Team || "-";

        const playerInfo = `${
          bats ? bats.substring(0, 1) : "-"
        } | ${year} | ${team}`;

        const battingAvg = splits.BA_Overall || 0;
        const PA = splits.PA_Overall || 0;
        const onBasePercentage = splits.OBP_Overall || 0;
        const wOBA = splits.wOBA_Overall || 0;

        const vspRhpBa = splits["BA_vs RHP"] || 0;
        const vspRhpPA = splits["PA_vs RHP"] || 0;
        const vsRhpObp = splits["OBP_vs RHP"] || 0;
        const vsRhpWoba = splits["wOBA_vs RHP"] || 0;

        const vsLhpBa = splits["BA_vs LHP"] || 0;
        const vsLhpPA = splits["PA_vs LHP"] || 0;
        const vsLhpObp = splits["OBP_vs LHP"] || 0;
        const vsLhpWoba = splits["wOBA_vs LHP"] || 0;

        const airPct = battedBall.gb_pct
          ? 100 - Math.round(parseFloat(battedBall.gb_pct))
          : "-";
        const groundPct = battedBall.gb_pct
          ? Math.round(parseFloat(battedBall.gb_pct))
          : "-";
        const pullPct = battedBall.pull_pct
          ? Math.round(parseFloat(battedBall.pull_pct))
          : "-";
        const middlePct = battedBall.middle_pct
          ? Math.round(parseFloat(battedBall.middle_pct))
          : "-";
        const oppoPct = battedBall.oppo_pct
          ? Math.round(parseFloat(battedBall.oppo_pct))
          : "-";
        const pullAirPct = battedBall.pull_air_pct
          ? Math.round(parseFloat(battedBall.pull_air_pct))
          : "-";
        const backspinGbPct = battedBall.oppo_gb_pct
          ? Math.round(parseFloat(battedBall.oppo_gb_pct))
          : "-";

        const processedData = {
          player_name: data.player_name || data.Player || "Player Name",
          playerInfo: playerInfo,
          stats: {
            battingAvg: parseFloat(battingAvg),
            PA: parseInt(PA),
            onBasePercentage: parseFloat(onBasePercentage),
            wOBA: parseFloat(wOBA),
            hits: {
              singles: counts.singles || 0,
              doubles: counts.doubles || 0,
              triples: counts.triples || 0,
              homeRuns:
                (counts.to_lf_hr || 0) +
                (counts.to_cf_hr || 0) +
                (counts.to_rf_hr || 0),
            },
            fieldOuts: counts.field_outs || 0,
            groundOuts: counts.ground_outs || 0,
            lineOuts: counts.line_outs || 0,
            batted: {
              air: airPct,
              ground: groundPct,
              pull: pullPct,
              oppo: oppoPct,
              middle: middlePct,
              pullAir: pullAirPct,
              backspinGroundball: backspinGbPct,
            },
            extraStats: {
              strikeouts: counts.strikeouts || 0,
              walks: counts.walks || 0,
              stolenBases: 0,
              caughtStealing: 0,
            },
            vsRHP: {
              battingAvg: parseFloat(vspRhpBa),
              PA: parseInt(vspRhpPA),
              onBasePercentage: parseFloat(vsRhpObp),
              wOBA: parseFloat(vsRhpWoba),
              strikeouts: 0,
              walks: 0,
            },
            vsLHP: {
              battingAvg: parseFloat(vsLhpBa),
              PA: parseInt(vsLhpPA),
              onBasePercentage: parseFloat(vsLhpObp),
              wOBA: parseFloat(vsLhpWoba),
              strikeouts: 0,
              walks: 0,
            },
          },
          outfieldZones: [
            {
              id: "left-field",
              percentage: leftFieldPct,
              hrCount: counts.to_lf_hr || 0,
            },
            {
              id: "center-field",
              percentage: centerFieldPct,
              hrCount: counts.to_cf_hr || 0,
            },
            {
              id: "right-field",
              percentage: rightFieldPct,
              hrCount: counts.to_rf_hr || 0,
            },
          ],
          infieldZones: [
            { id: "third-base", percentage: thirdBasePct },
            { id: "shortstop", percentage: shortstopPct },
            { id: "second-base", percentage: secondBasePct },
            { id: "first-base", percentage: firstBasePct },
            { id: "up-the-middle", percentage: upMiddlePct },
          ],
        };

        apiCache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
        });

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
  }, [cacheKey, division, playerId, year]);

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

    const title = playerData.player_name || playerData.Player || "Player Name";
    const playerInfo = playerData.playerInfo || "-";
    const stats = playerData.stats || {};
    const outfieldZoneData = playerData.outfieldZones || [];
    const infieldZoneData = playerData.infieldZones || [];

    const isVerySmallScreen = chartWidth < 400;
    const isSmallScreen = chartWidth < 600;

    const margin =
      isVerySmallScreen || isSmallScreen
        ? { top: 80, right: 10, bottom: 30, left: 10 }
        : { top: 80, right: 20, bottom: 120, left: 20 };

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

    const headerHeight = isVerySmallScreen ? 60 : 80;

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
        `translate(${margin.left}, ${isVerySmallScreen ? 15 : 20})`
      );

    const titleFontSize = isVerySmallScreen
      ? "14px"
      : isSmallScreen
      ? "16px"
      : "20px";
    const subtitleFontSize = isVerySmallScreen
      ? "12px"
      : isSmallScreen
      ? "14px"
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
      .innerRadius(0)
      .outerRadius(arcRadius)
      .context(null);

    outfieldSlices.forEach((slice, i) => {
      const percentage = outfieldZoneData[i]?.percentage || 0;

      let fillColor = "#FFE4E1";
      if (percentage >= 50) {
        fillColor = "#FF6666";
      } else if (percentage >= 33) {
        fillColor = "#FF9999";
      } else if (percentage >= 17) {
        fillColor = "#FFCCCC";
      }

      field
        .append("path")
        .attr("d", outfieldArc(slice))
        .attr("transform", `translate(${centerX}, ${centerY})`)
        .attr("fill", fillColor)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("opacity", 0.9)
        .raise();

      const textAngle = (slice.startAngle + slice.endAngle) / 2;
      const textRadius = arcRadius * 0.7;
      const textX = centerX + Math.sin(textAngle) * textRadius;
      const textY = centerY - Math.cos(textAngle) * textRadius;

      const percentageFontSize = isVerySmallScreen
        ? "12px"
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
        .text(`${percentage}%`);

      const numberAngle = (slice.startAngle + slice.endAngle) / 2;
      const numberRadius = arcRadius * 1.15;
      const numberX = centerX + Math.sin(numberAngle) * numberRadius;
      const numberY = centerY - Math.cos(numberAngle) * numberRadius;

      const circleRadius = isVerySmallScreen ? 12 : isSmallScreen ? 15 : 18;

      if (!isVerySmallScreen || outfieldZoneData[i]?.hrCount > 0) {
        field
          .append("circle")
          .attr("cx", numberX)
          .attr("cy", numberY)
          .attr("r", circleRadius)
          .attr("fill", "#E1F5FE")
          .attr("stroke", "#0D47A1")
          .attr("stroke-width", 1.5);
      }

      const hrCount = outfieldZoneData[i]?.hrCount || 0;

      if (!isVerySmallScreen || hrCount > 0) {
        const hrFontSize = isVerySmallScreen
          ? "14px"
          : isSmallScreen
          ? "16px"
          : "18px";

        field
          .append("text")
          .attr("x", numberX)
          .attr("y", numberY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-weight", "bold")
          .attr("font-size", hrFontSize)
          .attr("fill", "#0D47A1")
          .text(hrCount);
      }
    });

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

      let fillColor = "#FFFFFF";
      if (percentage > 0 && percentage < 25) {
        fillColor = "#FFE4E1";
      } else if (percentage >= 25 && percentage < 40) {
        fillColor = "#FFCCCC";
      } else if (percentage >= 40) {
        fillColor = "#FF9999";
      }

      field
        .append("path")
        .attr("d", infieldArc(slice))
        .attr("transform", `translate(${centerX},${centerY})`)
        .attr("fill", fillColor)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5);

      const textAngle = (slice.startAngle + slice.endAngle) / 2;
      const textRadius = infieldRadius * 0.65;
      const textX = centerX + Math.sin(textAngle) * textRadius;
      const textY = centerY - Math.cos(textAngle) * textRadius;

      if (percentage > 0) {
        const infieldFontSize = isVerySmallScreen
          ? "8px"
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
          .text(`${percentage}%`);
      }
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
            // Increased cell font size
            g.append("text")
              .attr("x", x + j * cellWidth + cellWidth / 2)
              .attr("y", rowY + cellHeight / 2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "12px")
              .attr("fill", "#333")
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

      createTable(
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
    }
  }, [playerData, width, height]);

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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

  return (
    <div className="w-full">
      {/* Mobile stats summary - only show on very small screens */}
      {containerWidth < 400 && playerData && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-gray-600">Overall Stats</div>
              <div>PA: {playerData.stats.PA || 0}</div>
              <div>BA: .{((playerData.stats.battingAvg || 0) * 1000).toFixed(0).padStart(3, "0")}</div>
              <div>wOBA: .{((playerData.stats.wOBA || 0) * 1000).toFixed(0).padStart(3, "0")}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-gray-600">Spray Pattern</div>
              <div>Pull: {playerData.stats.batted?.pull || 0}%</div>
              <div>Middle: {playerData.stats.batted?.middle || 0}%</div>
              <div>Oppo: {playerData.stats.batted?.oppo || 0}%</div>
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
  
      {/* Mobile legend - only show on very small screens */}
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
