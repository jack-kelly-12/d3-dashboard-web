import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { getDataColumns } from "../../config/tableColumns";

const StatTable = ({ stats, type }) => {
  return (
    <BaseballTable
      data={stats}
      columns={
        type === "batting"
          ? getDataColumns("player_hitting")
          : getDataColumns("player_pitching")
      }
      filename={`player_${type}_stats.csv`}
    />
  );
};

export default StatTable;
