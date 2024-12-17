import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { roundTo } from "../utils/mathUtils";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  usageTable: {
    width: "45%",
    marginRight: "5%",
  },
  metricsTable: {
    width: "50%",
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
  },
  countTable: {
    width: "100%",
    marginBottom: 20,
  },
  countGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  countCell: {
    width: "8.33%",
    padding: 4,
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
  pitchType: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 5,
  },
});

const PitchArsenalReport = ({ pitchers, data }) => {
  const processPitchData = (pitcherName) => {
    const pitcherData = data.filter((d) => d.pitcher?.name === pitcherName);

    // Calculate usage stats by hand
    const calculateUsage = (pitches, hand) => {
      const total = pitches.filter((p) => p.batter?.batHand === hand).length;
      const byType = {};
      pitches.forEach((pitch) => {
        if (pitch.batter?.batHand === hand) {
          byType[pitch.type] = (byType[pitch.type] || 0) + 1;
        }
      });
      return Object.entries(byType).map(([type, count]) => ({
        type,
        percentage: roundTo((count / total) * 100, 1),
      }));
    };

    // Calculate metrics
    const byType = {};
    pitcherData.forEach((pitch) => {
      if (!byType[pitch.type]) {
        byType[pitch.type] = {
          count: 0,
          velocity: [],
          spinRate: [],
          horizontalBreak: [],
          verticalBreak: [],
          countMatrix: Array(12).fill(0),
        };
      }

      byType[pitch.type].count++;
      if (pitch.velocity) byType[pitch.type].velocity.push(pitch.velocity);
      if (pitch.spinRate) byType[pitch.type].spinRate.push(pitch.spinRate);
      if (pitch.horizontalBreak)
        byType[pitch.type].horizontalBreak.push(pitch.horizontalBreak);
      if (pitch.verticalBreak)
        byType[pitch.type].verticalBreak.push(pitch.verticalBreak);

      // Update count matrix
      if (pitch.balls !== undefined && pitch.strikes !== undefined) {
        const index = pitch.balls * 3 + pitch.strikes;
        byType[pitch.type].countMatrix[index]++;
      }
    });

    // Calculate averages
    Object.keys(byType).forEach((type) => {
      const stats = byType[type];
      byType[type] = {
        ...stats,
        avgVelo: stats.velocity.length
          ? roundTo(
              stats.velocity.reduce((a, b) => a + b, 0) / stats.velocity.length,
              1
            )
          : 0,
        avgSpin: stats.spinRate.length
          ? Math.round(
              stats.spinRate.reduce((a, b) => a + b, 0) / stats.spinRate.length
            )
          : 0,
        avgHB: stats.horizontalBreak.length
          ? roundTo(
              stats.horizontalBreak.reduce((a, b) => a + b, 0) /
                stats.horizontalBreak.length,
              1
            )
          : 0,
        avgVB: stats.verticalBreak.length
          ? roundTo(
              stats.verticalBreak.reduce((a, b) => a + b, 0) /
                stats.verticalBreak.length,
              1
            )
          : 0,
      };
    });

    return {
      metrics: byType,
      usageLHH: calculateUsage(pitcherData, "left"),
      usageRHH: calculateUsage(pitcherData, "right"),
      totalPitches: pitcherData.length,
    };
  };

  return (
    <Document>
      {pitchers.map((pitcher, index) => {
        const data = processPitchData(pitcher);
        return (
          <Page key={index} size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {pitcher} - Pitch Arsenal Report
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.usageTable}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={[styles.tableCell, { width: "40%" }]}>
                      <Text>Pitch</Text>
                    </View>
                    <View style={[styles.tableCell, { width: "30%" }]}>
                      <Text>vs LHH</Text>
                    </View>
                    <View style={[styles.tableCell, { width: "30%" }]}>
                      <Text>vs RHH</Text>
                    </View>
                  </View>
                  {Object.entries(data.metrics).map(([type, metrics]) => (
                    <View key={type} style={styles.tableRow}>
                      <View style={[styles.tableCell, { width: "40%" }]}>
                        <Text>{type}</Text>
                      </View>
                      <View style={[styles.tableCell, { width: "30%" }]}>
                        <Text>
                          {data.usageLHH.find((u) => u.type === type)
                            ?.percentage || 0}
                          %
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { width: "30%" }]}>
                        <Text>
                          {data.usageRHH.find((u) => u.type === type)
                            ?.percentage || 0}
                          %
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.metricsTable}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.tableCell}>
                      <Text>Pitch</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>Velo</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>Spin</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>IVB</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>HB</Text>
                    </View>
                  </View>
                  {Object.entries(data.metrics).map(([type, metrics]) => (
                    <View key={type} style={styles.tableRow}>
                      <View style={styles.tableCell}>
                        <Text>{type}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{metrics.avgVelo}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{metrics.avgSpin}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{metrics.avgVB}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{metrics.avgHB}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {Object.entries(data.metrics).map(([type, metrics]) => (
              <View key={type} style={styles.section}>
                <Text style={styles.pitchType}>{type} Usage By Count</Text>
                <View style={styles.countTable}>
                  <View style={styles.countGrid}>
                    {metrics.countMatrix.map((count, i) => {
                      const balls = Math.floor(i / 3);
                      const strikes = i % 3;
                      const percentage = roundTo(
                        (count / metrics.count) * 100,
                        1
                      );
                      return (
                        <View key={i} style={styles.countCell}>
                          <Text>
                            {balls}-{strikes}
                          </Text>
                          <Text>{percentage}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}

            <Text style={styles.footer}>
              Generated by D3 Dashboard • {new Date().toLocaleDateString()} •
              {data.totalPitches} Total Pitches
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export default PitchArsenalReport;
