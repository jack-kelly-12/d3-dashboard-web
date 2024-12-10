const YearSelector = ({ selectedYears, onChange }) => {
  const years = [2024, 2023, 2022, 2021];

  return (
    <div className="flex flex-wrap gap-2">
      {years.map((year) => (
        <label
          key={year}
          className={`
              relative flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer
              transition-all duration-200 select-none
              ${
                selectedYears.includes(year)
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-blue-50 border border-gray-200"
              }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={selectedYears.includes(year)}
            onChange={() => {
              const newYears = selectedYears.includes(year)
                ? selectedYears.filter((y) => y !== year)
                : [...selectedYears, year].sort((a, b) => b - a);

              if (newYears.length > 0) {
                onChange(newYears);
              }
            }}
          />
          {year}
        </label>
      ))}
    </div>
  );
};

export default YearSelector;
