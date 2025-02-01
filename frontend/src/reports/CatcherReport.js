import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { StrikeZonePDF } from "../components/charting/pdf/StrikeZonePDF";
import { roundTo } from "../utils/mathUtils";

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
    width: "25%", // 4 columns
    fontSize: 10,
    textAlign: "center",
  },
  zoneAnalysisGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  zoneSection: {
    width: "100%",
    marginBottom: 15,
    border: 1,
    borderColor: "#000000",
    padding: 10,
  },
  zoneSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  strikeZoneContainer: {
    width: "100%",
    height: 300,
    marginTop: 10,
  },
  summarySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#F3F4F6",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  visualizationContainer: {
    flexDirection: "row",
    justifyContent: "center", // Center the container horizontally
    alignItems: "center", // Center the container vertically
    gap: 20,
    marginBottom: 20,
  },
  zoneBox: {
    flex: 1,
    padding: 10,
    border: 1,
    borderColor: "#000000",
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

const isPitchInZone = (x, y, zone, zoneType = "standard") => {
  const bounds = ZONE_BOUNDS[zoneType]?.[zone];
  if (!bounds) return false;
  const { xMin, xMax, yMin, yMax } = bounds;
  return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
};

const isPitchInFramingZone = (pitch) => {
  return FRAMING_ZONES.some((zone) =>
    isPitchInZone(
      pitch.location.x,
      pitch.location.y,
      zone,
      pitch.zoneType || "standard"
    )
  );
};

const calculateFramingMetrics = (pitches) => {
  // First filter for only called strikes and balls
  const relevantPitches = pitches.filter(
    (pitch) => pitch.result === "called_strike" || pitch.result === "ball"
  );

  // Then filter for framing zones
  const framingPitches = relevantPitches.filter((pitch) =>
    isPitchInFramingZone(pitch)
  );

  const metrics = {
    totalPitches: framingPitches.length,
    zoneStats: {},
  };

  FRAMING_ZONES.forEach((zone) => {
    const zonePitches = framingPitches.filter((pitch) =>
      isPitchInZone(pitch.location.x, pitch.location.y, zone)
    );

    const calledStrikes = zonePitches.filter(
      (pitch) => pitch.result === "called_strike"
    );
    const calledBalls = zonePitches.filter((pitch) => pitch.result === "ball");

    metrics.zoneStats[zone] = {
      total: zonePitches.length,
      calledStrikes: calledStrikes.length,
      calledBalls: calledBalls.length,
      framingRuns:
        zonePitches.length > 0
          ? (calledStrikes.length * 0.125 - calledBalls.length * 0.125).toFixed(
              1
            )
          : "0.0",
      strikeRate:
        zonePitches.length > 0
          ? ((calledStrikes.length / zonePitches.length) * 100).toFixed(1)
          : "0.0",
    };
  });

  return metrics;
};

const TableHeaders = () => (
  <View style={[styles.tableRow, styles.tableHeader]}>
    {[
      "Zone",
      "Total Pitches",
      "Called Strikes",
      "Strike Rate",
      "Framing Runs",
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

const CatcherReport = ({ charts = [] }) => {
  const catcherData = charts.reduce((acc, chart) => {
    const catcherName = chart.catcher?.name || "Unknown Catcher";
    if (!acc[catcherName]) {
      acc[catcherName] = {
        charts: [],
        latestDate: chart.date,
      };
    }
    acc[catcherName].charts.push(chart);
    if (new Date(chart.date) > new Date(acc[catcherName].latestDate)) {
      acc[catcherName].latestDate = chart.date;
    }
    return acc;
  }, {});

  return (
    <Document>
      {Object.entries(catcherData).map(([catcher, { charts, latestDate }]) => {
        const allPitches = charts.flatMap((chart) =>
          (chart.pitches || []).map((pitch) => ({
            ...pitch,
            zoneType: chart.zoneType,
          }))
        );

        const metrics = calculateFramingMetrics(allPitches);
        const framingPitches = allPitches.filter((pitch) =>
          isPitchInFramingZone(pitch)
        );

        return (
          <Page
            key={catcher}
            size="A4"
            orientation="portrait"
            style={styles.page}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{catcher} - Framing Report</Text>
              <Text style={styles.date}>
                {new Date(latestDate).toLocaleDateString()}
              </Text>
            </View>

            {/* Overall Metrics Table */}
            <View style={styles.table}>
              <TableHeaders />
              {FRAMING_ZONES.map((zone) => {
                const stats = metrics.zoneStats[zone];
                return (
                  <View key={zone} style={styles.tableRow}>
                    <Text style={styles.tableCell}>Zone {zone}</Text>
                    <Text style={styles.tableCell}>{stats.total}</Text>
                    <Text style={styles.tableCell}>{stats.calledStrikes}</Text>
                    <Text style={styles.tableCell}>{stats.strikeRate}%</Text>
                    <Text style={styles.tableCell}>
                      {roundTo(stats.framingRuns, 1)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Strike Zone Visualization */}
            <View style={styles.visualizationContainer}>
              <View style={styles.zoneBox}>
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <StrikeZonePDF
                    pitches={framingPitches}
                    width={250}
                    height={250}
                    mode="zones"
                    metrics={metrics}
                  />
                </View>
              </View>

              <View style={styles.zoneBox}>
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <StrikeZonePDF
                    pitches={framingPitches}
                    width={250}
                    height={250}
                    colorBy="result"
                    showOnlyResults={["called_strike", "ball"]}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.footer}>
              Generated by D3 Dashboard • {new Date().toLocaleDateString()}
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export default CatcherReport;
