import React from "react";

const StatHeader = ({ name, tooltip }) => {
  if (!tooltip) {
    return name;
  }

  return (
    <div className="group relative cursor-help">
      <div>{name}</div>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 fixed z-[9999] -translate-y-full -translate-x-1/2 mt-4 w-64 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
        <p className="whitespace-normal">{tooltip}</p>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900" />
      </div>
    </div>
  );
};

export default StatHeader;
