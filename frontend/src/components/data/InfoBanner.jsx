import React from "react";

const InfoBanner = ({ title, description, children }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur p-4 sm:p-5 shadow-xl">
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
      <div className="relative z-10 flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex-shrink-0">
          i
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">{title}</div>
          <div className="text-xs sm:text-sm text-gray-600">{description}</div>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default InfoBanner;


