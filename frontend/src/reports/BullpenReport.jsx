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
    width: "12.5%",
    fontSize: 10,
    textAlign: "center",
  },
  strikeZoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  strikeZoneContainer: {
    width: "32%",
    marginBottom: 10,
    border: 1,
    borderColor: "#000000",
    padding: 5,
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

const ZONE_BOUNDS = {
  standard: {
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
  },
  "rh-7-zone": {
    1: { xMin: -8.5, xMax: 8.5, yMin: 42, yMax: 46 },
    2: { xMin: -8.5 - 1.45, xMax: -8.5 + 1.45, yMin: 18, yMax: 42 },
    3: { xMin: -8.5, xMax: -2.833, yMin: 18, yMax: 26 },
    4: { xMin: -2.833, xMax: 2.833, yMin: 18, yMax: 26 },
    5: { xMin: -8.5, xMax: 8.5, yMin: 10, yMax: 18 },
    6: { xMin: 2.833, xMax: 8.5, yMin: 18, yMax: 26 },
    7: { xMin: 8.5 - 1.45, xMax: 8.5 + 1.45, yMin: 18, yMax: 42 },
  },
};

const STRIKE_ZONE = {
  plateHalfWidth: 8.5,
  bottom: 18,
  top: 42,
  baseballRadius: 1.45,
};

const isPitchInZone = (x, y, zone, zoneType = "standard") => {
  const bounds = ZONE_BOUNDS[zoneType]?.[zone];
  if (!bounds) return false;
  const { xMin, xMax, yMin, yMax } = bounds;
  return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
};

const calculateZoneCenter = (zone, zoneType = "standard") => {
  const bounds = ZONE_BOUNDS[zoneType]?.[zone];
  if (!bounds) return { x: 0, y: 0 };
  const { xMin, xMax, yMin, yMax } = bounds;
  return {
    x: (xMin + xMax) / 2,
    y: (yMin + yMax) / 2,
  };
};

const isInStrikeZone = (x, y) => {
  const { plateHalfWidth, bottom, top, baseballRadius } = STRIKE_ZONE;
  return (
    Math.abs(x) <= plateHalfWidth + baseballRadius &&
    y + baseballRadius >= bottom &&
    y - baseballRadius <= top
  );
};

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
};

const calculatePitchMetrics = (pitches, totalPitches) => {
  const metrics = {
    count: pitches.length,
    usage: ((pitches.length / totalPitches) * 100).toFixed(1),
    velocities: pitches
      .filter((p) => p.velocity && !isNaN(Number(p.velocity)))
      .map((p) => Number(p.velocity)),
    inZoneCount: 0,
    strikeCount: 0,
    missedZoneCount: 0,
    totalMissDistance: 0,
    pitchesWithIntendedZone: 0,
  };

  metrics.avgVelo = metrics.velocities.length
    ? (
        metrics.velocities.reduce((a, b) => a + b, 0) /
        metrics.velocities.length
      ).toFixed(1)
    : "-";
  metrics.maxVelo = metrics.velocities.length
    ? Math.max(...metrics.velocities).toFixed(1)
    : "-";

  pitches.forEach((pitch) => {
    if (pitch.location && isInStrikeZone(pitch.location.x, pitch.location.y)) {
      metrics.strikeCount++;
    }

    if (pitch.intendedZone && pitch.location) {
      metrics.pitchesWithIntendedZone++;
      const center = calculateZoneCenter(pitch.intendedZone, pitch.zoneType);

      if (
        isPitchInZone(
          pitch.location.x,
          pitch.location.y,
          pitch.intendedZone,
          pitch.zoneType
        )
      ) {
        metrics.inZoneCount++;
      } else {
        metrics.missedZoneCount++;
        metrics.totalMissDistance += Math.sqrt(
          Math.pow(pitch.location.x - center.x, 2) +
            Math.pow(pitch.location.y - center.y, 2)
        );
      }
    }
  });

  metrics.accuracy = metrics.pitchesWithIntendedZone
    ? ((metrics.inZoneCount / metrics.pitchesWithIntendedZone) * 100).toFixed(1)
    : "-";
  metrics.strikeRate = ((metrics.strikeCount / metrics.count) * 100).toFixed(1);
  metrics.avgMissDistance = metrics.missedZoneCount
    ? (metrics.totalMissDistance / metrics.missedZoneCount).toFixed(2)
    : "-";

  return metrics;
};

