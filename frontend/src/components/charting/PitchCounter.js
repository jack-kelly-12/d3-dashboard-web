import React from "react";

const PitchCounter = ({ pitches = [] }) => {
  const totalPitches = pitches.length;
  const lastPitch = pitches[pitches.length - 1];

  return (
    <div className="absolute top-2 left-2 z-50">
      <div className="inline-flex items-center gap-3 bg-white bg-opacity-90 rounded-lg px-3 py-1.5 text-xs">
        <span className="font-medium text-sm text-blue-600">
          {totalPitches} pitches
        </span>
        {lastPitch && (
          <>
            <span className="text-gray-300 text-sm">|</span>
            <span className="text-gray-600 text-sm">
              {lastPitch.type} • {lastPitch.velocity} mph
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default PitchCounter;
