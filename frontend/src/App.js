import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import SidebarComponent from "./components/Sidebar";
import Scouting from "./pages/Scouting";
import Guts from "./pages/Guts";
import Data from "./pages/Data";
import Charting from "./pages/Charting";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import { Toaster } from "react-hot-toast";
import SprayChart from "./components/charting/SprayChart";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import PlayerPage from "./pages/PlayerPage.js";
import Documentation from "./pages/Documentation.js";
import Leaderboards from "./pages/Leaderboards.js";
import GamePage from "./pages/GamePage.js";
import Scoreboard from "./pages/Scoreboard.js";
import InsightsPage from "./pages/InsightsPage.js";
import PlayerLists from "./pages/PlayerLists.js"; // Import the new PlayerLists component
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "./contexts/SubscriptionContext";
import BaseballSpraychart from "./components/scouting/SprayChart";
import SprayChartsPage from "./pages/SprayChartsPage.js";
import GamePrediction from "./pages/Simulation.js";

export const ProtectedRoute = ({ children, requiresPremium = false }) => {
  const { isLoading, isPremium } = useSubscription();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requiresPremium && !isPremium) {
    return (
      <Navigate
        to="/subscriptions"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <Router>
      <SubscriptionProvider>
        <div className="App flex h-screen">
          <SidebarComponent />
          <div className="content flex-grow overflow-auto">
            <Routes>
              {/* Public routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/subscriptions" element={<SubscriptionPlans />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route
                path="/baseball-spraychart"
                element={<BaseballSpraychart />}
              />

              {/* Basic feature routes (require authentication but not premium) */}
              <Route
                path="/guts"
                element={
                  <ProtectedRoute>
                    <Guts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulation"
                element={
                  <ProtectedRoute>
                    <GamePrediction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scouting"
                element={
                  <ProtectedRoute>
                    <Scouting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/charting"
                element={
                  <ProtectedRoute>
                    <Charting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data"
                element={
                  <ProtectedRoute>
                    <Data />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spraychart"
                element={
                  <ProtectedRoute>
                    <SprayChart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/player/:playerId"
                element={
                  <ProtectedRoute>
                    <PlayerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="scouting/reports/:reportId/spraycharts"
                element={
                  <ProtectedRoute>
                    <SprayChartsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboards"
                element={
                  <ProtectedRoute>
                    <Leaderboards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scoreboard"
                element={
                  <ProtectedRoute>
                    <Scoreboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/:year/:gameId"
                element={
                  <ProtectedRoute>
                    <GamePage />
                  </ProtectedRoute>
                }
              />
              {/* New Player Lists route */}
              <Route
                path="/player-lists"
                element={
                  <ProtectedRoute>
                    <PlayerLists />
                  </ProtectedRoute>
                }
              />

              {/* Premium routes */}
              <Route
                path="/insights"
                element={
                  <ProtectedRoute>
                    <InsightsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#4ade80",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </SubscriptionProvider>
    </Router>
  );
}

export default App;
