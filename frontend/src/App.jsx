import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import SidebarComponent from "./components/Sidebar";
import Scouting from "./pages/Scouting";
import Guts from "./pages/Guts";
import Data from "./pages/Data";
import Charting from "./pages/Charting";
import Recruiting from "./pages/Recruiting";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import { Toaster } from "react-hot-toast";
import SprayChart from "./components/charting/SprayChart";
import PlayerPage from "./pages/PlayerPage";
import Leaderboards from "./pages/Leaderboards";
import GamePage from "./pages/GamePage";
import Scoreboard from "./pages/Scoreboard";
import PlayerLists from "./pages/PlayerLists";
import SprayChartsPage from "./pages/SprayChartsPage";
import WhatsNewModal from "./components/modals/WhatsNewModal";
import AuthManager from "./managers/AuthManager";

function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const whatsNewVersion = "2025-10-player-id-upgrade";

  const getStorageKey = useMemo(() => {
    const user = AuthManager.getCurrentUser();
    const uid = user?.uid || "anonymous";
    return `whatsnew:${whatsNewVersion}:dismissed:${uid}`;
  }, [whatsNewVersion]);

  useEffect(() => {
    const unsubscribe = AuthManager.onAuthStateChanged(() => {
      const key = getStorageKey;
      const dismissed = typeof window !== "undefined" && window.localStorage.getItem(key);
      setShowWhatsNew(!dismissed);
    });
    return () => unsubscribe();
  }, [getStorageKey]);

  const handleCloseWhatsNew = () => {
    const key = getStorageKey;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, "true");
      }
    } catch {}
    setShowWhatsNew(false);
  };

  return (
    <Router>
      <div className="App flex h-screen">
        <SidebarComponent />
        <div className="content flex-grow overflow-auto">
          <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<HomePage />} />  
              <Route
                path="/guts"
                element={
                    <Guts />
                }
              />
              <Route
                path="/scouting"
                element={
                    <Scouting />
                }
              />
              <Route
                path="/recruiting"
                element={
                    <Recruiting />
                }
              />
              <Route
                path="/charting"
                element={
                    <Charting />
                }
              />
              <Route
                path="/data"
                element={
                    <Data />
                }
              />
              <Route
                path="/spraychart"
                element={
                    <SprayChart />
                }
              />
              <Route
                path="/player/:playerId"
                element={
                    <PlayerPage />
                }
              />
              <Route
                path="scouting/reports/:reportId/spraycharts"
                element={
                    <SprayChartsPage />
                }
              />
              <Route
                path="/leaderboards"
                element={
                    <Leaderboards />
                }
              />
              <Route
                path="/scoreboard"
                element={
                    <Scoreboard />
                }
              />
              <Route
                path="/games/:year/:gameId"
                element={
                    <GamePage />
                }
              />
              <Route
                path="/player-lists"
                element={
                  <PlayerLists />
                }
              />
            </Routes>
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
            <WhatsNewModal isOpen={showWhatsNew} onClose={handleCloseWhatsNew} />
          </div>
        </div>
    </Router>
  );
}

export default App;
