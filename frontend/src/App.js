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
import { SubscriptionProvider } from "./contexts/SubscriptionContext";

function App() {
  return (
    <Router>
      <SubscriptionProvider>
        <div className="App flex h-screen">
          <SidebarComponent />
          <div className="content flex-grow overflow-auto">
            <Routes>
              <Route path="/guts" element={<Guts />} />
              <Route path="/scouting" element={<Scouting />} />
              <Route path="/charting" element={<Charting />} />
              <Route path="/data" element={<Data />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/spraychart" element={<SprayChart />} />
              <Route path="/subscriptions" element={<SubscriptionPlans />} />
              <Route path="/player/:playerId" element={<PlayerPage />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/games/:year/:gameId" element={<GamePage />} />
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
