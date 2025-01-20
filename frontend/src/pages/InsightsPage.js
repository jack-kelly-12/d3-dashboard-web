import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Search,
  Sparkles,
  Brain,
  BarChart3,
  TrendingUp,
  Command,
  Terminal,
  ArrowRight,
} from "lucide-react";
import { ResultCard } from "../components/insights/ResultCard";
import { fetchAPI } from "../config/api";
import InfoBanner from "../components/data/InfoBanner";

const EXAMPLE_QUESTIONS = [
  {
    text: "Who led Division 3 in WAR in 2024?",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Leaders",
    gradient: "from-orange-500 to-pink-500",
  },
  {
    text: "Which team had the highest OPS in 2023?",
    icon: <BarChart3 className="w-5 h-5" />,
    category: "Team Stats",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    text: "Show me the top 5 pitchers by strikeout rate in 2024",
    icon: <Brain className="w-5 h-5" />,
    category: "Rankings",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    text: "What was the biggest change in win probability in 2024?",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Analysis",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const InsightsPage = () => {
  const [query, setQuery] = useState("");
  const [currentResult, setCurrentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showShortcut, setShowShortcut] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleExampleClick = (question) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const data = await fetchAPI("/api/insights/query", {
        method: "POST",
        body: JSON.stringify({ question: query }),
      });

      if (data.status === "error" || data.type === "error") {
        throw new Error(
          data.message || data.result?.answer || "An error occurred"
        );
      }

      setCurrentResult({
        question: query,
        answer: data.message || data.result?.answer,
        analysis: data.result?.analysis || [],
        data: data.result?.data,
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
        {/* Header Section */}
        <div className="mb-8">
          <InfoBanner dataType="insights" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 backdrop-blur-xl bg-white/50">
          <div className="p-8">
            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto relative"
            >
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setShowShortcut(true)}
                      onBlur={() => setShowShortcut(false)}
                      placeholder="Ask a question about D3 baseball..."
                      className="w-full px-6 pr-24 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 text-lg transition-all duration-200 group-hover:bg-gray-100"
                      disabled={isLoading}
                    />
                    <div className="absolute right-4 flex items-center gap-2">
                      <kbd
                        className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-gray-100 text-xs text-gray-500 transition-opacity duration-200 ${
                          showShortcut ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <Command className="w-3 h-3" /> K
                      </kbd>
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-200 whitespace-nowrap group"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  )}
                  <span className="font-medium">Ask AI</span>
                </button>
              </div>
            </form>

            {/* Example Questions */}
            {!currentResult && !isLoading && (
              <div className="mt-12 max-w-4xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  Example Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXAMPLE_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question.text)}
                      className="flex items-center text-left p-6 rounded-xl border-2 border-gray-100 hover:border-transparent hover:ring-2 hover:ring-blue-500/20 transition-all duration-200 group relative overflow-hidden bg-white"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${question.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}
                      />
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-200">
                        {question.icon}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-2">
                          {question.category}
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <div className="absolute inset-3 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin animate-delay-150" />
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
