import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { StrikeZonePDF } from "../components/charting/pdf/StrikeZonePDF";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 6,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  date: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
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
    minHeight: 25,
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    fontSize: 9,
    textAlign: "center",
    alignItems: "center",
  },
  sequencesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  sequenceTable: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000000",
  },
  sequenceTableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  sequenceCell: {
    padding: 10,
    borderRightWidth: 1.5,
    fontSize: 9,
    textAlign: "center",
  },
  valueText: {
    fontSize: 8,
  },
  pitchTypeCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  veloCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  strikeZoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10, // Reduced margin
  },
  strikeZoneContainer: {
    width: "30%", // Adjusted width
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

const PitcherScoutingReport = ({ charts = [] }) => {
  const pitchers = getPitchers(charts);

  if (!charts.length || !pitchers.length) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No data available to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  const pages = pitchers.map((pitcherName) => {
    const pitcherPitches = charts.flatMap((chart) =>
      chart.pitches.filter((pitch) => pitch.pitcher?.name === pitcherName)
    );

    const atBats = groupPitchesByAtBat(pitcherPitches);
    const markedPitches = markFirstPitches(pitcherPitches, atBats);

    const lhhPitches = markedPitches.filter(
      (pitch) => pitch.batter?.batHand?.toLowerCase() === "left"
    );
    const rhhPitches = markedPitches.filter(
      (pitch) => pitch.batter?.batHand?.toLowerCase() === "right"
    );

    const metrics = processPitchData(markedPitches);
    const sequencesRHH = findTopSequences(rhhPitches);
    const sequencesLHH = findTopSequences(lhhPitches);

    return (
      <Page key={pitcherName} size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{pitcherName} - Advance Report</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: "15%" }]}>Pitch Type</Text>
            <Text style={[styles.tableCell, { width: "10%" }]}>Velo</Text>
            <Text style={[styles.tableCell, { width: "20%" }]}>
              Overall Usage
            </Text>
            <Text style={[styles.tableCell, { width: "20%" }]}>
              First Pitch
            </Text>
            <Text style={[styles.tableCell, { width: "17.5%" }]}>
              In-Zone %
            </Text>
            <Text style={[styles.tableCell, { width: "17.5%" }]}>Chase %</Text>
          </View>
          {Object.entries(metrics).map(([type, data]) => (
            <View key={type} style={styles.tableRow}>
              <Text style={[styles.pitchTypeCell, { width: "15%" }]}>
                {formatPitchType(type)}
              </Text>
              <Text style={[styles.veloCell, { width: "10%" }]}>
                {data.avgVelo}
              </Text>
              <View style={[styles.tableCell, { width: "20%" }]}>
                <Text style={styles.valueText}>
                  LHH: {data.usageLHH}% | RHH: {data.usageRHH}%
                </Text>
              </View>
              <View style={[styles.tableCell, { width: "20%" }]}>
                <Text style={styles.valueText}>
                  LHH: {data.firstPitchRateLHH}% | RHH: {data.firstPitchRateRHH}
                  %
                </Text>
              </View>
              <View style={[styles.tableCell, { width: "17.5%" }]}>
                <Text style={styles.valueText}>
                  LHH: {data.zoneRateLHH}% | RHH: {data.zoneRateRHH}%
                </Text>
              </View>
              <View style={[styles.tableCell, { width: "17.5%" }]}>
                <Text style={styles.valueText}>
                  LHH: {data.chaseRateLHH}% | RHH: {data.chaseRateRHH}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.strikeZoneGrid}>
          {Object.entries(metrics).map(([type, data]) => (
            <View key={type} style={styles.strikeZoneContainer}>
              <Text style={styles.strikeZoneTitle}>
                {formatPitchType(type)}
              </Text>
              <StrikeZonePDF pitches={data.pitches} width={150} height={150} />
            </View>
          ))}
        </View>

        <View style={styles.sequencesContainer}>
          <View style={[styles.sequenceTable, { marginRight: 5 }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { width: "100%" }]}>
                Top 3 Two-Pitch Sequences vs RHH
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "25%" }]}>Sequence</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Usage</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Swing</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Whiff</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Chase</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>BIP</Text>
            </View>
            {sequencesRHH.map((seq, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "25%" }]}>
                  {seq.key}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.usage}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.swingRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.whiffRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.chaseRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.bipRate}%
                </Text>
              </View>
            ))}
            {sequencesRHH.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%" }]}>
                  No data available
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sequenceTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { width: "100%" }]}>
                Top 3 Two-Pitch Sequences vs LHH
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "25%" }]}>Sequence</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Usage</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Swing</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Whiff</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>Chase</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>BIP</Text>
            </View>
            {sequencesLHH.map((seq, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "25%" }]}>
                  {seq.key}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.usage}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.swingRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.whiffRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.chaseRate}%
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {seq.bipRate}%
                </Text>
              </View>
            ))}
            {sequencesLHH.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%" }]}>
                  No data available
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.footer}>
          Generated by D3 Dashboard • {new Date().toLocaleDateString()}
        </Text>
      </Page>
    );
  });

  return <Document>{pages}</Document>;
};

