import React from "react";
import { Svg, Line, Text, G } from "@react-pdf/renderer";

const VelocityHistogramPDF = ({ pitchMetrics }) => {
  const pitchTypes = Object.keys(pitchMetrics);

  return (
    <Svg viewBox="0 0 500 200">
      {/* Title */}
      <Text x={250} y={20} style={{ textAnchor: "middle", fontSize: 12 }}>
        Velocity Distribution
      </Text>

      {/* X-axis */}
      <Line
        x1={50}
        y1={150}
        x2={450}
        y2={150}
        strokeWidth={1}
        stroke="#000000"
      />

      {/* X-axis labels */}
      <Text x={50} y={170}>
        74
      </Text>
      <Text x={150} y={170}>
        78
      </Text>
      <Text x={250} y={170}>
        82
      </Text>
      <Text x={350} y={170}>
        86
      </Text>
      <Text x={450} y={170}>
        90
      </Text>

      {/* Legend */}
      <G>
        <Line
          x1={380}
          y1={30}
          x2={400}
          y2={30}
          stroke="#ff6b6b"
          strokeWidth={1}
        />
        <Text x={410} y={35} style={{ fontSize: 8 }}>
          FASTBALL
        </Text>

        <Line
          x1={380}
          y1={45}
          x2={400}
          y2={45}
          stroke="#ffeead"
          strokeWidth={1}
        />
        <Text x={410} y={50} style={{ fontSize: 8 }}>
          SINKER
        </Text>

        <Line
          x1={380}
          y1={60}
          x2={400}
          y2={60}
          stroke="#4ecdc4"
          strokeWidth={1}
        />
        <Text x={410} y={65} style={{ fontSize: 8 }}>
          CURVEBALL
        </Text>
      </G>
    </Svg>
  );
};

export default VelocityHistogramPDF;
