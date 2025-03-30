import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { getDataColumns } from "../../config/tableColumns";

const StatTable = ({ stats, type }) => {
  const getColumns = () => {
    switch (type) {
      case "batting":
        return getDataColumns("player_hitting");
      case "pitching":
        return getDataColumns("player_pitching");
      case "baserunning":
        return getDataColumns("baserunning");
      case "batted_ball":
        return getDataColumns("batted_ball");
      case "situational":
        return getDataColumns("situational");
      case "situational_pitcher":
        return getDataColumns("situational_pitcher");
      case "splits":
        return getDataColumns("splits");
      case "splits_pitcher":
        return getDataColumns("splits_pitcher");
      default:
        return [];
    }
  };

  return (
    <BaseballTable
      data={stats}
      columns={getColumns()}
      filename={`player_${type}_stats.csv`}
    />
  );
};

export default StatTable;