const getPitchers = (charts) => {
  return [
    ...new Set(
      charts.flatMap((chart) =>
        chart.pitches.map((pitch) => pitch.pitcher?.name).filter(Boolean)
      )
    ),
  ];
};

const groupPitchesByAtBat = (pitches) => {
  const atBats = {};

  const sortedPitches = [...pitches].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let currentPitcherId = null;
  let currentBatterId = null;
  let currentInning = null;
  let currentTopBottom = null;
  let currentAtBatId = null;

  for (const pitch of sortedPitches) {
    const pitcherId = pitch.pitcher?.name;
    const batterId = pitch.batter?.name;
    const inning = pitch.inning;
    const topBottom = pitch.topBottom;

    if (!pitcherId || !batterId) continue;

    const isNewBatterPitcherCombo =
      pitcherId !== currentPitcherId || batterId !== currentBatterId;

    const isNewInning =
      inning !== currentInning || topBottom !== currentTopBottom;

    if (isNewBatterPitcherCombo || isNewInning || isNewAtBat(pitch)) {
      currentAtBatId = `${pitcherId}_${batterId}_${inning}_${topBottom}_${Date.now()}`;
      currentPitcherId = pitcherId;
      currentBatterId = batterId;
      currentInning = inning;
      currentTopBottom = topBottom;
    }

    if (!atBats[currentAtBatId]) {
      atBats[currentAtBatId] = [];
    }

    atBats[currentAtBatId].push(pitch.id);
  }

  return atBats;
};

const isNewAtBat = (pitch) => {
  const result = pitch.result?.toLowerCase();

  return (
    [
      "strikeout_swinging",
      "strikeout_looking",
      "walk",
      "hit_by_pitch",
      "in_play",
    ].includes(result) ||
    (pitch.hitDetails && pitch.hitDetails.result)
  );
};

const markFirstPitches = (pitches, atBats) => {
  return pitches.map((pitch) => {
    const isFirstPitch = Object.values(atBats).some(
      (pitchIds) => pitchIds[0] === pitch.id
    );

    return {
      ...pitch,
      isFirstPitch,
    };
  });
};

const processPitchData = (pitches) => {
  const totals = pitches.reduce(
    (acc, pitch) => {
      const isLHH = pitch.batter?.batHand?.toLowerCase() === "left";

      if (isLHH) {
        acc.totalLHH++;
        if (pitch.isFirstPitch === true) acc.totalFirstPitchLHH++;
      } else if (pitch.batter?.batHand?.toLowerCase() === "right") {
        acc.totalRHH++;
        if (pitch.isFirstPitch === true) acc.totalFirstPitchRHH++;
      }
      return acc;
    },
    { totalLHH: 0, totalRHH: 0, totalFirstPitchLHH: 0, totalFirstPitchRHH: 0 }
  );

  return pitches.reduce((acc, pitch) => {
    const type = pitch.type?.toUpperCase() || "UNKNOWN";
    const isLHH = pitch.batter?.batHand?.toLowerCase() === "left";
    const isRHH = pitch.batter?.batHand?.toLowerCase() === "right";

    if (!isLHH && !isRHH) return acc;

    if (!acc[type]) {
      acc[type] = {
        velocities: [],
        pitches: [],
        countLHH: 0,
        countRHH: 0,
        firstPitchLHH: 0,
        firstPitchRHH: 0,
        zonePitchesLHH: 0,
        zonePitchesRHH: 0,
        chasePitchesLHH: 0,
        chasePitchesRHH: 0,
      };
    }

    const data = acc[type];
    data.pitches.push(pitch);

    if (isLHH) {
      data.countLHH++;
      if (pitch.isFirstPitch === true) data.firstPitchLHH++;
    } else if (isRHH) {
      data.countRHH++;
      if (pitch.isFirstPitch === true) data.firstPitchRHH++;
    }

    if (pitch.velocity) {
      const velocity = Number(pitch.velocity);
      if (!isNaN(velocity)) data.velocities.push(velocity);
    }

    const isInZone = isInStrikeZone(pitch.x, pitch.y);
    const isSwing = [
      "swinging_strike",
      "foul",
      "in_play",
      "strikeout_swinging",
    ].includes(pitch.result);
    const isChase = !isInZone && isSwing;

    if (isLHH) {
      if (isInZone) data.zonePitchesLHH++;
      if (isChase) data.chasePitchesLHH++;
    } else if (isRHH) {
      if (isInZone) data.zonePitchesRHH++;
      if (isChase) data.chasePitchesRHH++;
    }

    data.avgVelo = data.velocities.length
      ? (
          data.velocities.reduce((a, b) => a + b) / data.velocities.length
        ).toFixed(1)
      : "-";

    data.usageLHH =
      totals.totalLHH > 0
        ? ((data.countLHH / totals.totalLHH) * 100).toFixed(1)
        : "0.0";
    data.usageRHH =
      totals.totalRHH > 0
        ? ((data.countRHH / totals.totalRHH) * 100).toFixed(1)
        : "0.0";

    data.firstPitchRateLHH =
      totals.totalFirstPitchLHH > 0
        ? Number(
            ((data.firstPitchLHH / totals.totalFirstPitchLHH) * 100).toFixed(1)
          )
        : 0;
    data.firstPitchRateRHH =
      totals.totalFirstPitchRHH > 0
        ? Number(
            ((data.firstPitchRHH / totals.totalFirstPitchRHH) * 100).toFixed(1)
          )
        : 0;

    data.zoneRateLHH =
      data.countLHH > 0
        ? ((data.zonePitchesLHH / data.countLHH) * 100).toFixed(1)
        : "0.0";
    data.zoneRateRHH =
      data.countRHH > 0
        ? ((data.zonePitchesRHH / data.countRHH) * 100).toFixed(1)
        : "0.0";

    data.chaseRateLHH =
      data.countLHH > 0
        ? ((data.chasePitchesLHH / data.countLHH) * 100).toFixed(1)
        : "0.0";
    data.chaseRateRHH =
      data.countRHH > 0
        ? ((data.chasePitchesRHH / data.countRHH) * 100).toFixed(1)
        : "0.0";

    return acc;
  }, {});
};

