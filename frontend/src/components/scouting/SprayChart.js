import React, { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        const data = await fetchAPI(
          `/spraychart-data/${playerId}?year=${year}&division=${division}`
        );

        const counts = data.counts || {};
        const splits = data.splits_data || {};
        const battedBall = data.batted_ball_data || {};

        const totalOutfield =
          (counts.to_lf || "-") +
          (counts.to_cf || "-") +
          (counts.to_rf || "-") +
          (counts.to_lf_hr || "-") +
          (counts.to_cf_hr || "-") +
          (counts.to_rf_hr || "-");

        const leftFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_lf || "-") + (counts.to_lf_hr || "-")) /
                totalOutfield) *
                100
            )
          : 0;
        const centerFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_cf || "-") + (counts.to_cf_hr || "-")) /
                totalOutfield) *
                100
            )
          : 0;
        const rightFieldPct = totalOutfield
          ? Math.round(
              (((counts.to_rf || "-") + (counts.to_rf_hr || "-")) /
                totalOutfield) *
                100
            )
          : 0;

        const totalInfield =
          (counts.to_3b || "-") +
          (counts.to_ss || "-") +
          (counts.up_middle || "-") +
          (counts.to_2b || "-") +
          (counts.to_1b || "-");

        const thirdBasePct = totalInfield
          ? Math.round(((counts.to_3b || "-") / totalInfield) * 100)
          : 0;
        const shortstopPct = totalInfield
          ? Math.round(((counts.to_ss || "-") / totalInfield) * 100)
          : 0;
        const upMiddlePct = totalInfield
          ? Math.round(((counts.up_middle || "-") / totalInfield) * 100)
          : 0;
        const secondBasePct = totalInfield
          ? Math.round(((counts.to_2b || "-") / totalInfield) * 100)
          : 0;
        const firstBasePct = totalInfield
          ? Math.round(((counts.to_1b || "-") / totalInfield) * 100)
          : 0;

        const bats = data.bats || battedBall.batter_hand || "-";
        const team = data.team_name || battedBall.Team || "-";

        const playerInfo = `${
          bats ? bats.substring(0, 1) : "-"
        } | ${year} | ${team}`;

        const battingAvg = splits.BA_Overall || "-";
        const PA = splits.PA_Overall || "-";
        const onBasePercentage = splits.OBP_Overall || "-";
        const wOBA = splits.wOBA_Overall || "-";

        const vspRhpBa = splits["BA_vs RHP"] || "-";
        const vspRhpPA = splits["PA_vs RHP"] || "-";
        const vsRhpObp = splits["OBP_vs RHP"] || "-";
        const vsRhpWoba = splits["wOBA_vs RHP"] || "-";

        const vsLhpBa = splits["BA_vs LHP"] || "-";
        const vsLhpPA = splits["PA_vs LHP"] || "-";
        const vsLhpObp = splits["OBP_vs LHP"] || "-";
        const vsLhpWoba = splits["wOBA_vs LHP"] || "-";

        const airPct = battedBall.gb_pct
          ? 100 - Math.round(parseFloat(battedBall.gb_pct))
          : 0;
        const groundPct = battedBall.gb_pct
          ? Math.round(parseFloat(battedBall.gb_pct))
          : 0;
        const pullPct = battedBall.pull_pct
          ? Math.round(parseFloat(battedBall.pull_pct))
          : 0;
        const middlePct = battedBall.middle_pct
          ? Math.round(parseFloat(battedBall.middle_pct))
          : 0;
        const oppoPct = battedBall.oppo_pct
          ? Math.round(parseFloat(battedBall.oppo_pct))
          : 0;
        const pullAirPct = battedBall.pull_air_pct
          ? Math.round(parseFloat(battedBall.pull_air_pct))
          : 0;
        const backspinGbPct = battedBall.oppo_gb_pct
          ? Math.round(parseFloat(battedBall.oppo_gb_pct))
          : 0;

        const processedData = {
          player_name: data.player_name || data.Player || "Player Name",
          playerInfo: playerInfo,
          stats: {
            battingAvg: parseFloat(battingAvg),
            PA: parseInt(PA),
            onBasePercentage: parseFloat(onBasePercentage),
            wOBA: parseFloat(wOBA),
            hits: {
              singles: counts.singles || "-",
              doubles: counts.doubles || "-",
              triples: counts.triples || "-",
              homeRuns:
                (counts.to_lf_hr || "-") +
                (counts.to_cf_hr || "-") +
                (counts.to_rf_hr || "-"),
            },
            fieldOuts: counts.field_outs || "-",
            groundOuts: counts.ground_outs || "-",
            lineOuts: counts.line_outs || "-",
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
              strikeouts: counts.strikeouts || "-",
              walks: counts.walks || "-",
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
              hrCount: counts.to_lf_hr || "-",
            },
            {
              id: "center-field",
              percentage: centerFieldPct,
              hrCount: counts.to_cf_hr || "-",
            },
            {
              id: "right-field",
              percentage: rightFieldPct,
              hrCount: counts.to_rf_hr || "-",
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
  }, [playerId, year, division]);

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

    const isSmallScreen = chartWidth < 600;
    const isTinyScreen = chartWidth < 450;

    const margin = isTinyScreen
      ? { top: 40, right: 10, bottom: 20, left: 10 }
      : { top: 60, right: 20, bottom: 120, left: 20 };

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

    const headerHeight = isTinyScreen ? 60 : 80;

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
        `translate(${margin.left}, ${isTinyScreen ? 15 : 20})`
      );

    const titleFontSize = isTinyScreen
      ? "14px"
      : isSmallScreen
      ? "16px"
      : "18px";
    const subtitleFontSize = isTinyScreen
      ? "10px"
      : isSmallScreen
      ? "12px"
      : "14px";

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
      .attr("y", isTinyScreen ? 30 : 35)
      .attr("font-size", subtitleFontSize)
      .attr("fill", "#2C3E50")
      .text(playerInfo);

    header
      .append("g")
      .attr("transform", `translate(${innerWidth - 60}, 0)`) // Position in top right
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
      const percentage = outfieldZoneData[i]?.percentage || "-";

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

      const percentageFontSize = isTinyScreen
        ? "18px"
        : isSmallScreen
        ? "22px"
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

      const circleRadius = isTinyScreen ? 10 : isSmallScreen ? 12 : 15;

      if (!isTinyScreen || outfieldZoneData[i]?.hrCount > 0) {
        field
          .append("circle")
          .attr("cx", numberX)
          .attr("cy", numberY)
          .attr("r", circleRadius)
          .attr("fill", "#E1F5FE")
          .attr("stroke", "#0D47A1")
          .attr("stroke-width", 1.5);
      }

      const hrCount = outfieldZoneData[i]?.hrCount || "-";

      if (!isTinyScreen || hrCount > 0) {
        const hrFontSize = isTinyScreen
          ? "12px"
          : isSmallScreen
          ? "14px"
          : "16px";

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
      const percentage = infieldZoneData[i]?.percentage || "-";

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
        const infieldFontSize = isTinyScreen
          ? "8px"
          : isSmallScreen
          ? "9px"
          : "11px";

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

    if (!isTinyScreen) {
      const statsContainer = svg
        .append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

      statsContainer
        .append("rect")
        .attr("x", margin.left)
        .attr("y", -5)
        .attr("width", innerWidth - margin.right)
        .attr("height", isSmallScreen ? 90 : 115)
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
            .attr("font-size", "8px")
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
            g.append("text")
              .attr("x", x + j * cellWidth + cellWidth / 2)
              .attr("y", rowY + cellHeight / 2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "10px")
              .attr("fill", "#333")
              .text(cell);
          });
        });

        return tableWidth;
      };

      if (isSmallScreen) {
        const smallCellWidth = 32;
        const smallCellHeight = 18;

        const batsTable = statsContainer
          .append("g")
          .attr("transform", `translate(${margin.left + 10}, 5)`);

        const batsCols = ["Air", "Gnd", "Pull", "Oppo", "Mid"];

        const batsRows = [
          [
            `${stats.batted?.air || "-"}%`,
            `${stats.batted?.ground || "-"}%`,
            `${stats.batted?.pull || "-"}%`,
            `${stats.batted?.oppo || "-"}%`,
            `${stats.batted?.middle || "-"}%`,
          ],
        ];

        createTable(
          batsTable,
          0,
          0,
          batsCols,
          batsRows,
          smallCellWidth,
          smallCellHeight,
          "#BBDEFB",
          "#90CAF9"
        );

        const statsTable = statsContainer
          .append("g")
          .attr(
            "transform",
            `translate(${margin.left + 10}, ${smallCellHeight * 2})`
          );

        const statCols = ["", "BA", "OBP"];
        const statRows = [
          [
            "All",
            `.${((stats.battingAvg || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.onBasePercentage || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
          ],
          [
            "RHP",
            `.${((stats.vsRHP?.battingAvg || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.vsRHP?.onBasePercentage || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
          ],
        ];

        createTable(
          statsTable,
          0,
          0,
          statCols,
          statRows,
          40,
          smallCellHeight,
          "#BBDEFB",
          "#90CAF9"
        );
      } else {
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
            `${stats.batted?.air || "-"}%`,
            `${stats.batted?.ground || "-"}%`,
            `${stats.batted?.pull || "-"}%`,
            `${stats.batted?.middle || "-"}%`,
            `${stats.batted?.oppo || "-"}%`,
            `${stats.batted?.pullAir || "-"}%`,
            `${stats.batted?.backspinGroundball || "-"}%`,
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
            `${stats.PA || "-"}`,
            `.${((stats.battingAvg || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.onBasePercentage || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.wOBA || "-") * 1000).toFixed(0).padStart(3, "0")}`,
          ],
          [
            "vs RHP",
            `${stats.vsRHP?.PA || "-"}`,
            `.${((stats.vsRHP?.battingAvg || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.vsRHP?.onBasePercentage || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.vsRHP?.wOBA || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
          ],
          [
            "vs LHP",
            `${stats.vsLHP?.PA || "-"}`,
            `.${((stats.vsLHP?.battingAvg || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.vsLHP?.onBasePercentage || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
            `.${((stats.vsLHP?.wOBA || "-") * 1000)
              .toFixed(0)
              .padStart(3, "0")}`,
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

  return (
    <div
      className="w-full"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        border: "1px solid #90CAF9",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#F5FBFF",
        padding: "8px",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        className="spray-chart"
        style={{ display: "block", maxHeight: "570px" }}
      />
    </div>
  );
};

export default SprayChart;
