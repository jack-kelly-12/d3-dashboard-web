import React from "react";

export const BullpenPitchCounter = ({ pitches = [] }) => {
  if (!pitches.length) return null;
  const lastPitch = pitches[pitches.length - 1];

  return (
    <div className="absolute top-2 left-2 z-50">
      <div className="inline-flex items-center gap-3 bg-white bg-opacity-90 rounded-lg px-3 py-1.5">
        <span className="font-medium text-sm text-blue-600">
          {pitches.length} pitches
        </span>
        {lastPitch && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 text-sm">
              {lastPitch.type} • {lastPitch.velocity} mph
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export const GamePitchCounter = ({ pitches = [], currentPitcher = null }) => {
  if (!currentPitcher) return null;

  const currentPitcherPitches = pitches.filter(
    (p) => p.pitcher?.name === currentPitcher.name
  );

  const strikeCount = currentPitcherPitches.filter(
    (p) =>
      p.result?.toLowerCase().includes("strike") ||
      p.result?.toLowerCase() === "foul" ||
      p.result?.toLowerCase() === "in_play"
  ).length;

  const strikePercentage = currentPitcherPitches.length
    ? Math.round((strikeCount / currentPitcherPitches.length) * 100)
    : 0;

  return (
    <div className="absolute top-2 left-2 z-50">
      <div className="flex flex-col bg-white bg-opacity-90 rounded-lg px-3 py-2">
        <span className="font-medium text-sm text-blue-600">
          {currentPitcherPitches.length} pitches
        </span>
        <span className="text-gray-600 text-sm">
          {strikePercentage}% strikes
        </span>
      </div>
    </div>
  );
};
