import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const RecruitCard = ({ 
  recruit, 
  onEdit, 
  onDelete, 
  onStatusClick, 
  onViewWriteups, 
  onAddWriteup 
}) => {
  const formatMeasurable = (value, unit = "") => {
    if (!value) return "-";
    return `${value}${unit}`;
  };

  const getCardGradientClass = (tag) => {
    const gradientMap = {
      'offer-given': 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
      'potential-offer': 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
      'committed': 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
      'high-interest': 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200',
      'unscouted': 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200',
      'unsure': 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
      'not-interested': 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
    };
    return gradientMap[tag] || 'bg-white border-gray-200';
  };

  const getStatusButtonClass = (tag) => {
    const baseClass = "px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors";
    const colorMap = {
      'offer-given': 'bg-green-100 text-green-800 hover:bg-green-200',
      'potential-offer': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      'committed': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'high-interest': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'unscouted': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      'unsure': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'not-interested': 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return `${baseClass} ${colorMap[tag] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`;
  };

  return (
    <div className={`group rounded-lg border ${getCardGradientClass(recruit.tag)} hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            {recruit.player_id ? (
              <Link
                to={`/player/${encodeURIComponent(recruit.player_id)}`}
                className="text-base font-semibold text-blue-600 hover:text-blue-800 truncate block"
              >
                {recruit.name}
              </Link>
            ) : (
              <h3 className="text-base font-semibold text-gray-900 truncate">{recruit.name}</h3>
            )}
            {recruit.highSchool && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{recruit.highSchool}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={() => onEdit(recruit)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(recruit.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {recruit.positions && recruit.positions.length > 0 && (
            <p className="text-xs text-gray-600 font-medium">
              {recruit.positions.join(", ")}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {recruit.graduationYear && (
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                {recruit.graduationYear}
              </span>
            )}
            {recruit.datesSeen && recruit.datesSeen.length > 0 && (
              <>
                {recruit.datesSeen.slice(0, 2).map((dateSeen, index) => (
                  <span key={index} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                    {new Date(dateSeen.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {dateSeen.tag && ` (${dateSeen.tag.replace('-', ' ')})`}
                  </span>
                ))}
                {recruit.datesSeen.length > 2 && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                    +{recruit.datesSeen.length - 2} more
                  </span>
                )}
              </>
            )}
            {!recruit.datesSeen && recruit.dateSeen && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                {new Date(recruit.dateSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {recruit.gpa && (
              <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                {recruit.gpa} GPA
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {recruit.tag ? (
              <button
                onClick={(e) => onStatusClick(recruit, e)}
                className={getStatusButtonClass(recruit.tag)}
              >
                {recruit.tag.replace('-', ' ')}
              </button>
            ) : (
              <button
                onClick={(e) => onStatusClick(recruit, e)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
              >
                Set Status
              </button>
            )}
          </div>

          {recruit.measurables && (recruit.measurables.height || recruit.measurables.weight || recruit.measurables.sixtyYardDash || recruit.measurables.exitVelocity) && (
            <div className="pt-2 border-t border-gray-200/50">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                {recruit.measurables.height && (
                  <div>Ht: <span className="font-medium text-gray-900">{formatMeasurable(recruit.measurables.height, '"')}</span></div>
                )}
                {recruit.measurables.weight && (
                  <div>Wt: <span className="font-medium text-gray-900">{formatMeasurable(recruit.measurables.weight, " lbs")}</span></div>
                )}
                {recruit.measurables.sixtyYardDash && (
                  <div>60yd: <span className="font-medium text-gray-900">{formatMeasurable(recruit.measurables.sixtyYardDash, "s")}</span></div>
                )}
                {recruit.measurables.exitVelocity && (
                  <div>EV: <span className="font-medium text-gray-900">{formatMeasurable(recruit.measurables.exitVelocity, " mph")}</span></div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between">
            {recruit.coachWriteUps && recruit.coachWriteUps.length > 0 ? (
              <>
                <button
                  onClick={() => onViewWriteups(recruit)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  {recruit.coachWriteUps.length} Write-Up{recruit.coachWriteUps.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => onAddWriteup(recruit)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Add Write-Up
                </button>
              </>
            ) : (
              <button
                onClick={() => onAddWriteup(recruit)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Add Write-Up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitCard;
