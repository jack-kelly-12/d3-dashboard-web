import React, { useState, useRef } from "react";
import {
  Send,
  Loader2,
  Search,
  Sparkles,
  Brain,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import InfoBanner from "../components/data/InfoBanner";
import { fetchAPI } from "../config/api";

const EXAMPLE_QUESTIONS = [
  {
    text: "Who led Division 3 in WAR in 2024?",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Leaders",
  },
  {
    text: "Which team had the highest OPS in 2023?",
    icon: <BarChart3 className="w-5 h-5" />,
    category: "Team Stats",
  },
  {
    text: "Show me the top 5 pitchers by strikeout rate in 2024",
    icon: <Brain className="w-5 h-5" />,
    category: "Rankings",
  },
  {
    text: "What was the biggest upset by win probability in 2024?",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Analysis",
  },
];

const ResultCard = ({ result }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        {result.answer}
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* Analysis Process */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">
            Analysis Process
          </span>
        </div>
        <div className="space-y-3 pl-4">
          {result.analysis.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                {index + 1}
              </div>
              <span className="text-gray-700 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table with modern styling */}
      {result.data && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {result.data.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {result.data.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 text-sm text-gray-700 font-medium"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
);

const InsightsPage = () => {
  const [query, setQuery] = useState("");
  const [currentResult, setCurrentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const handleExampleClick = (question) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetchAPI("/api/insights/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: query }),
      });

      if (response.type === "error") {
        throw new Error(response.result.answer);
      }

      setCurrentResult({
        question: query,
        ...response.result,
      });
    } catch (error) {
      console.error("Error processing query:", error);
      setCurrentResult({
        question: query,
        answer:
          error.message ||
          "Sorry, I encountered an error processing your request.",
        analysis: ["Error occurred while processing the query"],
        data: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
      <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        <InfoBanner dataType="insights" />

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question about D3 baseball..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 text-lg"
                    disabled={isLoading}
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span className="font-medium">Ask AI</span>
                </button>
              </div>
            </form>

            {/* Enhanced Example Questions */}
            {!currentResult && !isLoading && (
              <div className="mt-12 max-w-4xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Example Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXAMPLE_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question.text)}
                      className="flex items-center text-left p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                        {question.icon}
                      </div>
                      <div className="ml-4">
                        <div className="text-xs font-semibold text-blue-600 mb-1">
                          {question.category}
                        </div>
                        <div className="text-gray-700 font-medium">
                          {question.text}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <div className="absolute inset-3 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">
                    Analyzing statistics...
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Crunching the numbers
                  </p>
                </div>
              </div>
            )}

            {/* Results Section */}
            {currentResult && !isLoading && (
              <div className="mt-10 max-w-4xl mx-auto">
                <div className="mb-6 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900 font-medium">
                      {currentResult.question}
                    </span>
                  </div>
                </div>
                <ResultCard result={currentResult} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
