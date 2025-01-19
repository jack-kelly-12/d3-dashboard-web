import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getPitchColor } from "../../utils/colorUtils";

const StrikeZone = ({
  onPlotPitch,
  pitches,
  currentPitch,
  shouldReset,
  isBullpen,
  isPitcherView,
}) => {
  const svgRef = useRef();
  const [hoverCoords, setHoverCoords] = useState(null);
  const [previewPitch, setPreviewPitch] = useState(null);

  useEffect(() => {
    if (currentPitch.location) {
      setPreviewPitch(currentPitch.location);
    }
  }, [currentPitch.location]);

  useEffect(() => {
    if (shouldReset) {
      setPreviewPitch(null);
      setHoverCoords(null);
    }
  }, [shouldReset]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 650;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    const plateWidth = 17;
    const plateDepth = plateWidth * 0.35;
    const strikeZoneHeight = 24;
    const strikeZoneBottom = 1.5 * 12;
    const plotAreaWidth = plateWidth * 2.5;
    const plotAreaHeight = strikeZoneHeight * 2.2;

    const baseballDiameter = (3 / 17) * plateWidth;
    const crosshairLength = baseballDiameter * 1.2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "plot-area-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    const mainGroup = svg.append("g").attr("clip-path", "url(#plot-area-clip)");

    const grid = mainGroup.append("g").attr("class", "grid");

    const xScale = d3
      .scaleLinear()
      .domain(
        isPitcherView
          ? [plotAreaWidth / 2, -plotAreaWidth / 2] // pitcher's view: left is positive, right is negative
          : [-plotAreaWidth / 2, plotAreaWidth / 2] // batter's view: left is negative, right is positive
      )
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([-plotAreaHeight / 8, (plotAreaHeight * 3) / 3])
      .range([height - margin.bottom, margin.top]);

    const gridSize = 30;
    for (let x = margin.left; x <= width - margin.right; x += gridSize) {
      grid
        .append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }

    for (let y = margin.top; y <= height - margin.bottom; y += gridSize) {
      grid
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }

    const plateLocationOffset = isPitcherView ? -2.3 : 0.5;

    const plateX = (x) => (isPitcherView ? -x : x);
    const plateY = (y) => (isPitcherView ? -y : y);
    mainGroup
      .append("path")
      .attr(
        "d",
        `
        M ${xScale(plateX(-plateWidth / 2))} ${yScale(
          plateY(-plateLocationOffset)
        )}  
        L ${xScale(plateX(0))} ${yScale(
          plateY(-plateDepth / 2 - plateLocationOffset)
        )} 
        L ${xScale(plateX(plateWidth / 2))} ${yScale(
          plateY(-plateLocationOffset)
        )}  
        L ${xScale(plateX(plateWidth / 2))} ${yScale(
          plateY(plateDepth / 4 - plateLocationOffset)
        )}  
        L ${xScale(plateX(-plateWidth / 2))} ${yScale(
          plateY(plateDepth / 4 - plateLocationOffset)
        )} 
        Z
      `
      )
      .attr("fill", "#e5e7eb")
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 2);

    const strikeZoneG = mainGroup.append("g").attr("class", "strike-zone");

    strikeZoneG
      .append("rect")
      .attr(
        "x",
        isPitcherView ? xScale(plateWidth / 2) : xScale(-plateWidth / 2)
      )
      .attr("y", yScale(strikeZoneHeight + strikeZoneBottom))
      .attr(
        "width",
        isPitcherView
          ? xScale(-plateWidth / 2) - xScale(plateWidth / 2)
          : xScale(plateWidth / 2) - xScale(-plateWidth / 2)
      )
      .attr(
        "height",
        yScale(strikeZoneBottom) - yScale(strikeZoneHeight + strikeZoneBottom)
      )
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8,8");

    if (isBullpen) {
      const zoneWidth = (xScale(plateWidth / 2) - xScale(-plateWidth / 2)) / 3;
      const zoneHeight =
        (yScale(strikeZoneBottom) -
          yScale(strikeZoneHeight + strikeZoneBottom)) /
        3;

      for (let i = 1; i < 3; i++) {
        strikeZoneG
          .append("line")
          .attr("x1", xScale(-plateWidth / 2))
          .attr("x2", xScale(plateWidth / 2))
          .attr(
            "y1",
            yScale(
              strikeZoneHeight + strikeZoneBottom - (i * strikeZoneHeight) / 3
            )
          )
          .attr(
            "y2",
            yScale(
              strikeZoneHeight + strikeZoneBottom - (i * strikeZoneHeight) / 3
            )
          )
          .attr("stroke", "#93c5fd")
          .attr("stroke-width", 1);

        strikeZoneG
          .append("line")
          .attr("x1", xScale(-plateWidth / 2 + (i * plateWidth) / 3))
          .attr("x2", xScale(-plateWidth / 2 + (i * plateWidth) / 3))
          .attr("y1", yScale(strikeZoneHeight + strikeZoneBottom))
          .attr("y2", yScale(strikeZoneBottom))
          .attr("stroke", "#93c5fd")
          .attr("stroke-width", 1);
      }

      // For the inner zone numbers (1-9)
      if (isPitcherView) {
        // Count right to left for pitcher's view
        for (let row = 0; row < 3; row++) {
          for (let col = 2; col >= 0; col--) {
            const zoneNum = row * 3 + col + 1;
            const x = xScale(-plateWidth / 2) + col * zoneWidth + zoneWidth / 2;
            const y = yScale(strikeZoneHeight - (row * zoneHeight) / 10 + 14);

            strikeZoneG
              .append("text")
              .attr("x", x)
              .attr("y", y)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "14px")
              .attr("font-weight", "500")
              .attr("fill", "#64748b")
              .text(zoneNum);
          }
        }
      } else {
        // Count left to right for batter's view
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const zoneNum = row * 3 + col + 1;
            const x = xScale(-plateWidth / 2) + col * zoneWidth + zoneWidth / 2;
            const y = yScale(strikeZoneHeight - (row * zoneHeight) / 10 + 14);

            strikeZoneG
              .append("text")
              .attr("x", x)
              .attr("y", y)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "14px")
              .attr("font-weight", "500")
              .attr("fill", "#64748b")
              .text(zoneNum);
          }
        }
      }

      const outsideZones = [
        {
          num: 11,
          x: -plateWidth * 0.75,
          y: strikeZoneHeight / 2 + strikeZoneBottom,
        },
        { num: 12, x: 0, y: strikeZoneHeight * 1.15 + strikeZoneBottom },
        { num: 13, x: 0, y: -strikeZoneHeight * 0.18 + strikeZoneBottom },
        {
          num: 14,
          x: plateWidth * 0.75,
          y: strikeZoneHeight / 2 + strikeZoneBottom,
        },
      ];

      outsideZones.forEach(({ num, x, y }) => {
        strikeZoneG
          .append("text")
          .attr("x", xScale(x))
          .attr("y", yScale(y))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "14px")
          .attr("font-weight", "500")
          .attr("fill", "#64748b")
          .text(num);
      });
    }

    const sections = 3;
    for (let i = 1; i < sections; i++) {
      strikeZoneG
        .append("line")
        .attr("x1", xScale(-plateWidth / 2))
        .attr("x2", xScale(plateWidth / 2))
        .attr(
          "y1",
          yScale(
            strikeZoneHeight +
              strikeZoneBottom -
              (i * strikeZoneHeight) / sections
          )
        )
        .attr(
          "y2",
          yScale(
            strikeZoneHeight +
              strikeZoneBottom -
              (i * strikeZoneHeight) / sections
          )
        )
        .attr("stroke", "#93c5fd")
        .attr("stroke-width", 1);

      strikeZoneG
        .append("line")
        .attr("x1", xScale(-plateWidth / 2 + (plateWidth * i) / sections))
        .attr("x2", xScale(-plateWidth / 2 + (plateWidth * i) / sections))
        .attr("y1", yScale(strikeZoneBottom))
        .attr("y2", yScale(strikeZoneHeight + strikeZoneBottom))
        .attr("stroke", "#93c5fd")
        .attr("stroke-width", 1);
    }

    const drawPitch = (pitch, isPreview = false) => {
      if (!pitch) return;
      const group = svg.append("g");

      group
        .append("line")
        .attr("x1", xScale(pitch.x))
        .attr("x2", xScale(pitch.x))
        .attr("y1", yScale(pitch.y) - crosshairLength)
        .attr("y2", yScale(pitch.y) + crosshairLength)
        .attr("stroke", getPitchColor(pitch.type) || "#94a3b8")
        .attr("stroke-width", 1.5);

      group
        .append("line")
        .attr("x1", xScale(pitch.x) - crosshairLength)
        .attr("x2", xScale(pitch.x) + crosshairLength)
        .attr("y1", yScale(pitch.y))
        .attr("y2", yScale(pitch.y))
        .attr("stroke", getPitchColor(pitch.type) || "#94a3b8")
        .attr("stroke-width", 1.5);

      group
        .append("circle")
        .attr("cx", xScale(pitch.x))
        .attr("cy", yScale(pitch.y))
        .attr(
          "r",
          ((baseballDiameter / 2) * (width - margin.left - margin.right)) /
            plotAreaWidth
        )
        .attr("fill", getPitchColor(pitch.type) || "#94a3b8")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("opacity", isPreview ? 0.6 : 0.8);
    };

    pitches.forEach((pitch) => drawPitch(pitch));

    if (previewPitch && !shouldReset) {
      drawPitch(previewPitch, true);
    }

    const previewGroup = svg
      .append("g")
      .attr("class", "preview")
      .style("display", "none");

    previewGroup
      .append("line")
      .attr("class", "crosshair-v")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    previewGroup
      .append("line")
      .attr("class", "crosshair-h")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    svg.on("mousemove", (event) => {
      const [x, y] = d3.pointer(event);

      if (
        x < margin.left ||
        x > width - margin.right ||
        y < margin.top ||
        y > height - margin.bottom
      ) {
        previewGroup.style("display", "none");
        setHoverCoords(null);
        return;
      }

      const hoverX = xScale.invert(x);
      const hoverY = yScale.invert(y);

      previewGroup.style("display", null);

      previewGroup
        .select(".crosshair-v")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom);

      previewGroup
        .select(".crosshair-h")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y)
        .attr("y2", y);

      setHoverCoords({ x: hoverX, y: hoverY });
    });

    svg.on("mouseleave", () => {
      previewGroup.style("display", "none");
      setHoverCoords(null);
    });

    svg.on("click", (event) => {
      if (shouldReset) return;

      const [x, y] = d3.pointer(event);
      if (
        x < margin.left ||
        x > width - margin.right ||
        y < margin.top ||
        y > height - margin.bottom
      )
        return;

      const pitchX = xScale.invert(x);
      const pitchY = yScale.invert(y);

      const newPitch = { x: pitchX, y: pitchY };
      setPreviewPitch(newPitch);
      onPlotPitch(newPitch);
    });
  }, [
    pitches,
    previewPitch,
    isBullpen,
    onPlotPitch,
    shouldReset,
    isPitcherView,
  ]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-[570px] h-[500px] bg-white rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>
      {hoverCoords && (
        <div className="absolute bottom-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-mono text-gray-600">
          ({hoverCoords.x.toFixed(1)}, {hoverCoords.y.toFixed(1)})
        </div>
      )}
    </div>
  );
};

export default StrikeZone;
