const InfoBanner = ({ dataType }) => {
  const getMessage = () => {
    switch (dataType) {
      case "player_hitting":
        return {
          title: "Player Hitting Statistics",
          description:
            "A comprehensive database of individual batting statistics for players. Includes traditional stats like batting average and home runs, plus advanced metrics like wOBA, wRC+, and WAR.",
          qualifiers:
            "Minimum plate appearances filter available to focus on qualified batters.",
        };
      case "player_pitching":
        return {
          title: "Player Pitching Statistics",
          description:
            "Complete pitching statistics for players. Features traditional metrics such as ERA and strikeouts, along with advanced stats like FIP, xFIP, and pitching WAR.",
          qualifiers:
            "Minimum innings pitched filter available to focus on qualified pitchers.",
        };
      case "team_hitting":
        return {
          title: "Team Hitting Statistics",
          description:
            "Team-level batting statistics for programs. Compare offensive performance across teams using both traditional and advanced metrics.",
          qualifiers:
            "Stats are aggregated for entire teams across full seasons.",
        };
      case "team_pitching":
        return {
          title: "Team Pitching Statistics",
          description:
            "Team-level pitching statistics for programs. Analyze and compare pitching staff performance using comprehensive metrics.",
          qualifiers:
            "Stats represent combined performance of entire pitching staffs.",
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
