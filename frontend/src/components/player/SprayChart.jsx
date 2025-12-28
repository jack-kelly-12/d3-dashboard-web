import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import { useSprayChartData, normalizeZone } from "./useSprayChartData";
import SprayChartStats from "./SprayChartStats";

const SprayChart = ({ width = 600, height = 240, playerId, year, division }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  const {
    playerData,
    aggregates,
    loading,
    error,
    selectedZones,
    setSelectedZones,
    handFilter,
    setHandFilter,
    clearZones,
  } = useSprayChartData(playerId, year, division);

  useEffect(() => {
    if (!svgRef.current || !playerData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const { outfieldZones: outfieldZoneData, infieldZones: infieldZoneData } = aggregates;

    const margin = { top: 40, right: 10, bottom: 0, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#F5FBFF");

    const field = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const centerX = innerWidth / 2;
    const centerY = innerHeight;
    const arcRadius = Math.min(innerWidth * 0.38, innerHeight * 0.85);
    const infieldRadius = arcRadius * 0.52;

    drawInfield(field, { centerX, centerY, infieldRadius, infieldZoneData, selectedZones, setSelectedZones });
    drawOutfield(field, { centerX, centerY, arcRadius, infieldRadius, outfieldZoneData, selectedZones, setSelectedZones });

    svg.on("click", () => setSelectedZones([]));
  }, [playerData, aggregates, width, height, selectedZones, setSelectedZones]);

  if (loading) return null;

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

  const zoneText = selectedZones.length === 0
    ? "All zones"
    : `Zones: ${selectedZones.map(normalizeZone).join(", ")}`;
  const handText = handFilter.L && handFilter.R ? "" : (handFilter.R ? "vs RHP" : "vs LHP");
  const filterText = handText ? `${zoneText} • ${handText}` : zoneText;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        ref={containerRef}
        className="border border-blue-200 rounded-lg shadow-md bg-blue-50/30 overflow-hidden"
      >
        <ChartHeader
          playerData={playerData}
          filterText={filterText}
          clearZones={clearZones}
          handFilter={handFilter}
          setHandFilter={setHandFilter}
          containerRef={containerRef}
        />

        <div className="px-3 py-2">
          <svg
            ref={svgRef}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className="block"
          />
        </div>

        <SprayChartStats
          stats={aggregates.stats}
          handFilter={handFilter}
          setHandFilter={setHandFilter}
        />
      </div>
    </div>
  );
};

const ChartHeader = ({ playerData, filterText, clearZones, handFilter, setHandFilter, containerRef }) => {
  const exportChart = async () => {
    const container = containerRef.current;
    if (!container) return;

    const exportBtn = container.querySelector('[data-export-btn]');
    if (exportBtn) exportBtn.style.display = 'none';

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#F5FBFF',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const filename = `${(playerData?.player_name || 'spraychart').replace(/\s+/g, '_')}.jpg`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    } finally {
      if (exportBtn) exportBtn.style.display = '';
    }
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{playerData?.player_name}</h2>
            <p className="text-sm text-gray-600">{playerData?.playerInfo}</p>
            <p className="text-xs text-gray-500 mt-1">{filterText}</p>
          </div>
          <button
            data-export-btn
            onClick={exportChart}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Export
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-blue-200 bg-white/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Filter:</span>
          {['All', 'RHP', 'LHP'].map((label) => {
            const isActive =
              (label === 'All' && handFilter.L && handFilter.R) ||
              (label === 'RHP' && handFilter.R && !handFilter.L) ||
              (label === 'LHP' && handFilter.L && !handFilter.R);

            return (
              <button
                key={label}
                onClick={() => {
                  if (label === 'All') setHandFilter({ L: true, R: true });
                  else if (label === 'RHP') setHandFilter({ L: false, R: true });
                  else setHandFilter({ L: true, R: false });
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={clearZones}
          className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Clear Zones
        </button>
      </div>
    </div>
  );
};

const drawInfield = (field, { centerX, centerY, infieldRadius, infieldZoneData, selectedZones, setSelectedZones }) => {
  const pie = d3.pie()
    .startAngle(-0.785398)
    .endAngle(0.785398)
    .value(() => 1)
    .sort(null);

  const arc = d3.arc().innerRadius(0).outerRadius(infieldRadius);
  const slices = pie([1, 1, 1, 1, 1]);

  slices.forEach((slice, i) => {
    const zone = infieldZoneData[i];
    const percentage = zone?.percentage || 0;
    const zoneId = zone?.id || `infield-${i}`;
    const isSelected = selectedZones.includes(zoneId);
    const isDimmed = selectedZones.length > 0 && !isSelected;

    const fillColor = getHeatColor(percentage, 'infield');

    field.append("path")
      .attr("d", arc(slice))
      .attr("transform", `translate(${centerX},${centerY})`)
      .attr("fill", isDimmed ? "#E5E7EB" : fillColor)
      .attr("stroke", "#333")
      .attr("stroke-width", isSelected ? 2 : 0.5)
      .attr("opacity", isDimmed ? 0.15 : 1)
      .attr("cursor", "pointer")
      .on("click", (e) => {
        e.stopPropagation();
        setSelectedZones((prev) =>
          prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]
        );
      });

    if (percentage > 0 && !isDimmed) {
      const angle = (slice.startAngle + slice.endAngle) / 2;
      const textR = infieldRadius * 0.6;
      field.append("text")
        .attr("x", centerX + Math.sin(angle) * textR)
        .attr("y", centerY - Math.cos(angle) * textR)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .text(`${percentage}%`);
    }
  });
};

const drawOutfield = (field, { centerX, centerY, arcRadius, infieldRadius, outfieldZoneData, selectedZones, setSelectedZones }) => {
  const pie = d3.pie()
    .startAngle(-0.785398)
    .endAngle(0.785398)
    .value(() => 1)
    .sort(null);

  const arc = d3.arc().innerRadius(infieldRadius).outerRadius(arcRadius);
  const slices = pie([1, 1, 1]);

  slices.forEach((slice, i) => {
    const zone = outfieldZoneData[i];
    const percentage = zone?.percentage || 0;
    const hrCount = zone?.hrCount || 0;
    const hrPercentage = zone?.hrPercentage || 0;
    const zoneId = zone?.id || `outfield-${i}`;
    const hrZoneId = `${zoneId}-hr`;

    const isSelected = selectedZones.includes(zoneId);
    const isDimmed = selectedZones.length > 0 && !isSelected;
    const isHRSelected = selectedZones.includes(hrZoneId);
    const isHRDimmed = selectedZones.length > 0 && !isHRSelected;

    const fillColor = getHeatColor(percentage, 'outfield');

    field.append("path")
      .attr("d", arc(slice))
      .attr("transform", `translate(${centerX},${centerY})`)
      .attr("fill", isDimmed ? "#E5E7EB" : fillColor)
      .attr("stroke", "#333")
      .attr("stroke-width", isSelected ? 2.5 : 1)
      .attr("opacity", isDimmed ? 0.15 : 0.95)
      .attr("cursor", "pointer")
      .on("click", (e) => {
        e.stopPropagation();
        setSelectedZones((prev) =>
          prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]
        );
      });

    const angle = (slice.startAngle + slice.endAngle) / 2;
    const textR = (infieldRadius + arcRadius) / 2;

    if (!isDimmed) {
      field.append("text")
        .attr("x", centerX + Math.sin(angle) * textR)
        .attr("y", centerY - Math.cos(angle) * textR)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "18px")
        .attr("fill", "#333")
        .text(`${percentage}%`);
    }

    const hrRadius = arcRadius * 1.18;
    const hrX = centerX + Math.sin(angle) * hrRadius;
    const hrY = centerY - Math.cos(angle) * hrRadius;
    const circleR = 15;

    field.append("circle")
      .attr("cx", hrX)
      .attr("cy", hrY)
      .attr("r", circleR)
      .attr("fill", isHRDimmed ? "#E5E7EB" : "#E1F5FE")
      .attr("stroke", isHRSelected ? "#1565C0" : "#0D47A1")
      .attr("stroke-width", isHRSelected ? 2.5 : 1.5)
      .attr("opacity", isHRDimmed ? 0.15 : 1)
      .attr("cursor", "pointer")
      .on("click", (e) => {
        e.stopPropagation();
        setSelectedZones((prev) =>
          prev.includes(hrZoneId) ? prev.filter((z) => z !== hrZoneId) : [...prev, hrZoneId]
        );
      });

    if (!isHRDimmed) {
      field.append("text")
        .attr("x", hrX)
        .attr("y", hrY - 6)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "7px")
        .attr("font-weight", "500")
        .attr("fill", "#0D47A1")
        .attr("opacity", 0.8)
        .text(`${hrPercentage}%`);

      field.append("text")
        .attr("x", hrX)
        .attr("y", hrY + 7)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "10px")
        .attr("fill", "#0D47A1")
        .text(hrCount);
    }
  });
};

const getHeatColor = (percentage, type) => {
  if (type === 'infield') {
    if (percentage >= 40) return "#FF9999";
    if (percentage >= 25) return "#FFCCCC";
    if (percentage > 0) return "#FFE4E1";
    return "#FFFFFF";
  }
  if (percentage >= 50) return "#FF6666";
  if (percentage >= 33) return "#FF9999";
  if (percentage >= 17) return "#FFCCCC";
  return "#FFE4E1";
};

export default SprayChart;