const findTopSequences = (pitches) => {
  if (pitches.length < 2) {
    return [];
  }

  const sequences = [];
  const pitchesByAtBat = {};

  for (const pitch of pitches) {
    const atBatId = `${pitch.batter?.name}_${pitch.inning}_${pitch.topBottom}`;

    if (!pitchesByAtBat[atBatId]) {
      pitchesByAtBat[atBatId] = [];
    }

    pitchesByAtBat[atBatId].push(pitch);
  }

  Object.values(pitchesByAtBat).forEach((atBatPitches) => {
    atBatPitches.sort((a, b) => new Date(a.time) - new Date(b.time));

    for (let i = 0; i < atBatPitches.length - 1; i++) {
      const currentPitch = atBatPitches[i];
      const nextPitch = atBatPitches[i + 1];

      const sequence = {
        key: `${currentPitch.type}-${nextPitch.type}`,
        firstPitch: currentPitch,
        secondPitch: nextPitch,
      };

      sequences.push(sequence);
    }
  });

  const groupedSequences = sequences.reduce((acc, seq) => {
    if (!acc[seq.key]) {
      acc[seq.key] = {
        key: seq.key,
        count: 0,
        sequences: [],
      };
    }
    acc[seq.key].count++;
    acc[seq.key].sequences.push(seq);
    return acc;
  }, {});

  return Object.values(groupedSequences)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((group) => {
      const totalSequences = group.count;

      const secondPitches = group.sequences.map((seq) => seq.secondPitch);

      const swings = secondPitches.filter(
        (p) =>
          p.result === "swinging_strike" ||
          p.result === "foul" ||
          p.result === "in_play" ||
          p.result === "strikeout_swinging"
      ).length;

      const whiffs = secondPitches.filter(
        (p) =>
          p.result === "swinging_strike" || p.result === "strikeout_swinging"
      ).length;

      const chases = secondPitches.filter(
        (p) =>
          !isInStrikeZone(p.x, p.y) &&
          (p.result === "swinging_strike" ||
            p.result === "foul" ||
            p.result === "strikeout_swinging" ||
            p.result === "in_play")
      ).length;

      const bip = secondPitches.filter((p) => p.result === "in_play").length;

      return {
        key: group.key,
        usage: ((group.count / sequences.length) * 100).toFixed(1),
        swingRate: ((swings / totalSequences) * 100).toFixed(1),
        whiffRate: ((whiffs / totalSequences) * 100).toFixed(1),
        chaseRate: ((chases / totalSequences) * 100).toFixed(1),
        bipRate: ((bip / totalSequences) * 100).toFixed(1),
      };
    });
};

const STRIKE_ZONE = {
  plateHalfWidth: 8.5,
  bottom: 18,
  top: 42,
  baseballRadius: 1.45,
};

const isInStrikeZone = (x, y) => {
  if (x === undefined || y === undefined || x === null || y === null) {
    return false;
  }

  const { plateHalfWidth, bottom, top, baseballRadius } = STRIKE_ZONE;
  return (
    Math.abs(x) <= plateHalfWidth + baseballRadius &&
    y + baseballRadius >= bottom &&
    y - baseballRadius <= top
  );
};

const formatPitchType = (type) => {
  if (!type) return "Unknown";

  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default PitcherScoutingReport;
