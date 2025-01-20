import React, { useState, useEffect, useMemo, memo } from "react";
import {
  Brain,
  Database,
  Lightbulb,
  CheckCircle2,
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
} from "recharts";

// Memoized ThoughtBubble component to prevent unnecessary re-renders
const ThoughtBubble = memo(({ type, content, isActive }) => {
  const types = useMemo(
    () => ({
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
    }),
    []
  );

  const style = types[type];
  const isSQLQuery = useMemo(() => {
    const contentLower = content.toLowerCase();
    return contentLower.includes("select") && contentLower.includes("from");
  }, [content]);

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
});

ThoughtBubble.displayName = "ThoughtBubble";

// Memoized DataVisualizer component
const DataVisualizer = memo(({ data }) => {
  const [visualizationType, setVisualizationType] = useState("table");

  const chartData = useMemo(() => {
    if (!data?.headers || !data?.rows?.length) return [];
    return data.rows.map((row) => ({
      name: row[0],
      value: typeof row[1] === "number" ? row[1] : parseFloat(row[1]) || 0,
    }));
  }, [data]);

  if (!data?.headers || !data?.rows?.length) return null;

  return (
    <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-blue-500" />
          Data Visualization
        </h3>
        <div className="flex items-center gap-2">
          {["table", "chart"].map((type) => (
            <button
              key={type}
              onClick={() => setVisualizationType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  visualizationType === type
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
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
});

DataVisualizer.displayName = "DataVisualizer";

export const ResultCard = ({ result }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const processedSteps = useMemo(() => {
    if (!result?.analysis || !Array.isArray(result.analysis)) {
      return [];
    }

    return result.analysis
      .map((step) => {
        if (!step || typeof step !== "string") {
          return { type: "thought", content: "Invalid step" };
        }

        const stepLower = step.toLowerCase();

        // Helper function to safely extract content
        const extractContent = (prefix) => {
          const parts = step.split(prefix);
          return parts.length > 1 ? parts[1].trim() : step.trim();
        };

        // Handle SQL queries specially
        if (stepLower.includes("query:")) {
          return {
            type: "query",
            content: extractContent("Query:"),
          };
        }

        // Process other step types
        if (stepLower.includes("thought:")) {
          return {
            type: "thought",
            content: extractContent("Thought:"),
          };
        }
        if (stepLower.includes("action:")) {
          const content = extractContent("Action:");
          // If it's a SQL action, wait for the actual query
          if (content.toLowerCase().includes("execute_sql")) {
            return null;
          }
          return { type: "query", content };
        }
        if (stepLower.includes("results:")) {
          return {
            type: "result",
            content: extractContent("Results:"),
          };
        }
        if (stepLower.includes("observation:")) {
          return {
            type: "result",
            content: extractContent("Observation:"),
          };
        }
        if (stepLower.includes("final answer:")) {
          return {
            type: "conclusion",
            content: extractContent("Final Answer:"),
          };
        }

        // Default case - treat as thought
        return { type: "thought", content: step };
      })
      .filter(Boolean); // Remove null/undefined entries
  }, [result?.analysis]);

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
  }, [result, processedSteps.length]);

  if (!result) {
    return null;
  }

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
