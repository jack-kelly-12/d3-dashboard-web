import React from "react";
import { Svg, Line, Text, Circle } from "@react-pdf/renderer";

export const LineChartPDF = ({ data = [], width = 500, height = 300 }) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const filteredData = data.filter((d) => !isNaN(d.avgVelocity));

  if (filteredData.length === 0) {
    return (
      <Svg width={width} height={height}>
        <Text
          x={width / 2}
          y={height / 2}
          style={{ fontSize: 12, textAnchor: "middle", fill: "#666666" }}
        >
          No valid velocity data available
        </Text>
      </Svg>
    );
  }

  const xValues = filteredData.map((d) => d.inning);

  const xScale = (value) => {
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    return margin.left + ((value - minX) / (maxX - minX || 1)) * innerWidth;
  };

  const yScale = (value) => {
    const minY = 60;
    const maxY = 110;
    return (
      height - margin.bottom - ((value - minY) / (maxY - minY)) * innerHeight
    );
  };

  const yTicks = Array.from({ length: 6 }, (_, i) => 50 + i * 10);

  return (
    <Svg width={width} height={height}>
      {/* Background */}
      <rect
        x={margin.left}
        y={margin.top}
        width={innerWidth}
        height={innerHeight}
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth={0.5}
      />

      {/* Grid Lines */}
      {yTicks.map((tick) => (
        <Line
          key={`grid-${tick}`}
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale(tick)}
          y2={yScale(tick)}
          stroke="#e2e8f0"
          strokeWidth={0.5}
        />
      ))}

      {/* Axes */}
      <Line
        x1={margin.left}
        x2={width - margin.right}
        y1={height - margin.bottom}
        y2={height - margin.bottom}
        stroke="#94a3b8"
        strokeWidth={1}
      />
      <Line
        x1={margin.left}
        x2={margin.left}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke="#94a3b8"
        strokeWidth={1}
      />

      {/* X-axis Labels */}
      {xValues.map((value) => (
        <Text
          key={`x-${value}`}
          x={xScale(value)}
          y={height - margin.bottom + 15}
          style={{ fontSize: 8, textAnchor: "middle", fill: "#64748b" }}
        >
          {value}
        </Text>
      ))}

      {/* Y-axis Labels */}
      {yTicks.map((tick) => (
        <Text
          key={`y-${tick}`}
          x={margin.left - 10}
          y={yScale(tick) + 3}
          style={{ fontSize: 8, textAnchor: "end", fill: "#64748b" }}
        >
          {tick}
        </Text>
      ))}

      {/* Line and Points */}
      {filteredData.map((d, i) => (
        <React.Fragment key={`point-${i}`}>
          {i > 0 && (
            <Line
              x1={xScale(filteredData[i - 1].inning)}
              y1={yScale(filteredData[i - 1].avgVelocity)}
              x2={xScale(d.inning)}
              y2={yScale(d.avgVelocity)}
              stroke="#2563eb"
              strokeWidth={1.5}
            />
          )}
          <Circle
            cx={xScale(d.inning)}
            cy={yScale(d.avgVelocity)}
            r={3}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={1}
          />
        </React.Fragment>
      ))}

      {/* Axis Labels */}
      <Text
        x={width / 2}
        y={height - 5}
        style={{ fontSize: 10, textAnchor: "middle", fill: "#475569" }}
      >
        Inning
      </Text>
      <Text
        x={-height / 2}
        y={15}
        style={{
          fontSize: 10,
          textAnchor: "middle",
          fill: "#475569",
          transform: "rotate(-90)",
        }}
      >
        Velocity (mph)
      </Text>
    </Svg>
  );
};
