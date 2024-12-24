const InfoBanner = ({ dataType }) => {
  const getMessage = () => {
    switch (dataType) {
      case "guts":
        return {
          title: "Guts",
          description:
            "Explore league-wide constants and park factors that influence player and team performance.",
        };
      case "charting":
        return {
          title: "Charting",
          description:
            "Chart games, bullpens, scrimmages, allowing D3 coaches, analysts, and players the ability to access pitch-level data. Build custom advance scouting reports complete with heatmaps, tendencies, etc.",
        };
      case "scoreboard":
        return {
          title: "Scoreboard",
          description:
            "Explore the outcomes of every Division 3 game from 2021 to the present. Analyze changes in win expectancy shifts and relive every pivotal moment from each game.",
        };
      case "scouting":
        return {
          title: "Scouting Reports",
          description:
            "Automatically build spray charts that query up-to-date data from any Division 3 team in the country. Export to PDF when finished and share with your team.",
        };
      case "player_hitting":
        return {
          title: "Player Hitting Statistics",
          description:
            "A comprehensive database of individual batting statistics for players. Includes traditional stats like batting average and home runs, plus advanced metrics like wOBA, wRC+, and WAR.",
        };
      case "player_pitching":
        return {
          title: "Player Pitching Statistics",
          description:
            "Complete pitching statistics for players. Features traditional metrics such as ERA and strikeouts, along with advanced stats like FIP, xFIP, and pitching WAR.",
        };
      case "team_hitting":
        return {
          title: "Team Hitting Statistics",
          description:
            "Team-level batting statistics for programs. Compare offensive performance across teams using both traditional and advanced metrics.",
        };
      case "team_pitching":
        return {
          title: "Team Pitching Statistics",
          description:
            "Team-level pitching statistics for programs. Analyze and compare pitching staff performance using comprehensive metrics.",
        };
      default:
        return {
          title: "Statistics",
          description: "Select a category above to view statistics.",
          qualifiers: "",
        };
    }
  };

  const info = getMessage();

  return (
    <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-sm mb-6">
      <div className="px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {info.title}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-2">
          {info.description}
        </p>
        {info.qualifiers && (
          <p className="text-gray-500 text-sm bg-white bg-opacity-50 px-3 py-1.5 rounded-md inline-block">
            {info.qualifiers}
          </p>
        )}
      </div>
    </div>
  );
};

export default InfoBanner;
