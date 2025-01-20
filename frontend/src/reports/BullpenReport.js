import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { StrikeZonePDF } from "../components/charting/pdf/StrikeZonePDF";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  date: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    width: "12.5%", // Adjusted width to fit 8 columns
    fontSize: 10,
    textAlign: "center",
  },
  strikeZoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Distribute plots evenly
    alignItems: "center", // Center the plots vertically
    marginBottom: 20,
  },
  strikeZoneContainer: {
    width: "32%", // Adjusted width to fit 3 plots per row with less space
    marginBottom: 10, // Add margin between rows
    border: 1,
    borderColor: "#000000",
    padding: 5, // Reduce padding to minimize white space
  },
  strikeZoneTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 10,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: "#f3f4f6",
  },
});

const processPitchData = (charts, pitcher) => {
  const allPitches = charts.reduce((pitches, chart) => {
    if (chart.pitcher?.name === pitcher) {
      const pitchesWithZoneType = (chart.pitches || []).map((pitch) => ({
        ...pitch,
        zoneType: chart.zoneType,
      }));
      return [...pitches, ...pitchesWithZoneType];
    }
    return pitches;
  }, []);

  // Standard 9+4 zone bounds
  const standardZoneBounds = {
    1: { xMin: -8.5, yMin: 34, xMax: -2.833, yMax: 42 },
    2: { xMin: -2.833, yMin: 34, xMax: 2.833, yMax: 42 },
    3: { xMin: 2.833, yMin: 34, xMax: 8.5, yMax: 42 },
    4: { xMin: -8.5, yMin: 26, xMax: -2.833, yMax: 34 },
    5: { xMin: -2.833, yMin: 26, xMax: 2.833, yMax: 34 },
    6: { xMin: 2.833, yMin: 26, xMax: 8.5, yMax: 34 },
    7: { xMin: -8.5, yMin: 18, xMax: -2.833, yMax: 26 },
    8: { xMin: -2.833, yMin: 18, xMax: 2.833, yMax: 26 },
    9: { xMin: 2.833, yMin: 18, xMax: 8.5, yMax: 26 },
    11: { xMin: -14.167, yMin: 18, xMax: -8.5, yMax: 42 },
    12: { xMin: -8.5, yMin: 42, xMax: 8.5, yMax: 50 },
    13: { xMin: -8.5, yMin: 10, xMax: 8.5, yMax: 18 },
    14: { xMin: 8.5, yMin: 18, xMax: 14.167, yMax: 42 },
  };

  // RH 7-zone bounds
  const rhSevenZoneBounds = {
    1: { xMin: -8.5, xMax: 8.5, yMin: 42, yMax: 46 }, // Top of Zone
    2: { xMin: -8.5 - 1.45, xMax: -8.5 + 1.45, yMin: 18, yMax: 42 }, // Inside to RHH (1 ball off)
    3: { xMin: -8.5, xMax: -2.833, yMin: 18, yMax: 26 }, // Low Inside Corner
    4: { xMin: -2.833, xMax: 2.833, yMin: 18, yMax: 26 }, // Strike Bottom
    5: { xMin: -8.5, xMax: 8.5, yMin: 10, yMax: 18 }, // Chase Below
    6: { xMin: 2.833, xMax: 8.5, yMin: 18, yMax: 26 }, // Low Outside Corner
    7: { xMin: 8.5 - 1.45, xMax: 8.5 + 1.45, yMin: 18, yMax: 42 }, // Outside to RHH (1 ball off)
  };

  const isPitchInZone = (x, y, zone, zoneType) => {
    const bounds =
      zoneType === "rh-7-zone"
        ? rhSevenZoneBounds[zone]
        : standardZoneBounds[zone];

    if (!bounds) return false;

    return (
      x >= bounds.xMin &&
      x <= bounds.xMax &&
      y >= bounds.yMin &&
      y <= bounds.yMax
    );
  };

  const calculateZoneCenter = (zone, zoneType) => {
    const bounds =
      zoneType === "rh-7-zone"
        ? rhSevenZoneBounds[zone]
        : standardZoneBounds[zone];
    if (!bounds) return { x: 0, y: 0 };

    return {
      x: (bounds.xMin + bounds.xMax) / 2,
      y: (bounds.yMin + bounds.yMax) / 2,
    };
  };

  const isInStrikeZone = (x, y) => {
    const plateHalfWidth = 8.5;
    const strikeZoneBottom = 18;
    const strikeZoneTop = 42;
    const baseballRadius = 1.45;

    const ballOverlapsX = Math.abs(x) <= plateHalfWidth + baseballRadius;
    const ballOverlapsY =
      y + baseballRadius >= strikeZoneBottom &&
      y - baseballRadius <= strikeZoneTop;

    return ballOverlapsX && ballOverlapsY;
  };

  const pitchTypes = allPitches.reduce((acc, pitch) => {
    const type = pitch.type?.toUpperCase() || "UNKNOWN";
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalVelo: 0,
        velocities: [],
        pitches: [],
        totalMissDistance: 0,
        inZoneCount: 0,
        strikeCount: 0,
        missedZoneCount: 0,
        pitchesWithIntendedZone: 0,
      };
    }

    acc[type].count++;
    acc[type].pitches.push(pitch);

    if (pitch.velocity) {
      const velocity = Number(pitch.velocity);
      if (!isNaN(velocity)) {
        acc[type].velocities.push(velocity);
        acc[type].totalVelo += velocity;
      }
    }

    if (pitch.location && isInStrikeZone(pitch.location.x, pitch.location.y)) {
      acc[type].strikeCount++;
    }

    if (pitch.intendedZone && pitch.location) {
      const zoneType = pitch.zoneType || "standard";
      acc[type].pitchesWithIntendedZone++;

      const { x: centerX, y: centerY } = calculateZoneCenter(
        pitch.intendedZone,
        zoneType
      );

      const inZone = isPitchInZone(
        pitch.location.x,
        pitch.location.y,
        pitch.intendedZone,
        zoneType
      );

      if (inZone) {
        acc[type].inZoneCount++;
      } else {
        const missDistance = Math.sqrt(
          Math.pow(pitch.location.x - centerX, 2) +
            Math.pow(pitch.location.y - centerY, 2)
        );
        acc[type].totalMissDistance += missDistance;
        acc[type].missedZoneCount++;
      }
    }

    return acc;
  }, {});

  // Calculate metrics for each pitch type
  Object.keys(pitchTypes).forEach((type) => {
    const data = pitchTypes[type];
    data.usage = ((data.count / allPitches.length) * 100).toFixed(1);
    data.avgVelo = data.velocities.length
      ? (data.totalVelo / data.count).toFixed(1)
      : "-";
    data.minVelo = data.velocities.length
      ? Math.min(...data.velocities).toFixed(1)
      : "-";
    data.maxVelo = data.velocities.length
      ? Math.max(...data.velocities).toFixed(1)
      : "-";

    data.accuracy = data.pitchesWithIntendedZone
      ? ((data.inZoneCount / data.pitchesWithIntendedZone) * 100).toFixed(1)
      : "-";

    data.avgMissDistance = data.missedZoneCount
      ? (data.totalMissDistance / data.missedZoneCount).toFixed(2)
      : "-";

    data.strikeRate = data.count
      ? ((data.strikeCount / data.count) * 100).toFixed(1)
      : "-";
  });

  return pitchTypes;
};

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

