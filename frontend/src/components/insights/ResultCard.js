import React, { useState, useEffect, useMemo, memo } from "react";
import { Brain, Database, Lightbulb, CheckCircle2, Zap } from "lucide-react";

const DataTable = ({ data }) => {
  if (!data || !data.headers || !data.rows) return null;

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {cell?.toString() ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
        const extractContent = (prefix) => {
          const parts = step.split(prefix);
          return parts.length > 1 ? parts[1].trim() : step.trim();
        };

        if (stepLower.includes("query:")) {
          return { type: "query", content: extractContent("Query:") };
        }
        if (stepLower.includes("thought:")) {
          return { type: "thought", content: extractContent("Thought:") };
        }
        if (stepLower.includes("action:")) {
          const content = extractContent("Action:");
          if (content.toLowerCase().includes("execute_sql")) {
            return null;
          }
          return { type: "query", content };
        }
        if (
          stepLower.includes("results:") ||
          stepLower.includes("observation:")
        ) {
          return {
            type: "result",
            content: extractContent(
              stepLower.includes("results:") ? "Results:" : "Observation:"
            ),
          };
        }
        if (stepLower.includes("final answer:")) {
          return {
            type: "conclusion",
            content: extractContent("Final Answer:"),
          };
        }

        return { type: "thought", content: step };
      })
      .filter(Boolean);
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

  if (!result) return null;

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
        {result.data && <DataTable data={result.data} />}
      </div>
    </div>
  );
};
