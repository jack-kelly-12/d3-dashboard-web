import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { ChevronDown } from "lucide-react";

const ValueLeaderboard = lazy(() =>
  import("../components/tables/ValueLeaderboard")
);
const SituationalLeaderboard = lazy(() =>
  import("../components/tables/SituationalLeaderboard")
);
const BaserunningLeaderboard = lazy(() =>
  import("../components/tables/BaserunningLeaderboard")
);
const ProjectionsHit = lazy(() =>
  import("../components/tables/ProjectionsHit")
);
const ProjectionsPitch = lazy(() =>
  import("../components/tables/ProjectionsPitch")
);

const LEADERBOARD_TYPES = {
  VALUE: {
    id: "value",
    label: "Value Leaderboard",
    description:
      "Overall player value combining batting, baserunning, and pitching contributions",
    component: ValueLeaderboard,
  },
  SITUATIONAL: {
    id: "situational",
    label: "Situational Leaderboard",
    description:
      "How hitters do w/ RISP vs. high leverage situations vs. low leverage vs. all together",
    component: SituationalLeaderboard,
  },
  BASERUNNING: {
    id: "baserunning",
    label: "Baserunning Leaderboard",
    description: "Comprehensive leaderboard of total baserunning value",
    component: BaserunningLeaderboard,
  },
  PROJECTIONS: {
    id: "projections",
    label: "2025 Projections (Hitting)",
    description: "Projected hitting statistics for the 2025 season",
    component: ProjectionsHit,
  },
  PROJECTIONS_PITCH: {
    id: "projections_pitch",
    label: "2025 Projections (Pitching)",
    description: "Projected pitching statistics for the 2025 season",
    component: ProjectionsPitch,
  },
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Leaderboards = () => {
  const [selectedType, setSelectedType] = useState(LEADERBOARD_TYPES.VALUE.id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Memory optimization: Clear unused data when switching leaderboards
  useEffect(() => {
    const gcTimeout = setTimeout(() => {
      if (window.gc) {
        window.gc();
      }
    }, 100);

    return () => clearTimeout(gcTimeout);
  }, [selectedType]);

  const getCurrentLeaderboard = () => {
    const leaderboard = Object.values(LEADERBOARD_TYPES).find(
      (type) => type.id === selectedType
    );
    const LeaderboardComponent = leaderboard?.component;

    return LeaderboardComponent ? (
      <Suspense fallback={<LoadingFallback />}>
        <LeaderboardComponent />
      </Suspense>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mx-auto py-4 px-4 md:px-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent py-3 mb-5 md:mb-0 md:mr-4">
            {LEADERBOARD_TYPES[selectedType.toUpperCase()]?.label}
          </h1>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-sm font-medium text-gray-700">
                Current: {LEADERBOARD_TYPES[selectedType.toUpperCase()]?.label}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 w-72 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                {Object.values(LEADERBOARD_TYPES).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="overflow-x-auto px-6">{getCurrentLeaderboard()}</div>
      </div>
    </div>
  );
};

export default Leaderboards;