const BullpenReportPDF = ({ charts = [], pitchers = [] }) => {
  return (
    <Document>
      {pitchers.map((pitcher) => {
        const pitchMetrics = processPitchData(charts, pitcher);
        const latestChart = charts.find((c) => c.pitcher?.name === pitcher);
        const reportDate = latestChart?.date
          ? new Date(latestChart.date).toLocaleDateString()
          : new Date().toLocaleDateString();

        const pitchTypeChunks = Object.entries(pitchMetrics).reduce(
          (acc, pitchType, index) => {
            const chunkIndex = Math.floor(index / 6);
            if (!acc[chunkIndex]) {
              acc[chunkIndex] = [];
            }
            acc[chunkIndex].push(pitchType);
            return acc;
          },
          []
        );

        return pitchTypeChunks.map((chunk, chunkIndex) => (
          <Page
            key={`${pitcher}-${chunkIndex}`}
            size="A4"
            orientation="portrait"
            style={styles.page}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{pitcher} - Bullpen Report</Text>
              <Text style={styles.date}>{reportDate}</Text>
            </View>

            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {[
                  "Pitch Type",
                  "Count",
                  "Usage %",
                  "Avg Velo",
                  "Max Velo",
                  "Strike%",
                  "Accuracy%",
                  "Avg. Miss",
                ].map((header, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.tableCell,
                      { fontWeight: "bold", fontSize: 9 },
                    ]}
                  >
                    {header}
                  </Text>
                ))}
              </View>

              {chunk.map(([type, data]) => (
                <View key={type} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{toTitleCase(type)}</Text>
                  <Text style={styles.tableCell}>{data.count}</Text>
                  <Text style={styles.tableCell}>{data.usage}%</Text>
                  <Text style={styles.tableCell}>{data.avgVelo}</Text>
                  <Text style={styles.tableCell}>{data.maxVelo}</Text>
                  <Text style={styles.tableCell}>{data.strikeRate}</Text>
                  <Text style={styles.tableCell}>{data.accuracy}%</Text>
                  <Text style={styles.tableCell}>
                    {data.avgMissDistance} in.
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.strikeZoneGrid}>
              {chunk.map(([type, data]) => (
                <View key={type} style={styles.strikeZoneContainer}>
                  <Text style={styles.strikeZoneTitle}>
                    {toTitleCase(type)}
                  </Text>
                  <StrikeZonePDF
                    pitches={data.pitches}
                    width={150}
                    height={150}
                  />
                </View>
              ))}
            </View>
            <Text style={styles.footer}>
              Generated by D3 Dashboard • {new Date().toLocaleDateString()}
            </Text>
          </Page>
        ));
      })}
    </Document>
  );
};

export default BullpenReportPDF;
