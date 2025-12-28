import React from "react";
import { createPortal } from "react-dom";

const STATUS_OPTIONS = [
  { value: 'offer-given', label: 'Offer Given', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
  { value: 'potential-offer', label: 'Potential Offer', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
  { value: 'committed', label: 'Committed', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  { value: 'high-interest', label: 'High Interest', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
  { value: 'unscouted', label: 'Unscouted', color: 'bg-gray-50 hover:bg-gray-100 text-gray-700' },
  { value: 'unsure', label: 'Unsure', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
  { value: 'not-interested', label: 'Not Interested', color: 'bg-red-50 hover:bg-red-100 text-red-700' }
];

const StatusDropdown = ({ isOpen, position, recruit, onSelect, onClose, dropdownRef }) => {
  if (!isOpen || !recruit) return null;

  const calculatePosition = () => {
    const dropdownHeight = 280;
    const dropdownWidth = 176;
    const padding = 8;
    
    let top = position.top;
    let left = position.left;
    
    if (typeof window !== 'undefined') {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      if (top + dropdownHeight > viewportHeight - padding) {
        top = position.top - dropdownHeight;
      }
      
      if (left + dropdownWidth > viewportWidth - padding) {
        left = viewportWidth - dropdownWidth - padding;
      }
      
      if (top < padding) {
        top = padding;
      }
      
      if (left < padding) {
        left = padding;
      }
    }
    
    return { top, left };
  };

  const adjustedPosition = calculatePosition();

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-44 max-h-[280px] overflow-y-auto"
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`
      }}
    >
      <div className="space-y-0.5">
        {STATUS_OPTIONS.map((tag) => (
          <button
            key={tag.value}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(recruit.id, tag.value);
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${tag.color}`}
          >
            {tag.label}
          </button>
        ))}
        {recruit.tag && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(recruit.id, '');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default StatusDropdown;

