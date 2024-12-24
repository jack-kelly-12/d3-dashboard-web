import React from "react";
import { Svg, Rect, Line, Circle, Path } from "@react-pdf/renderer";

export const StrikeZonePDF = ({ pitches = [], width = 150, height = 150 }) => {
  const plateWidth = 17;
  const plateDepth = plateWidth * 0.35;
  const strikeZoneHeight = 24;
  const strikeZoneBottom = 1.5 * 12;
  const plotAreaWidth = plateWidth * 2.5;
  const plotAreaHeight = strikeZoneHeight * 2.2;
  const baseballDiameter = 5;

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = (x) => {
    return ((x + plotAreaWidth / 2) * innerWidth) / plotAreaWidth + margin.left;
  };

  const yScale = (y) => {
    return ((plotAreaHeight - y) * innerHeight) / plotAreaHeight + margin.top;
  };

  const getPitchColor = (type) => {
    const colors = {
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
    };
    return colors[type] || "#a8a8a8"; // Default color if type is not found
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

      {/* Plot Pitches */}
      {pitches.map((pitch, i) => (
        <Circle
          key={i}
          cx={xScale(pitch.location.x)}
          cy={yScale(pitch.location.y)}
          r={baseballDiameter}
          fill={getPitchColor(pitch.type)}
          stroke="white"
          strokeWidth={0.5}
          opacity={0.8}
        />
      ))}
    </Svg>
  );
};
