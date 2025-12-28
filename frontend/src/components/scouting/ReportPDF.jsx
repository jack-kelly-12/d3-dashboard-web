import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#fafafa",
    fontFamily: "Helvetica",
  },
  headerBand: {
    backgroundColor: "#1e3a8a",
    margin: -30,
    marginBottom: 20,
    padding: 30,
    paddingBottom: 25,
    position: "relative",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  headerAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    opacity: 0.15,
    backgroundColor: "#ffffff",
    transform: "rotate(45deg) translate(50%, -50%)",
  },
  title: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#ffffff",
    opacity: 0.95,
    fontSize: 14,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 12,
    marginTop: 16,
    padding: 10,
    backgroundColor: "#e0e7ff",
    borderRadius: 6,
    borderLeftWidth: 6,
    borderLeftColor: "#1e3a8a",
    borderLeftStyle: "solid",
  },
  sectionContainer: {
    flexGrow: 1,
  },
  playerSection: {
    breakInside: "avoid-page",
    marginBottom: 20,
  },
  playerCard: {
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    border: 1,
    borderColor: "#e5e7eb",
    breakInside: "avoid",
    breakBefore: "auto",
    breakAfter: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    letterSpacing: 0.2,
  },
  playerPosition: {
    fontSize: 13,
    color: "#1e3a8a",
    backgroundColor: "#e0e7ff",
    padding: "4 10",
    borderRadius: 16,
    fontWeight: "medium",
  },
  statsContainer: {
    padding: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 6,
  },
  statItem: {
    width: "16%",
    padding: 3,
  },
  statHeader: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: "medium",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a8a",
    letterSpacing: 0.2,
  },
  writeupContainer: {
    fontSize: 12,
    color: "#374151",
    marginTop: 12,
    lineHeight: 1.5,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  writeup: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#64748b",
    fontSize: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    letterSpacing: 0.3,
  },
  pageNumber: {
    position: "absolute",
    bottom: 25,
    right: 25,
    fontSize: 11,
    color: "#64748b",
    backgroundColor: "#f3f4f6",
    padding: "3 6",
    borderRadius: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    border: 1,
    borderColor: "#e5e7eb",
    marginTop: 12,
  },
});

const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statHeader}>{label}</Text>
    <Text style={styles.statValue}>{value || "—"}</Text>
  </View>
);

const PlayerCard = ({ player }) => {
  if (!player || !player.name) return null;

  return (
    <View wrap={false} style={styles.playerSection}>
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerPosition}>{player.position}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatItem label="AVG" value={player.keyStats?.avg} />
            <StatItem label="OBP" value={player.keyStats?.obp} />
            <StatItem label="SLG" value={player.keyStats?.slg} />
            <StatItem label="HR" value={player.keyStats?.hr} />
            <StatItem label="SB" value={player.keyStats?.sb} />
            <StatItem label="WAR" value={player.keyStats?.war} />
          </View>
        </View>
        <Text style={styles.writeupContainer}>
          {player.writeup || "No scouting notes available."}
        </Text>
      </View>
    </View>
  );
};

const PitcherCard = ({ pitcher }) => {
  if (!pitcher || !pitcher.name) return null;

  return (
    <View wrap={false} style={styles.playerSection}>
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{pitcher.name}</Text>
          <Text style={styles.playerPosition}>{pitcher.role || "Pitcher"}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatItem label="ERA" value={pitcher.keyStats?.era} />
            <StatItem label="FIP" value={pitcher.keyStats?.fip} />
            <StatItem label="K%" value={pitcher.keyStats?.k} />
            <StatItem label="BB%" value={pitcher.keyStats?.bb} />
            <StatItem label="IP" value={pitcher.keyStats?.ip} />
            <StatItem label="WAR" value={pitcher.keyStats?.war} />
          </View>
        </View>
        <Text style={styles.writeupContainer}>
          {pitcher.writeup || "No scouting notes available."}
        </Text>
      </View>
    </View>
  );
};

const ReportPDF = ({ report }) => {
  if (!report) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.emptyStateMessage}>No report data available</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={styles.headerAccent} />
          <Text style={styles.title}>{report.teamName}</Text>
          <Text style={styles.headerSubtitle}>
            Scouting Report •{" "}
            {new Date(report.dateCreated).toLocaleDateString()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {report.positionPlayers?.length || 0} Position Players •{" "}
            {report.pitchers?.length || 0} Pitchers
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Position Players</Text>
          {!report.positionPlayers || report.positionPlayers.length === 0 ? (
            <Text style={styles.emptyStateMessage}>
              No position players available
            </Text>
          ) : (
            report.positionPlayers.map((player, index) => (
              <PlayerCard
                key={`player-${player?.id || index}`}
                player={player}
              />
            ))
          )}

          <Text style={styles.sectionTitle}>Pitchers</Text>
          {!report.pitchers || report.pitchers.length === 0 ? (
            <Text style={styles.emptyStateMessage}>No pitchers available</Text>
          ) : (
            report.pitchers.map((pitcher, index) => (
              <PitcherCard
                key={`pitcher-${pitcher?.id || index}`}
                pitcher={pitcher}
              />
            ))
          )}
        </View>

        <Text style={styles.footer}>
          Generated by D3 Dashboard • {new Date().toLocaleDateString()}
        </Text>
        <Text style={styles.pageNumber}>1</Text>
      </Page>
    </Document>
  );
};

export default ReportPDF;
