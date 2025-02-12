import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, User, Bot } from "lucide-react";
import { fetchAPI } from "../config/api";
import InfoBanner from "../components/data/InfoBanner";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";

const DataTable = ({ data }) => {
  if (!data || !data.headers || !data.rows) return null;

  return (
    <div className="mt-4 overflow-x-auto rounded-lg bg-white">
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
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell !== null ? cell : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Message = ({ content, type, isLoading, timestamp, data }) => (
  <div
    className={`flex ${
      type === "user" ? "justify-end" : "justify-start"
    } mb-6 group`}
  >
    <div
      className={`flex items-start max-w-2xl ${
        type === "user" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          type === "user"
            ? "bg-gradient-to-tr from-blue-600 to-blue-500"
            : "bg-gradient-to-tr from-gray-700 to-gray-600"
        } text-white`}
      >
        {type === "user" ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      <div
        className={`mx-4 relative ${
          type === "user" ? "text-right" : "text-left"
        }`}
      >
        <div className="text-xs text-gray-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {type === "user" ? "You" : "AI Assistant"} •{" "}
          {new Date(timestamp).toLocaleTimeString()}
        </div>
        <div
          className={`px-6 py-4 rounded-2xl shadow-sm ${
            type === "user"
              ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white"
              : "bg-white border border-gray-100 text-gray-800"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 px-4">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
              {data && <DataTable data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const QueryInput = ({ query, setQuery, isLoading, onSubmit, inputRef }) => (
  <div className="border-t border-gray-100 bg-white p-4 backdrop-blur-xl">
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about D3 baseball..."
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  </div>
);

const EmptyState = () => (
  <div className="text-center text-gray-500 mt-20">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center shadow-xl">
      <Bot className="w-10 h-10 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      Welcome to D3 Baseball Insights
    </h3>
    <p className="text-gray-500 max-w-sm mx-auto">
      Ask questions about D3 baseball statistics and get detailed analysis with
      supporting evidence.
    </p>
  </div>
);

const InsightsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [conversationState, setConversationState] = useState({
    id: null,
    messages: [],
  });
  const [authState, setAuthState] = useState({
    isReady: false,
    isPremium: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedConversation = localStorage.getItem("insights_conversation");
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setConversationState(parsed);
      } catch (e) {
        console.error("Error loading saved conversation:", e);
        localStorage.removeItem("insights_conversation");
      }
    }
  }, []);

  useEffect(() => {
    if (conversationState.id) {
      localStorage.setItem(
        "insights_conversation",
        JSON.stringify(conversationState)
      );
    }
  }, [conversationState]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationState.messages]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const unsubscribe = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user) {
          const subscription = await SubscriptionManager.getUserSubscription(
            user.uid
          );
          if (isMounted) {
            setAuthState({
              isReady: true,
              isPremium: subscription?.isActive || false,
            });
          }
        } else {
          setAuthState({ isReady: true, isPremium: false });
        }
      });
      return unsubscribe;
    };

    const cleanup = initAuth();
    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || !authState.isPremium) {
      if (!authState.isPremium) navigate("/subscriptions");
      return;
    }

    const userMessage = query;
    const timestamp = new Date().toISOString();

    setConversationState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { type: "user", content: userMessage, timestamp },
      ],
    }));

    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetchAPI("/api/insights/query", {
        method: "POST",
        body: JSON.stringify({
          question: userMessage,
          conversation_id: conversationState.id,
        }),
      });

      if (response.status === "error" || response.type === "error") {
        throw new Error(
          response.message || response.result?.answer || "An error occurred"
        );
      }

      // Handle successful response with data
      const result = response.result;

      setConversationState((prev) => ({
        id: response.conversation_id || prev.id,
        messages: [
          ...prev.messages,
          {
            type: "ai",
            content: result.answer,
            timestamp: new Date().toISOString(),
            data: result.data, // Include the SQL query results
          },
        ],
      }));
    } catch (error) {
      console.error("Error processing query:", error);
      setConversationState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            type: "ai",
            content: "Sorry, I encountered an error processing your request.",
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationState({
      id: null,
      messages: [],
    });
    localStorage.removeItem("insights_conversation");
  };

  if (!authState.isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-xl">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Premium Feature
          </h2>
          <p className="text-gray-600 mb-6">
            Access to AI Insights requires a premium subscription.
          </p>
          <button
            onClick={() => navigate("/subscriptions")}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="h-screen flex flex-col">
          <div className="py-4 flex justify-between items-center">
            <InfoBanner dataType="insights" />
            {conversationState.messages.length > 0 && (
              <button
                onClick={startNewConversation}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Start New Conversation
              </button>
            )}
          </div>

          <div className="flex-1 bg-gray-50 rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden backdrop-blur-xl mb-8">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {conversationState.messages.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {conversationState.messages.map((message, index) => (
                    <Message key={index} {...message} />
                  ))}
                  {isLoading && (
                    <Message type="ai" isLoading={true} content="" />
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <QueryInput
              query={query}
              setQuery={setQuery}
              isLoading={isLoading}
              onSubmit={handleQuery}
              inputRef={inputRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
