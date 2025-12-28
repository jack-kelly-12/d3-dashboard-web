import React from "react";
import { formatAvg } from "./useSprayChartData";

const SprayChartStats = ({ stats, handFilter, setHandFilter }) => {
  const batted = stats?.batted || {};
  const vsRHP = stats?.vsRHP || {};
  const vsLHP = stats?.vsLHP || {};

  const isAll = handFilter.L && handFilter.R;
  const isRHP = handFilter.R && !handFilter.L;
  const isLHP = handFilter.L && !handFilter.R;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-blue-50 border-t border-blue-200">
      <BattedBallTable batted={batted} />
      <SplitsTable
        stats={stats}
        vsRHP={vsRHP}
        vsLHP={vsLHP}
        isAll={isAll}
        isRHP={isRHP}
        isLHP={isLHP}
        setHandFilter={setHandFilter}
      />
    </div>
  );
};

const BattedBallTable = ({ batted }) => {
  const fmt = (val) => val === null || val === undefined ? "-" : `${val}%`;
  
  const data = [
    { label: "Air%", value: `${batted.air || 0}%` },
    { label: "GB%", value: `${batted.ground || 0}%` },
    { label: "Pull%", value: fmt(batted.pull) },
    { label: "Mid%", value: fmt(batted.middle) },
    { label: "Oppo%", value: fmt(batted.oppo) },
    { label: "Pull Air%", value: fmt(batted.pullAir) },
    { label: "Oppo GB%", value: fmt(batted.backspinGroundball) },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-blue-300 bg-white self-start">
      <div className="bg-blue-100 px-3 py-2 border-b border-blue-300">
        <h3 className="text-sm font-semibold text-blue-900">Batted Ball Profile</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-blue-200">
            {data.map((item) => (
              <th key={item.label} className="px-2 py-1.5 text-center text-[10px] font-medium text-blue-700">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {data.map((item) => (
              <td key={item.label} className="px-2 py-1.5 text-center text-sm font-semibold text-gray-900">
                {item.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const SplitsTable = ({ stats, vsRHP, vsLHP, isAll, isRHP, isLHP, setHandFilter }) => {
  const rows = [
    {
      label: "Overall",
      PA: stats?.PA || 0,
      BA: formatAvg(stats?.battingAvg),
      OBP: formatAvg(stats?.onBasePercentage),
      wOBA: formatAvg(stats?.wOBA),
      active: isAll,
      onClick: () => setHandFilter({ L: true, R: true }),
    },
    {
      label: "vs RHP",
      PA: vsRHP?.PA || 0,
      BA: formatAvg(vsRHP?.battingAvg),
      OBP: formatAvg(vsRHP?.onBasePercentage),
      wOBA: formatAvg(vsRHP?.wOBA),
      active: isRHP,
      onClick: () => setHandFilter({ L: false, R: true }),
    },
    {
      label: "vs LHP",
      PA: vsLHP?.PA || 0,
      BA: formatAvg(vsLHP?.battingAvg),
      OBP: formatAvg(vsLHP?.onBasePercentage),
      wOBA: formatAvg(vsLHP?.wOBA),
      active: isLHP,
      onClick: () => setHandFilter({ L: true, R: false }),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-blue-300 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-100 border-b border-blue-300">
            <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Split</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-blue-900">PA</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-blue-900">BA</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-blue-900">OBP</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-blue-900">wOBA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {rows.map((row) => (
            <tr
              key={row.label}
              onClick={row.onClick}
              className={`cursor-pointer transition-colors ${
                row.active
                  ? "bg-blue-50 ring-1 ring-inset ring-blue-400"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="px-3 py-2 font-medium text-gray-900">{row.label}</td>
              <td className="px-3 py-2 text-center text-gray-700">{row.PA}</td>
              <td className="px-3 py-2 text-center text-gray-700 font-mono">{row.BA}</td>
              <td className="px-3 py-2 text-center text-gray-700 font-mono">{row.OBP}</td>
              <td className="px-3 py-2 text-center text-gray-700 font-mono">{row.wOBA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SprayChartStats;
