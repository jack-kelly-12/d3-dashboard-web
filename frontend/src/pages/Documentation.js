import React from "react";
import InfoBanner from "../components/data/InfoBanner";

const Documentation = () => {
  const sections = [
    {
      title: "Standard Batting Statistics",
      fields: [
        { name: "GP", desc: "Games Played" },
        {
          name: "AB",
          desc: "At Bats - Official plate appearances excluding walks, HBP, sacrifices",
        },
        {
          name: "PA",
          desc: "Plate Appearances - Total batting appearances including walks, HBP, sacrifices",
        },
        {
          name: "H",
          desc: "Hits - Total hits (singles + doubles + triples + home runs)",
        },
        { name: "2B", desc: "Doubles" },
        { name: "3B", desc: "Triples" },
        { name: "HR", desc: "Home Runs" },
        { name: "R", desc: "Runs Scored" },
        { name: "SB", desc: "Stolen Bases" },
        { name: "BB", desc: "Walks (Base on Balls)" },
        { name: "HBP", desc: "Hit By Pitch" },
        { name: "Picked", desc: "Times picked off base" },
        { name: "Sac", desc: "Sacrifice Bunts" },
      ],
    },
    {
      title: "Advanced Batting Metrics",
      fields: [
        { name: "BA", desc: "Batting Average (H/AB)" },
        {
          name: "OBP",
          desc: "On-Base Percentage - Rate at which batter reaches base",
        },
        { name: "SLG", desc: "Slugging Percentage - Total bases per at-bat" },
        {
          name: "ISO",
          desc: "Isolated Power (SLG - BA) - Measures raw power output",
        },
        {
          name: "wOBA",
          desc: "Weighted On-Base Average - Comprehensive offensive rate statistic",
        },
        {
          name: "OPS+",
          desc: "On-base Plus Slugging Plus - OPS adjusted for park and league, 100 is average",
        },
        {
          name: "wRC+",
          desc: "Weighted Runs Created Plus - Runs created adjusted for park and league, 100 is average",
        },
        { name: "BB%", desc: "Walk Percentage - Walks per plate appearance" },
        {
          name: "K%",
          desc: "Strikeout Percentage - Strikeouts per plate appearance",
        },
        { name: "SB%", desc: "Stolen Base Success Rate" },
      ],
    },
    {
      title: "Value Metrics (Batting)",
      fields: [
        {
          name: "Batting",
          desc: "Batting Runs - Runs created above average from batting",
        },
        {
          name: "Base Run",
          desc: "Base Running Runs - Runs created above average from base running",
        },
        {
          name: "Pos. Adj",
          desc: "Position Adjustment - Runs added/subtracted based on defensive position and games played",
        },
        {
          name: "WPA",
          desc: "Win Probability Added - Context-dependent value of offensive actions",
        },
        {
          name: "RE24",
          desc: "Run Expectancy - Run value of all plate appearances/baserunning events",
        },
        { name: "WPA/LI", desc: "Context-neutral Win Probability Added" },
        {
          name: "Clutch",
          desc: "Performance in high-leverage situations compared to normal situations",
        },
        {
          name: "WAR",
          desc: "Wins Above Replacement - Total player value in wins above replacement level",
        },
      ],
    },
    {
      title: "Standard Pitching Statistics",
      fields: [
        { name: "App", desc: "Appearances - Games pitched" },
        { name: "GS", desc: "Games Started" },
        { name: "IP", desc: "Innings Pitched" },
        { name: "H", desc: "Hits Allowed" },
        { name: "ER", desc: "Earned Runs" },
        { name: "BB", desc: "Walks Issued" },
        { name: "HB", desc: "Hit Batters" },
        { name: "Pitches", desc: "Total Pitches Thrown" },
      ],
    },
    {
      title: "Advanced Pitching Metrics",
      fields: [
        {
          name: "ERA",
          desc: "Earned Run Average - Earned runs per nine innings",
        },
        {
          name: "ERA+",
          desc: "ERA adjusted for park and league, 100 is average",
        },
        {
          name: "FIP",
          desc: "Fielding Independent Pitching - ERA estimator based on K, BB, HR",
        },
        { name: "xFIP", desc: "Expected FIP - FIP with normalized HR rate" },
        { name: "K/9", desc: "Strikeouts per Nine Innings" },
        { name: "BB/9", desc: "Walks per Nine Innings" },
        { name: "H/9", desc: "Hits per Nine Innings" },
        { name: "HR/9", desc: "Home Runs per Nine Innings" },
        {
          name: "K%",
          desc: "Strikeout Percentage - Strikeouts per batter faced",
        },
        { name: "BB%", desc: "Walk Percentage - Walks per batter faced" },
        { name: "K-BB%", desc: "Strikeout minus Walk Percentage" },
        { name: "HR/FB", desc: "Home Run to Fly Ball Ratio" },
        { name: "IR-A%", desc: "Inherited Runners scoring percentage" },
      ],
    },
    {
      title: "Value Metrics (Pitching)",
      fields: [
        {
          name: "WPA",
          desc: "Win Probability Added - Context-dependent value of pitching",
        },
        {
          name: "RE24",
          desc: "Run Expectancy - Run value of all events while pitching (positive better)",
        },
        { name: "WPA/LI", desc: "Context-neutral Win Probability Added" },
        {
          name: "Clutch",
          desc: "Performance in high-leverage situations compared to normal situations",
        },
        {
          name: "WAR",
          desc: "Wins Above Replacement - Total pitcher value in wins above replacement",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <InfoBanner dataType={"documentation"} />

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {section.fields.map((field, fieldIndex) => (
                    <div
                      key={fieldIndex}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0">
                          <span className="font-mono font-medium text-blue-600">
                            {field.name}
                          </span>
                        </div>
                        <div className="flex-1 text-gray-600">{field.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
