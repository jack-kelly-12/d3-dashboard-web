import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";

const TAG_OPTIONS = [
  { value: 'committed', label: 'Committed' },
  { value: 'offer-given', label: 'Offer Given' },
  { value: 'high-interest', label: 'High Interest' },
  { value: 'potential-offer', label: 'Potential Offer' },
  { value: 'unscouted', label: 'Unscouted' },
  { value: 'unsure', label: 'Unsure' },
  { value: 'not-interested', label: 'Not Interested' },
];

const MultiSelectDropdown = ({ label, options, selected, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (e, value) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  const displayText = selected.length === 0 
    ? placeholder 
    : selected.length === 1 
      ? options.find(opt => opt.value === selected[0] || opt === selected[0])?.label || selected[0]
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between text-sm"
      >
        <span className={selected.length === 0 ? "text-gray-500" : "text-gray-900"}>{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 space-y-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
            ) : (
              options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                const isSelected = selected.includes(value);
                
                return (
                  <label
                    key={value}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="ml-3 text-sm text-gray-700 flex-1">{label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((value) => {
            const option = options.find(opt => (typeof opt === 'string' ? opt : opt.value) === value);
            const label = typeof option === 'string' ? option : option?.label || value;
            
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, value)}
                  className="hover:text-blue-900 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RangeSlider = ({ label, min, max, value, onChange, unit = "", step = 1 }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    if (newMin <= localValue.max) {
      const newValue = { ...localValue, min: newMin };
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    if (newMax >= localValue.min) {
      const newValue = { ...localValue, max: newMax };
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const isActive = localValue.min !== min || localValue.max !== max;
  const formatValue = (val) => {
    if (step < 1) {
      return val.toFixed(1);
    }
    return Math.round(val);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">{label}</label>
        {isActive && (
          <span className="text-xs text-blue-600 font-medium">
            {formatValue(localValue.min)}{unit} - {formatValue(localValue.max)}{unit}
          </span>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Min: {formatValue(localValue.min)}{unit}</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue.min}
            onChange={handleMinChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((localValue.min - min) / (max - min)) * 100}%, #e5e7eb ${((localValue.min - min) / (max - min)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Max: {formatValue(localValue.max)}{unit}</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue.max}
            onChange={handleMaxChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((localValue.max - min) / (max - min)) * 100}%, #3b82f6 ${((localValue.max - min) / (max - min)) * 100}%, #3b82f6 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

const FilterModal = ({ isOpen, onClose, recruits, onApplyFilters, currentFilters }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [gpaRange, setGpaRange] = useState({ min: 0, max: 4.0 });
  const [exitVelocityRange, setExitVelocityRange] = useState({ min: 50, max: 120 });
  const [infieldVelocityRange, setInfieldVelocityRange] = useState({ min: 50, max: 100 });
  const [outfieldVelocityRange, setOutfieldVelocityRange] = useState({ min: 60, max: 100 });
  const [moundVelocityRange, setMoundVelocityRange] = useState({ min: 60, max: 100 });
  const [sixtyYardDashRange, setSixtyYardDashRange] = useState({ min: 5.5, max: 8.0 });
  const [heightRange, setHeightRange] = useState({ min: 60, max: 80 });
  const [weightRange, setWeightRange] = useState({ min: 100, max: 300 });

  const allSchools = [...new Set(recruits.map(r => r.highSchool).filter(Boolean))].sort();
  const allYears = [...new Set(recruits.map(r => r.graduationYear).filter(Boolean))].sort().map(String);
  const allPositions = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "P", "DH"];

  const schoolOptions = allSchools.map(school => ({ value: school, label: school }));
  const yearOptions = allYears.map(year => ({ value: year, label: year }));
  const positionOptions = allPositions.map(pos => ({ value: pos, label: pos }));

  useEffect(() => {
    if (isOpen && currentFilters) {
      setSelectedTags(currentFilters.tags || []);
      setSelectedSchools(currentFilters.schools || []);
      setSelectedYears(currentFilters.years || []);
      setSelectedPositions(currentFilters.positions || []);
      setGpaRange(currentFilters.gpa || { min: 0, max: 4.0 });
      setExitVelocityRange(currentFilters.exitVelocity || { min: 50, max: 120 });
      setInfieldVelocityRange(currentFilters.infieldVelocity || { min: 50, max: 100 });
      setOutfieldVelocityRange(currentFilters.outfieldVelocity || { min: 60, max: 100 });
      setMoundVelocityRange(currentFilters.moundVelocity || { min: 60, max: 100 });
      setSixtyYardDashRange(currentFilters.sixtyYardDash || { min: 5.5, max: 8.0 });
      setHeightRange(currentFilters.height || { min: 60, max: 80 });
      setWeightRange(currentFilters.weight || { min: 100, max: 300 });
    }
  }, [isOpen, currentFilters]);

  const handleApply = () => {
    onApplyFilters({
      tags: selectedTags,
      schools: selectedSchools,
      years: selectedYears,
      positions: selectedPositions,
      gpa: gpaRange,
      exitVelocity: exitVelocityRange,
      infieldVelocity: infieldVelocityRange,
      outfieldVelocity: outfieldVelocityRange,
      moundVelocity: moundVelocityRange,
      sixtyYardDash: sixtyYardDashRange,
      height: heightRange,
      weight: weightRange
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedTags([]);
    setSelectedSchools([]);
    setSelectedYears([]);
    setSelectedPositions([]);
    setGpaRange({ min: 0, max: 4.0 });
    setExitVelocityRange({ min: 50, max: 120 });
    setInfieldVelocityRange({ min: 50, max: 100 });
    setOutfieldVelocityRange({ min: 60, max: 100 });
    setMoundVelocityRange({ min: 60, max: 100 });
    setSixtyYardDashRange({ min: 5.5, max: 8.0 });
    setHeightRange({ min: 60, max: 80 });
    setWeightRange({ min: 100, max: 300 });
    onApplyFilters({
      tags: [],
      schools: [],
      years: [],
      positions: [],
      gpa: { min: 0, max: 4.0 },
      exitVelocity: { min: 50, max: 120 },
      infieldVelocity: { min: 50, max: 100 },
      outfieldVelocity: { min: 60, max: 100 },
      moundVelocity: { min: 60, max: 100 },
      sixtyYardDash: { min: 5.5, max: 8.0 },
      height: { min: 60, max: 80 },
      weight: { min: 100, max: 300 }
    });
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedSchools.length > 0 || selectedYears.length > 0 || selectedPositions.length > 0 ||
    gpaRange.min !== 0 || gpaRange.max !== 4.0 ||
    exitVelocityRange.min !== 50 || exitVelocityRange.max !== 120 ||
    infieldVelocityRange.min !== 50 || infieldVelocityRange.max !== 100 ||
    outfieldVelocityRange.min !== 60 || outfieldVelocityRange.max !== 100 ||
    moundVelocityRange.min !== 60 || moundVelocityRange.max !== 100 ||
    sixtyYardDashRange.min !== 5.5 || sixtyYardDashRange.max !== 8.0 ||
    heightRange.min !== 60 || heightRange.max !== 80 ||
    weightRange.min !== 100 || weightRange.max !== 300;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col h-[90vh] max-h-[90vh] overflow-visible">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Filter Recruits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible p-8 min-h-0">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Basic Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MultiSelectDropdown
                  label="Tags"
                  options={TAG_OPTIONS}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Select tags..."
                />
                <MultiSelectDropdown
                  label="Schools"
                  options={schoolOptions}
                  selected={selectedSchools}
                  onChange={setSelectedSchools}
                  placeholder="Select schools..."
                />
                <MultiSelectDropdown
                  label="Graduation Years"
                  options={yearOptions}
                  selected={selectedYears}
                  onChange={setSelectedYears}
                  placeholder="Select years..."
                />
                <MultiSelectDropdown
                  label="Positions"
                  options={positionOptions}
                  selected={selectedPositions}
                  onChange={setSelectedPositions}
                  placeholder="Select positions..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Academic & Physical</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RangeSlider
                  label="GPA"
                  min={0}
                  max={4.0}
                  step={0.1}
                  value={gpaRange}
                  onChange={setGpaRange}
                  unit=""
                />
                <RangeSlider
                  label="Height"
                  min={60}
                  max={80}
                  value={heightRange}
                  onChange={setHeightRange}
                  unit=" in"
                />
                <RangeSlider
                  label="Weight"
                  min={100}
                  max={300}
                  value={weightRange}
                  onChange={setWeightRange}
                  unit=" lbs"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Measurables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RangeSlider
                  label="Exit Velocity"
                  min={50}
                  max={120}
                  value={exitVelocityRange}
                  onChange={setExitVelocityRange}
                  unit=" mph"
                />
                <RangeSlider
                  label="Infield Velocity"
                  min={50}
                  max={100}
                  value={infieldVelocityRange}
                  onChange={setInfieldVelocityRange}
                  unit=" mph"
                />
                <RangeSlider
                  label="Outfield Velocity"
                  min={60}
                  max={100}
                  value={outfieldVelocityRange}
                  onChange={setOutfieldVelocityRange}
                  unit=" mph"
                />
                <RangeSlider
                  label="Mound Velocity"
                  min={60}
                  max={100}
                  value={moundVelocityRange}
                  onChange={setMoundVelocityRange}
                  unit=" mph"
                />
                <RangeSlider
                  label="60-Yard Dash"
                  min={5.5}
                  max={8.0}
                  step={0.1}
                  value={sixtyYardDashRange}
                  onChange={setSixtyYardDashRange}
                  unit="s"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FilterModal;
