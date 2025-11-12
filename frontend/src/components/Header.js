import React from "react";
import { Link } from "react-router-dom";
import GlobalPlayerSearch from "./GlobalPlayerSearch";

const Header = ({ title, showSearch = true, className = "" }) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        {showSearch && (
          <div className="flex items-center space-x-4">
            <div className="w-80">
              <GlobalPlayerSearch />
            </div>
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;



