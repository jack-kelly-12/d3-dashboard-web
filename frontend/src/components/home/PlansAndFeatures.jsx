import React from "react";
import { Calendar } from "lucide-react";

const PlansAndFeatures = () => {

  const plans = [
    {
      date: "Early 2026",
      title: "Rebranding",
      description: "Rebranding to Kelly Dashboard to eliminate confusion about coverage scope, as the platform serves all levels of college baseball, not just D3.",
      type: "improvement"
    },
    {
      date: "November-December",
      title: "Play by play data fixes",
      description: "Resolving edge case bugs affecting win expectancy, leverage, and run expectancy calculations.",
      type: "fix"
    },
    {
      date: "November-December",
      title: "Player headshots",
      description: "Adding player headshots to player pages, currently available for ~50% of players",
      type: "feature"
    },
    {
      date: "Ongoing",
      title: "Data expansion",
      description: "Adding NJCAA and NAIA data, creating unified IDs for players across those levels",
      type: "improvement"
    },
    {
      title: "Coaches",
      description: "Will develop system to evaluate/describe coaches based on their in-game tendencies and decisions and how they perform above expectation",
      type: "feature"
    },
    {
      title: "Team pages",
      description: "Will develop team leaderboards to look similar to player pages with data on the team level",
      type: "feature"
    },
    {
      date: "January-February",
      title: "Projections",
      description: "Player projections and predictive modeling, for 2026 season. Waiting on rosters to be finalized.",
      type: "feature"
    },
    {
      title: "Live game data",
      description: "Will develop system to stream live game data from games in progress",
      type: "feature"
    }
  ];

  const formatDate = (dateString) => {
    if (dateString === "Ongoing") return "Ongoing";
    return dateString;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature': return 'text-purple-600 bg-purple-50';
      case 'improvement': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-full flex flex-col relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Roadmap</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {plans.map((plan, index) => (
          <div key={index} className="p-2 rounded hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {plan.title}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(plan.type)}`}>
                {plan.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {plan.description}
            </p>
            <span className="text-xs text-gray-500">
              {formatDate(plan.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansAndFeatures;
