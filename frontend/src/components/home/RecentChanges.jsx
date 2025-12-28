import React from "react";
import { Clock } from "lucide-react";

const RecentChanges = () => {

  const changes = [
    {
      date: "2025-10-12",
      title: "Player IDs",
      description: "Built new full coverage player id system for D1-D3 players",
      type: "improvement"
    },
    {
      date: "2025-10-12", 
      title: "Play by play data",
      description: "Improved parsing of play by play data, increasing accuracy and reliability",
      type: "improvement"
    },
    {
      date: "2025-10-12",
      title: "Player headshots",
      description: "Added player headshots to player pages, currently available for ~50% of players",
      type: "feature"
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature': return 'text-green-600 bg-green-50';
      case 'improvement': return 'text-blue-600 bg-blue-50';
      case 'fix': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-full flex flex-col relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Recent Updates</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {changes.map((change, index) => (
          <div key={index} className="p-2 rounded hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {change.title}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(change.type)}`}>
                {change.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {change.description}
            </p>
            <span className="text-xs text-gray-500">
              {formatDate(change.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChanges;
