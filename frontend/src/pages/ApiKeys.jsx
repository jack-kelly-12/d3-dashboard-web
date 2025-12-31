import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Key, Plus, Trash2, Copy, RefreshCw, Check, ExternalLink, BookOpen } from "lucide-react";
import { fetchAPI, API_BASE_URL } from "../config/api";
import AuthManager from "../managers/AuthManager";
import toast from "react-hot-toast";

const getDocsUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return `${API_BASE_URL}/docs`;
  }
  return "/docs";
};

const CODE_EXAMPLES = {
  curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  "https://d3-dashboard.com/api/batting?years=2024&division=3"`,
  
  python: `import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://d3-dashboard.com/api"

headers = {"X-API-Key": API_KEY}

# Get batting leaderboard
response = requests.get(
    f"{BASE_URL}/batting",
    headers=headers,
    params={"years": "2024", "division": 3}
)
data = response.json()
print(data)`,

  javascript: `const API_KEY = "YOUR_API_KEY";
const BASE_URL = "https://d3-dashboard.com/api";

async function getBatting() {
  const response = await fetch(
    \`\${BASE_URL}/batting?years=2024&division=3\`,
    { headers: { "X-API-Key": API_KEY } }
  );
  const data = await response.json();
  console.log(data);
}

getBatting();`,

  r: `library(httr)
library(jsonlite)

api_key <- "YOUR_API_KEY"
base_url <- "https://d3-dashboard.com/api"

response <- GET(
  paste0(base_url, "/batting"),
  add_headers("X-API-Key" = api_key),
  query = list(years = "2024", division = 3)
)

data <- fromJSON(content(response, "text"))
print(data)`,
};

const CodeExamples = () => {
  const [activeTab, setActiveTab] = useState("python");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const tabs = [
    { id: "curl", label: "cURL" },
    { id: "python", label: "Python" },
    { id: "javascript", label: "JavaScript" },
    { id: "r", label: "R" },
  ];

  return (
    <div className="relative z-10 mt-6 bg-white/60 backdrop-blur rounded-xl border border-white/30 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200/50 px-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={copyCode}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto bg-gray-900 text-gray-100">
        <code>{CODE_EXAMPLES[activeTab]}</code>
      </pre>
    </div>
  );
};

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = AuthManager.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser || currentUser.isAnonymous) {
        navigate("/signin");
      } else {
        fetchKeys();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI("/keys");
      setKeys(data);
    } catch (error) {
      console.error("Failed to fetch keys:", error);
      if (error.status === 401) {
        toast.error("Please sign in to manage API keys");
      }
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (creating) return;
    
    try {
      setCreating(true);
      const data = await fetchAPI("/keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName || undefined }),
      });
      
      setNewKeyName("");
      fetchKeys();
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">API Key Created!</p>
                <p className="mt-1 text-xs text-gray-500">Save this key - it will not be shown again:</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">{data.api_key}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.api_key);
                      toast.success("Copied!");
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ), { duration: 30000 });
      
    } catch (error) {
      console.error("Failed to create key:", error);
      toast.error(error.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId, keyName) => {
    toast((t) => (
      <div className="flex items-center gap-4">
        <span>Revoke {keyName || "this key"}?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await fetchAPI(`/keys/${keyId}`, { method: "DELETE" });
                fetchKeys();
                toast.success("API key revoked");
              } catch (error) {
                toast.error("Failed to revoke key");
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Revoke
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!user || user.isAnonymous) {
    return null;
  }

  const activeKeys = keys.filter(k => k.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container max-w-2xl mx-auto px-8 py-16">
        <div className="relative z-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur p-5 shadow-xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex-shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-gray-800 mb-1">API Keys</div>
                <div className="text-sm text-gray-600">Create and manage your API access tokens. Keys expire after 90 days.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Key name (optional)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={createKey}
                disabled={creating || activeKeys.length >= 3}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
            {activeKeys.length >= 3 && (
              <p className="mt-2 text-xs text-amber-600">
                Maximum 3 active keys. Revoke one to create a new key.
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No API keys yet</p>
              <p className="text-gray-400 text-sm">Create one to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 flex items-center justify-between ${
                    !key.is_active ? "bg-gray-50/50 opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {key.name || "Unnamed Key"}
                      </span>
                      {!key.is_active && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex-shrink-0">
                          {key.is_expired ? "Expired" : "Revoked"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <button
                        onClick={() => copyToClipboard(key.key_prefix + "...")}
                        className="font-mono hover:text-blue-600 flex items-center gap-1"
                      >
                        {key.key_prefix}...
                        <Copy className="w-3 h-3" />
                      </button>
                      <span>Expires {new Date(key.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {key.is_active && (
                    <button
                      onClick={() => revokeKey(key.id, key.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <CodeExamples />

        {/* Documentation Link */}
        <a
          href={getDocsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-6 flex items-center justify-between p-4 bg-white/60 backdrop-blur rounded-xl border border-white/30 hover:bg-white/80 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">API Documentation</div>
              <div className="text-sm text-gray-500">View all endpoints, parameters, and examples</div>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </a>
      </div>
    </div>
  );
};

export default ApiKeys;