const TableHeaders = () => (
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
        style={[styles.tableCell, { fontWeight: "bold", fontSize: 9 }]}
      >
        {header}
      </Text>
    ))}
  </View>
);

const BullpenReportPDF = ({ charts = [] }) => {
  const pitcherData = charts.reduce((acc, chart) => {
    const pitcherName = chart.pitcher?.name || "Unknown Pitcher";
    if (!acc[pitcherName]) {
      acc[pitcherName] = {
        charts: [],
        latestDate: chart.date,
      };
    }
    acc[pitcherName].charts.push(chart);
    if (new Date(chart.date) > new Date(acc[pitcherName].latestDate)) {
      acc[pitcherName].latestDate = chart.date;
    }
    return acc;
  }, {});

  return (
    <Document>
      {Object.entries(pitcherData).map(([pitcher, { charts, latestDate }]) => {
        const allPitches = charts.flatMap((chart) =>
          (chart.pitches || []).map((pitch) => ({
            ...pitch,
            zoneType: chart.zoneType,
          }))
        );

        // Group by pitch type
        const pitchTypes = allPitches.reduce((acc, pitch) => {
          const type = pitch.type?.toUpperCase() || "UNKNOWN";
          if (!acc[type]) acc[type] = [];
          acc[type].push(pitch);
          return acc;
        }, {});

        // Calculate metrics for each pitch type
        const processedTypes = Object.entries(pitchTypes).map(
          ([type, pitches]) => ({
            type,
            ...calculatePitchMetrics(pitches, allPitches.length),
            pitches,
          })
        );

        // Split into chunks of 6 for pagination
        const chunks = processedTypes.reduce((acc, type, i) => {
          const chunkIndex = Math.floor(i / 6);
          if (!acc[chunkIndex]) acc[chunkIndex] = [];
          acc[chunkIndex].push(type);
          return acc;
        }, []);

        return chunks.map((chunk, pageIndex) => (
          <Page
            key={`${pitcher}-${pageIndex}`}
            size="A4"
            orientation="portrait"
            style={styles.page}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{pitcher} - Bullpen Report</Text>
              <Text style={styles.date}>
                {new Date(latestDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.table}>
              <TableHeaders />
              {chunk.map(
                ({
                  type,
                  count,
                  usage,
                  avgVelo,
                  maxVelo,
                  strikeRate,
                  accuracy,
                  avgMissDistance,
                }) => (
                  <View key={type} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{toTitleCase(type)}</Text>
                    <Text style={styles.tableCell}>{count}</Text>
                    <Text style={styles.tableCell}>{usage}%</Text>
                    <Text style={styles.tableCell}>{avgVelo}</Text>
                    <Text style={styles.tableCell}>{maxVelo}</Text>
                    <Text style={styles.tableCell}>{strikeRate}%</Text>
                    <Text style={styles.tableCell}>{accuracy}%</Text>
                    <Text style={styles.tableCell}>{avgMissDistance} in.</Text>
                  </View>
                )
              )}
            </View>

            <View style={styles.strikeZoneGrid}>
              {chunk.map(({ type, pitches }) => (
                <View key={type} style={styles.strikeZoneContainer}>
                  <Text style={styles.strikeZoneTitle}>
                    {toTitleCase(type)}
                  </Text>
                  <StrikeZonePDF pitches={pitches} width={150} height={150} />
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
