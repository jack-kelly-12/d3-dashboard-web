import React, { useState } from "react";
import { Brain, TrendingUp, TableIcon } from "lucide-react";

export const ProcessStep = ({ content, index, type }) => {
  const types = {
    thought: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <Brain className="h-5 w-5 text-amber-600" />,
      numberBg: "bg-amber-100",
      numberText: "text-amber-700",
    },
    action: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <TableIcon className="h-5 w-5 text-blue-600" />,
      numberBg: "bg-blue-100",
      numberText: "text-blue-700",
    },
    result: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: <TrendingUp className="h-5 w-5 text-gray-600" />,
      numberBg: "bg-gray-100",
      numberText: "text-gray-700",
    },
  };

  const style = types[type];

  return (
    <div className={`rounded-lg ${style.bg} border ${style.border} p-4`}>
      <div className="flex gap-3">
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${style.numberBg} text-sm font-semibold ${style.numberText}`}
        >
          {index + 1}
        </span>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const DataTable = ({ data }) => {
  const [showFullTable, setShowFullTable] = useState(false);

  if (!data?.headers || !data?.rows) return null;

  const displayRows = showFullTable ? data.rows : data.rows.slice(0, 5);

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number" && value <= 1 && value >= 0) {
      return (value * 100).toFixed(1) + "%";
    }
    if (typeof value === "number" && String(value).includes(".")) {
      return value.toFixed(2);
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Results</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {data.headers.map((header, i) => (
                <th
                  key={i}
                  className="border-b border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-t border-gray-100 px-6 py-3 text-sm text-gray-700"
                  >
                    {formatValue(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.rows.length > 5 && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showFullTable
              ? "Show Less"
              : `Show All (${data.rows.length} rows)`}
          </button>
        </div>
      )}
    </div>
  );
};

export const ResultCard = ({ result }) => {
  if (!result?.answer) return null;

  const steps = [];
  console.log(result);
  result.analysis?.forEach((step) => {
    if (step.startsWith("Thought:")) {
      steps.push({
        type: "thought",
        content: step.replace("Thought:", "").trim(),
      });
    } else if (step.startsWith("Action:")) {
      steps.push({
        type: "action",
        content: step.replace("Action:", "").trim(),
      });
    } else if (step.startsWith("Result:")) {
      steps.push({
        type: "result",
        content: step.replace("Result:", "").trim(),
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Main insight */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">{result.answer}</h3>
          </div>
        </div>
      </div>

      {/* Analysis Process */}
      {steps.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Analysis Process</h3>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <ProcessStep
                key={index}
                index={index}
                content={step.content}
                type={step.type}
              />
            ))}
          </div>
        </div>
      )}

      {/* Data table */}
      {result.data && <DataTable data={result.data} />}
    </div>
  );
};
