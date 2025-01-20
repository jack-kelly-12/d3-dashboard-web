import React, { useState, useEffect } from "react";
import {
  Brain,
  Code,
  Database,
  LineChart,
  ChevronRight,
  ClipboardCheck,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Zap,
  TableProperties,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

const ThoughtBubble = ({ type, content, isActive }) => {
  const types = {
    thought: {
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      color: "border-purple-200 bg-purple-50",
      iconBg: "bg-purple-100",
    },
    query: {
      icon: <Database className="h-5 w-5 text-blue-500" />,
      color: "border-blue-200 bg-blue-50",
      iconBg: "bg-blue-100",
    },
    result: {
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      color: "border-amber-200 bg-amber-50",
      iconBg: "bg-amber-100",
    },
    conclusion: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      color: "border-emerald-200 bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
  };

  const style = types[type];
  const isSQLQuery =
    content.toLowerCase().includes("select") &&
    content.toLowerCase().includes("from");

  return (
    <div
      className={`
      relative rounded-xl border p-4 transition-all duration-300
      ${style.color} 
      ${isActive ? "scale-100 shadow-md" : "scale-95 opacity-70"}
    `}
    >
      <div className="flex gap-4">
        <div className={`rounded-lg ${style.iconBg} p-2 h-fit`}>
          {style.icon}
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium capitalize">{type}</div>
          {isSQLQuery ? (
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-gray-200 overflow-x-auto">
              {content}
            </div>
          ) : (
            <div className="text-gray-700">{content}</div>
          )}
        </div>
      </div>
      {isActive && (
        <div className="absolute -right-2 -top-2">
          <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></div>
        </div>
      )}
    </div>
  );
};

const DataVisualizer = ({ data }) => {
  const [visualizationType, setVisualizationType] = useState("table");

  if (!data?.headers || !data?.rows?.length) return null;

  const chartData = data.rows.map((row) => ({
    name: row[0],
    value: typeof row[1] === "number" ? row[1] : parseFloat(row[1]) || 0,
  }));

  return (
    <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-blue-500" />
          Data Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisualizationType("table")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                visualizationType === "table"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Table
          </button>
          <button
            onClick={() => setVisualizationType("chart")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                visualizationType === "chart"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Chart
          </button>
        </div>
      </div>

      {visualizationType === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {data.headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b border-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export const ResultCard = ({ result }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setCurrentStepIndex(0);
    const timer = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex < processedSteps.length - 1) {
          return prevIndex + 1;
        }
        clearInterval(timer);
        return prevIndex;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [result]);

  const processedSteps = result.analysis.map((step) => {
    const stepLower = step.toLowerCase();
    if (stepLower.includes("thought:")) {
      return { type: "thought", content: step.split("Thought:")[1].trim() };
    }
    if (stepLower.includes("action: execute_sql")) {
      return { type: "query", content: step.split("Action Input:")[1].trim() };
    }
    if (stepLower.includes("observation:")) {
      return { type: "result", content: step.split("Observation:")[1].trim() };
    }
    if (stepLower.includes("final answer:")) {
      return {
        type: "conclusion",
        content: step.split("Final Answer:")[1].trim(),
      };
    }
    return { type: "thought", content: step };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              AI Response
            </h3>
            <p className="text-gray-700">{result.answer}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Thought Process
          </h4>
          <div className="space-y-4">
            {processedSteps.map((step, index) => (
              <ThoughtBubble
                key={index}
                type={step.type}
                content={step.content}
                isActive={index === currentStepIndex}
              />
            ))}
          </div>
        </div>

        {result.data && <DataVisualizer data={result.data} />}
      </div>
    </div>
  );
};
