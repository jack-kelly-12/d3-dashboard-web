import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const DatePicker = ({ value, onChange, label = "Date:", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  const [displayDate, setDisplayDate] = useState(value || new Date());
  const dropdownRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setDisplayDate(newDate);
  };

  const selectDate = (day) => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    setTempDate(newDate);
    onChange(newDate);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    
    const parts = value.split('-');
    if (parts.length === 3) {
      const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      setTempDate(d);
      setDisplayDate(d);
      onChange(d);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      setTempDate(value);
      setDisplayDate(value);
    }
  }, [value]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayDate);
    const firstDay = getFirstDayOfMonth(displayDate);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = tempDate && 
        tempDate.getDate() === day && 
        tempDate.getMonth() === displayDate.getMonth() && 
        tempDate.getFullYear() === displayDate.getFullYear();
      
      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === displayDate.getMonth() && 
        new Date().getFullYear() === displayDate.getFullYear();
      
      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`h-8 w-8 text-xs rounded-md transition-colors ${
            isSelected
              ? "bg-blue-600 text-white"
              : isToday
              ? "bg-blue-100 text-blue-600 font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={formatDate(tempDate)}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleInputKeyDown}
            placeholder="YYYY-MM-DD"
            className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700 
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
              hover:border-gray-300 transition-colors cursor-pointer"
            readOnly
          />
          <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[999999] p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  setTempDate(today);
                  setDisplayDate(today);
                  onChange(today);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setTempDate(yesterday);
                  setDisplayDate(yesterday);
                  onChange(yesterday);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

