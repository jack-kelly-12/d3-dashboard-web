import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { LineChartPDF } from "../components/charting/pdf/LineChartPDF";

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
  subtitle: {
    fontSize: 18,
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
    fontSize: 8,
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

const TTOReport = ({ charts = [], pitchers = [] }) => {
  if (!charts.length || !pitchers.length) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No data available to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  const calculateTTO = (pitches) => {
    const batterAppearances = {};

    // Create a deep copy of pitches to modify
    const enrichedPitches = pitches.map((pitch) => ({ ...pitch }));

    // Sort pitches by inning and timestamp
    enrichedPitches.sort((a, b) => {
      if (a.inning === b.inning) {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      return a.inning - b.inning;
    });

    // Calculate TTO for each pitch and modify the pitch object
    enrichedPitches.forEach((pitch) => {
      const batterId = pitch.batter?.name; // Using name as ID since that's what we have
      if (!batterId) return;

      if (!batterAppearances[batterId]) {
        batterAppearances[batterId] = {
          count: 1,
          lastInning: pitch.inning,
        };
        pitch.tto = 1;
      } else if (pitch.inning !== batterAppearances[batterId].lastInning) {
        batterAppearances[batterId].count++;
        batterAppearances[batterId].lastInning = pitch.inning;
        pitch.tto = batterAppearances[batterId].count;
      } else {
        pitch.tto = batterAppearances[batterId].count;
      }
    });

    return enrichedPitches;
  };

  const aggregateVelocityByInning = (pitches) => {
    const velocityMap = new Map();

    pitches.forEach((pitch) => {
      const inning = pitch.inning;
      if (!velocityMap.has(inning)) {
        velocityMap.set(inning, []);
      }
      if (pitch.velocity && !isNaN(pitch.velocity)) {
        velocityMap.get(inning).push(Number(pitch.velocity));
      }
    });

    const velocityData = [];
    velocityMap.forEach((velocities, inning) => {
      const avgVelocity =
        velocities.reduce((sum, vel) => sum + vel, 0) / velocities.length;
      velocityData.push({ inning, avgVelocity });
    });

    return velocityData.sort((a, b) => a.inning - b.inning);
  };

  const pages = pitchers
    .flatMap((pitcherName) => {
      const pitcherPitches = charts.flatMap((chart) =>
        chart.pitches.filter((pitch) => pitch.pitcher?.name === pitcherName)
      );

      return ["left", "right"].map((batterHand) => {
        const handFilteredPitches = pitcherPitches.filter(
          (pitch) => pitch.batter?.batHand?.toLowerCase() === batterHand
        );

        if (!handFilteredPitches.length) return null;

        const ttoPitches = calculateTTO(handFilteredPitches);
        console.log(ttoPitches);
        const tto1 = ttoPitches.filter((p) => p.tto === 1);
        const tto2 = ttoPitches.filter((p) => p.tto === 2);
        const tto3Plus = ttoPitches.filter((p) => p.tto >= 3);

        const velocityData = aggregateVelocityByInning(handFilteredPitches);

        return (
          <Page
            key={`${pitcherName}-${batterHand}`}
            size="A4"
            orientation="portrait"
            style={styles.page}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{pitcherName} - Advance Report</Text>
                <Text style={styles.subtitle}>
                  vs {batterHand === "left" ? "LHH" : "RHH"}
                </Text>
              </View>
              <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            {/* TTO Tables */}
            {renderTTOTable("1 TTO", tto1)}
            {renderTTOTable("2 TTO", tto2)}
            {renderTTOTable("3+ TTO", tto3Plus)}

            {/* Velocity Line Chart */}
            <View style={{ marginTop: 10 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}
              >
                Average Velocity by Inning
              </Text>
              <LineChartPDF data={velocityData} width={500} height={200} />
            </View>

            <Text style={styles.footer}>
              Generated by D3 Dashboard • {new Date().toLocaleDateString()}
            </Text>
          </Page>
        );
      });
    })
    .filter(Boolean);

  return <Document>{pages}</Document>;
};

const renderTTOTable = (title, pitches) => {
  const pitchMetrics = processPitchData(pitches);

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
        {title}
      </Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          {[
            "Pitch Type",
            "Count",
            "Usage %",
            "Avg Velo",
            "Max Velo",
            "Zone%",
            "CSW%",
            "HardHit%",
          ].map((header, i) => (
            <Text
              key={i}
              style={[styles.tableCell, { fontWeight: "bold", fontSize: 9 }]}
            >
              {header}
            </Text>
          ))}
        </View>
        {Object.entries(pitchMetrics).map(([type, data]) => (
          <View key={type} style={styles.tableRow}>
            <Text style={styles.tableCell}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
            <Text style={styles.tableCell}>{data.count}</Text>
            <Text style={styles.tableCell}>{data.usage}%</Text>
            <Text style={styles.tableCell}>{data.avgVelo}</Text>
            <Text style={styles.tableCell}>{data.maxVelo}</Text>
            <Text style={styles.tableCell}>{data.zoneRate}%</Text>
            <Text style={styles.tableCell}>{data.cswRate}%</Text>
            <Text style={styles.tableCell}>{data.hardHitRate}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const processPitchData = (pitches) => {
  return pitches.reduce((acc, pitch) => {
    const type = pitch.type?.toUpperCase() || "UNKNOWN";

    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalVelo: 0,
        velocities: [],
        pitches: [],
        results: {
          ball: 0,
          called_strike: 0,
          strikeout_looking: 0,
          strikeout_swinging: 0,
          swinging_strike: 0,
          foul: 0,
          in_play: 0,
        },
        hardHit: 0,
        battedBalls: 0,
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

    if (pitch.result) {
      acc[type].results[pitch.result] =
        (acc[type].results[pitch.result] || 0) + 1;
    }

    if (pitch.hitDetails?.exitVelocity === "hard") {
      acc[type].hardHit++;
    }

    if (pitch.result === "in_play") {
      acc[type].battedBalls++;
    }

    const data = acc[type];
    data.usage = ((data.count / pitches.length) * 100).toFixed(1);
    data.avgVelo = data.velocities.length
      ? (data.totalVelo / data.velocities.length).toFixed(1)
      : "-";
    data.maxVelo = data.velocities.length
      ? Math.max(...data.velocities).toFixed(1)
      : "-";

    const calledStrikes =
      data.results.called_strike + data.results.strikeout_looking || 0;
    const whiffs =
      data.results.swinging_strike + data.results.strikeout_swinging || 0;
    data.cswRate = (((calledStrikes + whiffs) / data.count) * 100).toFixed(1);

    data.hardHitRate = data.battedBalls
      ? ((data.hardHit / data.battedBalls) * 100).toFixed(1)
      : "0.0";

    const zoneBounds = {
      1: { xMin: -8.5, yMin: 34, xMax: -2.833, yMax: 42 },
      2: { xMin: -2.833, yMin: 34, xMax: 2.833, yMax: 42 },
      3: { xMin: 2.833, yMin: 34, xMax: 8.5, yMax: 42 },
      4: { xMin: -8.5, yMin: 26, xMax: -2.833, yMax: 34 },
      5: { xMin: -2.833, yMin: 26, xMax: 2.833, yMax: 34 },
      6: { xMin: 2.833, yMin: 26, xMax: 8.5, yMax: 34 },
      7: { xMin: -8.5, yMin: 18, xMax: -2.833, yMax: 26 },
      8: { xMin: -2.833, yMin: 18, xMax: 2.833, yMax: 26 },
      9: { xMin: 2.833, yMin: 18, xMax: 8.5, yMax: 26 },
    };

    const isPitchInZone = (x, y, zone) => {
      const bounds = zoneBounds[zone];
      return (
        x >= bounds.xMin &&
        x <= bounds.xMax &&
        y >= bounds.yMin &&
        y <= bounds.yMax
      );
    };

    const inZonePitches = data.pitches.filter((pitch) =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9].some((zone) =>
        isPitchInZone(pitch.x, pitch.y, zone)
      )
    ).length;
    data.zoneRate = ((inZonePitches / data.count) * 100).toFixed(1);

    return acc;
  }, {});
};

export default TTOReport;
