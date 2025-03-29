import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

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
  emptyMessage: {
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    color: "#6b7280",
    padding: 10,
  },
});

const TTOReport = ({ charts = [] }) => {
  if (!charts.length) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No data available to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  const getUniquePitchers = () => {
    const pitcherSet = new Set();
    charts.forEach((chart) => {
      chart.pitches.forEach((pitch) => {
        if (pitch.pitcher?.name) {
          pitcherSet.add(pitch.pitcher.name);
        }
      });
    });
    return Array.from(pitcherSet);
  };

  const pitchers = getUniquePitchers();

  if (!pitchers.length) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No pitcher data available to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  const calculateTTO = (pitches) => {
    const batterAppearances = {};
    const enrichedPitches = pitches.map((pitch) => ({ ...pitch }));

    enrichedPitches.sort((a, b) => {
      if (a.inning !== b.inning) {
        return (a.inning || 0) - (b.inning || 0);
      }
      return new Date(a.time || 0) - new Date(b.time || 0);
    });

    enrichedPitches.forEach((pitch) => {
      const batterName = pitch.batter?.name;

      if (!batterName) return;

      const inning = pitch.inning;
      const topBottom = pitch.topBottom;

      if (inning === undefined || topBottom === undefined) return;

      if (!batterAppearances[batterName]) {
        batterAppearances[batterName] = {
          count: 1,
          lastInning: inning,
          lastTopBottom: topBottom,
        };
        pitch.tto = 1;
      } else if (
        inning !== batterAppearances[batterName].lastInning ||
        topBottom !== batterAppearances[batterName].lastTopBottom
      ) {
        batterAppearances[batterName].count++;
        batterAppearances[batterName].lastInning = inning;
        batterAppearances[batterName].lastTopBottom = topBottom;
        pitch.tto = batterAppearances[batterName].count;
      } else {
        pitch.tto = batterAppearances[batterName].count;
      }
    });

    return enrichedPitches;
  };

  const pages = pitchers
    .flatMap((pitcherName) => {
      const pitcherPitches = charts.flatMap((chart) =>
        chart.pitches.filter((pitch) => pitch.pitcher?.name === pitcherName)
      );

      if (pitcherPitches.length === 0) return null;

      return ["left", "right"].map((batterHand) => {
        const handFilteredPitches = pitcherPitches.filter(
          (pitch) => pitch.batter?.batHand?.toLowerCase() === batterHand
        );

        if (!handFilteredPitches.length) return null;

        const ttoPitches = calculateTTO(handFilteredPitches);

        const tto1 = ttoPitches.filter((p) => p.tto === 1);
        const tto2 = ttoPitches.filter((p) => p.tto === 2);
        const tto3Plus = ttoPitches.filter((p) => p.tto >= 3);

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

            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}
              >
                1st Time Through Order ({tto1.length} pitches)
              </Text>
              {tto1.length > 0 ? (
                renderTTOTable(tto1)
              ) : (
                <Text style={styles.emptyMessage}>No data available</Text>
              )}
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}
              >
                2nd Time Through Order ({tto2.length} pitches)
              </Text>
              {tto2.length > 0 ? (
                renderTTOTable(tto2)
              ) : (
                <Text style={styles.emptyMessage}>No data available</Text>
              )}
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}
              >
                3rd+ Time Through Order ({tto3Plus.length} pitches)
              </Text>
              {tto3Plus.length > 0 ? (
                renderTTOTable(tto3Plus)
              ) : (
                <Text style={styles.emptyMessage}>No data available</Text>
              )}
            </View>
            <Text style={styles.footer}>
              Generated by D3 Dashboard • {new Date().toLocaleDateString()}
            </Text>
          </Page>
        );
      });
    })
    .filter(Boolean);

  if (pages.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No data available to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  return <Document>{pages}</Document>;
};

const renderTTOTable = (pitches) => {
  const pitchMetrics = processPitchData(pitches);

  // Convert object to array for sorting
  const pitchMetricsArray = Object.entries(pitchMetrics).map(
    ([type, data]) => ({
      type,
      ...data,
    })
  );

  // Sort by usage rate (descending)
  pitchMetricsArray.sort((a, b) => parseFloat(b.usage) - parseFloat(a.usage));

  if (pitchMetricsArray.length === 0) {
    return <Text style={styles.emptyMessage}>No pitch data available</Text>;
  }

  return (
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
      {pitchMetricsArray.map((data) => (
        <View key={data.type} style={styles.tableRow}>
          <Text style={styles.tableCell}>
            {data.type.charAt(0).toUpperCase() +
              data.type.slice(1).toLowerCase()}
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
  );
};

const processPitchData = (pitches) => {
  if (!pitches || pitches.length === 0) {
    return {};
  }

  return pitches.reduce((acc, pitch) => {
    if (!pitch || !pitch.type) return acc;

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
      const velocity = parseFloat(pitch.velocity);
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
      (data.results.called_strike || 0) + (data.results.strikeout_looking || 0);
    const whiffs =
      (data.results.swinging_strike || 0) +
      (data.results.strikeout_swinging || 0);
    data.cswRate =
      data.count > 0
        ? (((calledStrikes + whiffs) / data.count) * 100).toFixed(1)
        : "0.0";

    data.hardHitRate =
      data.battedBalls > 0
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
      if (x === undefined || y === undefined || x === null || y === null) {
        return false;
      }

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

    data.zoneRate =
      data.count > 0 ? ((inZonePitches / data.count) * 100).toFixed(1) : "0.0";

    return acc;
  }, {});
};

export default TTOReport;
