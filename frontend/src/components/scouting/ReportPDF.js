import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
  },
  headerBand: {
    backgroundColor: "#1e40af",
    margin: -40,
    marginBottom: 30,
    padding: 40,
    paddingBottom: 30,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#ffffff",
    opacity: 0.9,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#f0f5ff",
    borderRadius: 4,
  },
  playerCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    border: 1,
    borderColor: "#e5e7eb",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  playerPosition: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    padding: 4,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  statBox: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 4,
    border: 1,
    borderColor: "#e5e7eb",
    width: "15%",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
  },
  writeup: {
    fontSize: 12,
    color: "#374151",
    marginTop: 12,
    lineHeight: 1.5,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
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

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const ReportPDF = ({ report }) => {
  const renderPositionPlayers = () => (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Position Players</Text>
      {report.positionPlayers.map((player, index) => (
        <View key={index} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="AVG" value={player.keyStats.avg} />
            <StatBox label="OBP" value={player.keyStats.obp} />
            <StatBox label="SLG" value={player.keyStats.slg} />
            <StatBox label="HR" value={player.keyStats.hr} />
            <StatBox label="SB" value={player.keyStats.sb} />
            <StatBox label="WAR" value={player.keyStats.war} />
          </View>
          <Text style={styles.writeup}>
            {player.writeup || "No scouting notes available."}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPitchers = () => (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Pitchers</Text>
      {report.pitchers?.map((pitcher, index) => (
        <View key={index} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>{pitcher.name}</Text>
            <Text style={styles.playerPosition}>
              {pitcher.role || "Role not specified"}
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="ERA" value={pitcher.keyStats.era} />
            <StatBox label="FIP" value={pitcher.keyStats.fip} />
            <StatBox label="K%" value={`${pitcher.keyStats.k}%`} />
            <StatBox label="BB%" value={`${pitcher.keyStats.bb}%`} />
            <StatBox label="IP" value={pitcher.keyStats.ip} />
            <StatBox label="WAR" value={pitcher.keyStats.war} />
          </View>
          <Text style={styles.writeup}>
            {pitcher.writeup || "No scouting notes available."}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.title}>{report.teamName}</Text>
          <Text style={styles.headerSubtitle}>
            Scouting Report •{" "}
            {new Date(report.dateCreated).toLocaleDateString()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {report.numHitters} Position Players • {report.numPitchers} Pitchers
          </Text>
        </View>

        {report.positionPlayers?.length > 0 && renderPositionPlayers()}
        {report.pitchers?.length > 0 && renderPitchers()}

        <Text style={styles.footer}>
          Generated by D3 Dashboard • {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};

export default ReportPDF;
