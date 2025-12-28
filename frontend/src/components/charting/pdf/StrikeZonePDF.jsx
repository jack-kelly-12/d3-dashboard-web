import React from "react";
import { Svg, Rect, Line, Circle, Path, Text } from "@react-pdf/renderer";
import { roundTo } from "../../../utils/mathUtils";

export const StrikeZonePDF = ({
  pitches = [],
  width = 150,
  height = 150,
  colors = {
    FB: "#ff6b6b", // Fastball
    fastball: "#ff6b6b", // Fastball
    CB: "#6c5ce7", // Curveball
    curveball: "#6c5ce7", // Curveball
    SL: "#74b9ff", // Slider
    slider: "#74b9ff", // Slider
    CH: "#a8e6cf", // Changeup
    changeup: "#a8e6cf", // Changeup
    SPL: "#ff9ff3", // Splitter
    splitter: "#ff9ff3", // Splitter
    SI: "#feca57", // Sinker
    sinker: "#feca57", // Sinker
    CT: "#ff6f61", // Cutter
    cutter: "#ff6f61", // Cutter
    KN: "#00d2d3", // Knuckleball
    knuckleball: "#00d2d3", // Knuckleball
    called_strike: "#ef4444",
    ball: "#3b82f6",
  },
  showOnlyResults = null,
  colorBy = "type",
  mode = "scatter",
  metrics = null,
}) => {
  const plateWidth = 17;
  const plateDepth = plateWidth * 0.35;
  const strikeZoneHeight = 24;
  const strikeZoneBottom = 1.5 * 12;
  const plotAreaWidth = plateWidth * 2.5;
  const plotAreaHeight = strikeZoneHeight * 2.2;
  const baseballDiameter = 3.5;

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = (x) =>
    ((x + plotAreaWidth / 2) * innerWidth) / plotAreaWidth + margin.left;
  const yScale = (y) =>
    ((plotAreaHeight - y) * innerHeight) / plotAreaHeight + margin.top;

  const BALL_WIDTH = 2.9;
  const ZONE_BOUNDS = {
    standard: {
      11: {
        xMin: -8.5 - BALL_WIDTH * 1.25,
        xMax: -8.5 + BALL_WIDTH * 1.25,
        yMin: 42 - BALL_WIDTH * 1.25,
        yMax: 42 + BALL_WIDTH * 1.25,
      }, // Top left
      12: {
        xMin: -8.5 + BALL_WIDTH * 1.25,
        xMax: 8.5 - BALL_WIDTH * 1.25,
        yMin: 42 - BALL_WIDTH * 1.25,
        yMax: 42 + BALL_WIDTH * 1.25,
      }, // Top
      13: {
        xMin: 8.5 - BALL_WIDTH * 1.25,
        xMax: 8.5 + BALL_WIDTH * 1.25,
        yMin: 42 - BALL_WIDTH * 1.25,
        yMax: 42 + BALL_WIDTH * 1.25,
      },
      14: {
        xMin: -8.5 - BALL_WIDTH * 1.25,
        xMax: -8.5 + BALL_WIDTH * 1.25,
        yMin: 18 + BALL_WIDTH * 1.25,
        yMax: 42 - BALL_WIDTH * 1.25,
      }, // Left
      16: {
        xMin: 8.5 - BALL_WIDTH * 1.25,
        xMax: 8.5 + BALL_WIDTH * 1.25,
        yMin: 18 + BALL_WIDTH * 1.25,
        yMax: 42 - BALL_WIDTH * 1.25,
      }, // Right
      17: {
        xMin: -8.5 - BALL_WIDTH * 1.25,
        xMax: -8.5 + BALL_WIDTH * 1.25,
        yMin: 18 - BALL_WIDTH * 1.25,
        yMax: 18 + BALL_WIDTH * 1.25,
      }, // Bottom left
      18: {
        xMin: -8.5 + BALL_WIDTH * 1.25,
        xMax: 8.5 - BALL_WIDTH * 1.25,
        yMin: 18 - BALL_WIDTH * 1.25,
        yMax: 18 + BALL_WIDTH * 1.25,
      }, // Bottom
      19: {
        xMin: 8.5 - BALL_WIDTH * 1.25,
        xMax: 8.5 + BALL_WIDTH * 1.25,
        yMin: 18 - BALL_WIDTH * 1.25,
        yMax: 18 + BALL_WIDTH * 1.25,
      }, // Bottom right
    },
  };

  const FRAMING_ZONES = [11, 12, 13, 14, 16, 17, 18, 19];

  const filteredPitches = showOnlyResults
    ? pitches.filter((pitch) => showOnlyResults.includes(pitch.result))
    : pitches;

  const getPitchColor = (pitch) => {
    if (colorBy === "result") return colors[pitch.result] || "#a8a8a8";
    return colors[pitch.type] || "#a8a8a8";
  };

  const getZoneColor = (rate) => {
    if (rate >= 50) return "#ef4444"; // High strike rate
    if (rate >= 25) return "#fb923c"; // Medium strike rate
    return "#3b82f6"; // Low strike rate
  };

  const drawZoneBox = (zone, stats) => {
    const bounds = ZONE_BOUNDS.standard[zone];
    const x = xScale(bounds.xMin);
    const y = yScale(bounds.yMax);
    const width = xScale(bounds.xMax) - xScale(bounds.xMin);
    const height = yScale(bounds.yMin) - yScale(bounds.yMax);
    const strikeRate = parseFloat(stats?.strikeRate || 0);

    return (
      <React.Fragment key={zone}>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getZoneColor(strikeRate)}
          fillOpacity={0.6}
          stroke="#4b5563"
          strokeWidth={0.5}
        />
        <Text
          x={x + width / 2}
          y={y + height / 2}
          style={{
            fontSize: 11, // Increased font size
            fill: "#ffffff",
            textAnchor: "middle", // Center text horizontally
            dominantBaseline: "middle", // Center text vertically
            fontWeight: "bold",
          }}
        >
          {roundTo(zone, 1)}
        </Text>
      </React.Fragment>
    );
  };

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height + 20}`}>
      {/* Background Grid */}
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <Line
            x1={margin.left + (i * innerWidth) / 5}
            x2={margin.left + (i * innerWidth) / 5}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="#f0f0f0"
            strokeWidth={0.5}
          />
          <Line
            x1={margin.left}
            x2={width - margin.right}
            y1={margin.top + (i * innerHeight) / 5}
            y2={margin.top + (i * innerHeight) / 5}
            stroke="#f0f0f0"
            strokeWidth={0.5}
          />
        </React.Fragment>
      ))}

      {/* Home Plate */}
      <Path
        d={`
          M ${xScale(-plateWidth / 2)} ${yScale(-2)}  
          L ${xScale(0)} ${yScale(-plateDepth / 2 - 2)} 
          L ${xScale(plateWidth / 2)} ${yScale(-2)}  
          L ${xScale(plateWidth / 2)} ${yScale(plateDepth / 4 - 2)}  
          L ${xScale(-plateWidth / 2)} ${yScale(plateDepth / 4 - 2)} 
          Z
        `}
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth={1}
      />

      {/* Strike Zone Box */}
      <Rect
        x={xScale(-plateWidth / 2)}
        y={yScale(strikeZoneHeight + strikeZoneBottom)}
        width={xScale(plateWidth / 2) - xScale(-plateWidth / 2)}
        height={
          yScale(strikeZoneBottom) - yScale(strikeZoneHeight + strikeZoneBottom)
        }
        fill="none"
        stroke="#2563eb"
        strokeWidth={1}
      />

      {/* Zone Grid Lines */}
      {[1, 2].map((i) => (
        <React.Fragment key={`lines-${i}`}>
          <Line
            x1={xScale(-plateWidth / 2)}
            x2={xScale(plateWidth / 2)}
            y1={yScale(
              strikeZoneHeight + strikeZoneBottom - (i * strikeZoneHeight) / 3
            )}
            y2={yScale(
              strikeZoneHeight + strikeZoneBottom - (i * strikeZoneHeight) / 3
            )}
            stroke="#93c5fd"
            strokeWidth={0.5}
          />
          <Line
            x1={xScale(-plateWidth / 2 + (i * plateWidth) / 3)}
            x2={xScale(-plateWidth / 2 + (i * plateWidth) / 3)}
            y1={yScale(strikeZoneBottom)}
            y2={yScale(strikeZoneHeight + strikeZoneBottom)}
            stroke="#93c5fd"
            strokeWidth={0.5}
          />
        </React.Fragment>
      ))}

      {mode === "zones" && metrics
        ? FRAMING_ZONES.map((zone) =>
            drawZoneBox(zone, metrics.zoneStats[zone])
          )
        : filteredPitches.map((pitch, i) => (
            <Circle
              key={i}
              cx={xScale(pitch.location.x)}
              cy={yScale(pitch.location.y)}
              r={baseballDiameter}
              fill={getPitchColor(pitch)}
              stroke="white"
              strokeWidth={0.5}
              opacity={0.8}
            />
          ))}
    </Svg>
  );
};
