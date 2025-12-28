import React from "react";
import { Svg, Path, Circle, Line, Text } from "@react-pdf/renderer";

const SprayChartPDF = ({ hits = [], width = 300, height = 300 }) => {
  const margin = { top: 20, right: 10, bottom: 20, left: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scale functions
  const xScale = (x) => ((x + 250) * innerWidth) / 500;
  const yScale = (y) => ((200 - y) * innerHeight) / 250;

  // Field dimensions (scaled down)
  const outfieldRadius = (330 * innerWidth) / 500;
  const infieldRadius = (125 * innerWidth) / 500;

  return (
    <Svg width={width} height={height}>
      {/* Outfield */}
      <Path
        d={`
          M ${xScale(-250)} ${yScale(0)}
          A ${outfieldRadius} ${outfieldRadius} 0 0 1 ${xScale(250)} ${yScale(
          0
        )}
          L ${xScale(0)} ${yScale(0)}
          Z
        `}
        fill="#90EE90"
        stroke="#666"
        strokeWidth={1}
      />

      {/* Infield */}
      <Path
        d={`
          M ${xScale(-95)} ${yScale(51.5)}
          A ${infieldRadius} ${infieldRadius} 0 0 1 ${xScale(95)} ${yScale(
          51.5
        )}
          L ${xScale(0)} ${yScale(0)}
          Z
        `}
        fill="#DEB887"
        stroke="#666"
        strokeWidth={1}
      />

      {/* Plot Hits */}
      {hits.map((hit, i) => (
        <React.Fragment key={i}>
          <Line
            x1={xScale(hit.x)}
            x2={xScale(hit.x)}
            y1={yScale(hit.y) - 6}
            y2={yScale(hit.y) + 6}
            stroke="#666"
            strokeWidth={1}
          />
          <Line
            x1={xScale(hit.x) - 6}
            x2={xScale(hit.x) + 6}
            y1={yScale(hit.y)}
            y2={yScale(hit.y)}
            stroke="#666"
            strokeWidth={1}
          />
          <Circle cx={xScale(hit.x)} cy={yScale(hit.y)} r={3} fill="#666" />
        </React.Fragment>
      ))}

      {/* Field Labels */}
      <Text
        x={xScale(-250) + 10}
        y={yScale(0) - 10}
        style={{ fontSize: 8, fill: "#666" }}
      >
        Left Field
      </Text>
      <Text
        x={xScale(250) - 50}
        y={yScale(0) - 10}
        style={{ fontSize: 8, fill: "#666" }}
      >
        Right Field
      </Text>
      <Text
        x={xScale(0) - 20}
        y={yScale(200) + 15}
        style={{ fontSize: 8, fill: "#666" }}
      >
        Home Plate
      </Text>
    </Svg>
  );
};

export default SprayChartPDF;
