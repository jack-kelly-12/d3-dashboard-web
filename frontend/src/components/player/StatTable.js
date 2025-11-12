import React, { useMemo } from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { getBattingColumns } from "../../config/battingColumns";
import { getPitchingColumns } from "../../config/pitchingColumns";
import { columnsBaserunningLeaderboardForStatTable } from "../../config/baserunningColumns";
import { columnsBattedBallForStatTable } from "../../config/battedBallColumns";
import { columnsSituationalBattersForStatTable } from "../../config/situationalColumns";
import { columnsSituationalPitchers } from "../../config/situationalPitcherColumns";
import { columnsSplitsBattersForStatTable } from "../../config/splitsColumns";
import { columnsSplitsPitchers } from "../../config/splitsPitcherColumns";

const StatTable = ({ stats, type }) => {
  const columns = useMemo(() => {
    switch (type) {
      case "batting":
        return getBattingColumns(true);
      case "pitching":
        return getPitchingColumns(true);
      case "baserunning":
        return columnsBaserunningLeaderboardForStatTable;
      case "batted_ball":
        return columnsBattedBallForStatTable;
      case "situational":
        return columnsSituationalBattersForStatTable;
      case "situational_pitcher":
        return columnsSituationalPitchers;
      case "splits":
        return columnsSplitsBattersForStatTable;
      case "splits_pitcher":
        return columnsSplitsPitchers;
      default:
        return [];
    }
  }, [type]);

  return (
    <BaseballTable
      data={stats}
      columns={columns}
      filename={`player_${type}_stats.csv`}
    />
  );
};

export default StatTable;
