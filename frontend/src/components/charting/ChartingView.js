import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import StrikeZone from "./StrikeZone";
import SprayChart from "./SprayChart";
import PlayerSelector from "./PlayerSelector";
import PitchInput from "./PitchInput";
import HitInput from "./HitInput";
import PitchTable from "../tables/PitchTable";
import PlayerModal from "../modals/PlayerModal";
import ChartManager from "../../managers/ChartManager";
import GameStateManager from "../../managers/GameStateManager";
import { BullpenPitchCounter, GamePitchCounter } from "./PitchCounter";

export const ChartingView = ({ chart, onSave, onBack }) => {
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [pitcher, setPitcher] = useState(chart.pitcher || null);
  const [batter, setBatter] = useState(chart.batter || null);
  const [catcher, setCatcher] = useState(chart.catcher || null);
  const [umpire, setUmpire] = useState(chart.umpire || null);
  const [pitches, setPitches] = useState(chart.pitches || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isStrikeZone, setIsStrikeZone] = useState(true);
  const disableAutoOuts = chart.disableAutoOuts || false;

  const [gameState, setGameState] = useState({
    balls: 0,
    strikes: 0,
    outs: 0,
    inning: 1,
    topBottom: "Top",
  });

  const [currentPitch, setCurrentPitch] = useState({
    velocity: null,
    type: "",
    result: "",
    location: null,
    note: "",
  });

  const [currentHit, setCurrentHit] = useState({
    type: "",
    location: null,
    result: "",
    exitVelocity: "",
  });

  const [shouldResetPlot, setShouldResetPlot] = useState(false);
  const isBullpen = chart.chartType === "bullpen";
  const zoneType = chart.zoneType;
  const [shouldOpenCatcherModal, setShouldOpenCatcherModal] = useState(false);
  const [shouldOpenBatterModal, setShouldOpenBatterModal] = useState(false);
  const [shouldOpenPitcherModal, setShouldOpenPitcherModal] = useState(false);
  const [nextModalType, setNextModalType] = useState(null);
  const [isPitcherView, setIsPitcherView] = useState(false);

  useEffect(() => {
    if (shouldOpenCatcherModal) {
      setEditingPlayer("catcher");
      setIsPlayerModalOpen(true);
      setShouldOpenCatcherModal(false);
    }
  }, [shouldOpenCatcherModal]);

  useEffect(() => {
    if (shouldOpenBatterModal) {
      setEditingPlayer("batter");
      setIsPlayerModalOpen(true);
      setShouldOpenBatterModal(false);
    }
  }, [shouldOpenBatterModal]);

  useEffect(() => {
    if (shouldOpenPitcherModal) {
      setEditingPlayer("pitcher");
      setIsPlayerModalOpen(true);
      setShouldOpenPitcherModal(false);
    }
  }, [shouldOpenPitcherModal]);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        const updatedChart = await ChartManager.getChartById(chart.id);
        setPitches(updatedChart.pitches || []);
        setPitcher(updatedChart.pitcher || null);
        setBatter(updatedChart.batter || null);
        setCatcher(updatedChart.catcher || null);
        setUmpire(updatedChart.umpire || null);

        if (!isBullpen) {
          const lastPitch =
            updatedChart.pitches?.[updatedChart.pitches.length - 1];
          if (lastPitch) {
            setGameState({
              balls: lastPitch.balls || 0,
              strikes: lastPitch.strikes || 0,
              outs: lastPitch.outs || 0,
              inning: lastPitch.inning || 1,
              topBottom: lastPitch.topBottom || "Top",
            });
          } else {
            setGameState({
              balls: 0,
              strikes: 0,
              outs: 0,
              inning: 1,
              topBottom: "Top",
            });
          }

          if (!updatedChart.pitcher) {
            setNextModalType("batter");
            setShouldOpenPitcherModal(true);
          }
        } else {
          if (!updatedChart.pitcher) {
            setShouldOpenPitcherModal(true);
          }
        }
      } catch (error) {
        toast.error("Failed to load chart data");
        console.error("Chart load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [chart.id, isBullpen]);

  const handlePlayerEdit = (type) => {
    if (type === "pitcher" && !isBullpen) {
      setNextModalType("batter");
    }
    setEditingPlayer(type);
    setIsPlayerModalOpen(true);
  };

  const handlePlayerSubmit = async (playerData) => {
    const loadingToast = toast.loading("Updating player...");
    try {
      let updatedData = {};
      let playerUpdate = null;

      switch (editingPlayer) {
        case "pitcher":
          playerUpdate = {
            name: playerData.name,
            pitchHand: playerData.pitchHand,
          };
          setPitcher(playerUpdate);
          updatedData.pitcher = playerUpdate;
          break;
        case "batter":
          if (!isBullpen) {
            playerUpdate = {
              name: playerData.name,
              batHand: playerData.batHand,
            };
            setBatter(playerUpdate);
            updatedData.batter = playerUpdate;
          }
          break;
        case "catcher":
          playerUpdate = {
            name: playerData.name,
          };
          setCatcher(playerUpdate);
          updatedData.catcher = playerUpdate;
          break;
        case "umpire":
          playerUpdate = {
            name: playerData.name,
          };
          setUmpire(playerUpdate);
          updatedData.umpire = playerUpdate;
          break;
        default:
          break;
      }

      const updatedChart = await ChartManager.updateChart(
        chart.id,
        updatedData
      );
      setIsPlayerModalOpen(false);

      onSave(updatedChart.pitches, updatedChart);

      if (nextModalType) {
        setTimeout(() => {
          setEditingPlayer(nextModalType);
          setIsPlayerModalOpen(true);
          setNextModalType(null);
        }, 100);
      }

      if (editingPlayer === "pitcher") {
        setCatcher(null);
      }

      toast.success("Player updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update player", { id: loadingToast });
    }
  };

  const handlePlotPitch = (location) => {
    setShouldResetPlot(false);
    if (isStrikeZone) {
      setCurrentPitch((prev) => ({
        ...prev,
        location,
      }));
    } else {
      setCurrentHit((prev) => ({
        ...prev,
        location,
      }));
    }
  };

  const handleAddPitch = async () => {
    try {
      const isInPlay = currentPitch.result.toLowerCase() === "in_play";

      const newPitch = {
        id: Date.now().toString(),
        time: new Date().toISOString(),
        pitcher: {
          name: pitcher.name,
          pitchHand: pitcher.pitchHand,
        },
        batter: isBullpen
          ? null
          : {
              name: batter.name,
              batHand: batter.batHand,
            },
        catcher: catcher?.name || null,
        umpire: umpire?.name || null,
        ...currentPitch,
        x: currentPitch.location.x,
        y: currentPitch.location.y,
      };

      if (!isBullpen) {
        const updatedState = GameStateManager.updateGameState(
          gameState,
          currentPitch,
          isInPlay ? currentHit : null,
          disableAutoOuts
        );
        setGameState({
          balls: updatedState.balls,
          strikes: updatedState.strikes,
          outs: updatedState.outs,
          inning: updatedState.inning,
          topBottom: updatedState.topBottom,
        });

        newPitch.balls = updatedState.balls;
        newPitch.strikes = updatedState.strikes;
        newPitch.outs = updatedState.outs;
        newPitch.inning = updatedState.inning;
        newPitch.topBottom = updatedState.topBottom;

        if (updatedState.shouldChangeBatter) {
          setBatter(null);
          setShouldOpenBatterModal(true);
        }

        if (updatedState.shouldChangePitcher) {
          setPitcher(null);
          setNextModalType("batter");
          setShouldOpenPitcherModal(true);
        }
      }

      if (isInPlay) {
        newPitch.hitDetails = {
          x: currentHit.location.x,
          y: currentHit.location.y,
          type: currentHit.type,
          result: currentHit.result,
          exitVelocity: currentHit.exitVelocity,
        };
      }

      await ChartManager.addPitch(chart.id, newPitch);
      const updatedChart = await ChartManager.getChartById(chart.id);
      setPitches(updatedChart.pitches);
      onSave(updatedChart.pitches);

      setCurrentPitch({
        velocity: null,
        type: "",
        result: "",
        location: null,
        note: "",
      });

      setCurrentHit({
        type: "",
        location: null,
        result: "",
        exitVelocity: "",
      });

      setShouldResetPlot(true);
      setTimeout(() => setShouldResetPlot(false), 200);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add pitch");
    }
  };

  const handleUpdatePitch = async (pitchId, updates) => {
    const loadingToast = toast.loading("Updating pitch...");
    try {
      await ChartManager.updatePitch(chart.id, pitchId, updates);
      const updatedChart = await ChartManager.getChartById(chart.id);
      setPitches(updatedChart.pitches);
      onSave(updatedChart.pitches);
      toast.success("Pitch updated successfully", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to update pitch", { id: loadingToast });
    }
  };

  const handleResetPitch = () => {
    setShouldResetPlot(true);
    if (isStrikeZone) {
      setCurrentPitch({
        velocity: null,
        type: "",
        result: "",
        location: null,
        note: "",
      });
    } else {
      setCurrentHit({
        type: "",
        location: null,
      });
    }
    setTimeout(() => setShouldResetPlot(false), 200);
  };

  const handleDeletePitch = async (id) => {
    const loadingToast = toast.loading("Deleting pitch...");
    try {
      await ChartManager.deletePitch(chart.id, id);
      const updatedChart = await ChartManager.getChartById(chart.id);
      setPitches(updatedChart.pitches);
      onSave(updatedChart.pitches);
      toast.success("Pitch deleted successfully", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to delete pitch", { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Display the current game state for game charts
  const GameStateDisplay = () => {
    if (isBullpen) return null;

    return (
      <div className="bg-blue-50 px-4 py-2 rounded-md mb-4 text-center font-medium text-blue-800">
        {GameStateManager.formatGameState(gameState)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {isBullpen ? (
          // Bullpen View
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="w-full mb-6">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft size={20} />
                <span>Back to Charts</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 w-full">
              <div className="space-y-6">
                <div className="space-y-4">
                  <PlayerSelector
                    type="Pitcher"
                    player={pitcher}
                    onEdit={() => handlePlayerEdit("pitcher")}
                    required
                    isBullpen={isBullpen}
                  />
                </div>

                <PitchInput
                  currentPitch={currentPitch}
                  onChange={setCurrentPitch}
                  onSubmit={handleAddPitch}
                  onReset={handleResetPitch}
                  disabled={!pitcher}
                  isBullpen={true}
                  zoneType={zoneType}
                />
              </div>
              <div className="flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setIsPitcherView(!isPitcherView)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm
        border border-gray-200 text-sm font-medium text-gray-700
        hover:bg-gray-50 transition-colors"
                  >
                    Toggle View
                  </button>
                </div>
                <BullpenPitchCounter pitches={pitches} />
                <StrikeZone
                  key={isPitcherView ? "pitcher" : "catcher"}
                  onPlotPitch={handlePlotPitch}
                  pitches={pitches}
                  currentPitch={currentPitch}
                  shouldReset={shouldResetPlot}
                  isBullpen={true}
                  isPitcherView={isPitcherView}
                  zoneType={zoneType}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Pitch History
                </h2>
              </div>
              <div className="w-full max-w-full">
                <PitchTable
                  pitches={pitches}
                  onDeletePitch={handleDeletePitch}
                  onUpdatePitch={handleUpdatePitch}
                  isBullpen={true}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center mb-6">
            <div className="w-full mb-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft size={20} />
                <span>Back to Charts</span>
              </button>
            </div>

            {/* Game state display */}
            <GameStateDisplay />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <PlayerSelector
                      type="Pitcher"
                      player={pitcher}
                      onEdit={() => handlePlayerEdit("pitcher")}
                      required
                    />
                    <PlayerSelector
                      type="Batter"
                      player={batter}
                      onEdit={() => handlePlayerEdit("batter")}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <PlayerSelector
                      type="Catcher"
                      player={catcher}
                      onEdit={() => handlePlayerEdit("catcher")}
                    />
                    <PlayerSelector
                      type="Umpire"
                      player={umpire}
                      onEdit={() => handlePlayerEdit("umpire")}
                    />
                  </div>
                </div>

                {isStrikeZone ? (
                  <PitchInput
                    currentPitch={currentPitch}
                    onChange={setCurrentPitch}
                    onSubmit={handleAddPitch}
                    onReset={handleResetPitch}
                    disabled={!pitcher || !batter}
                    isBullpen={false}
                  />
                ) : (
                  <HitInput
                    currentHit={currentHit}
                    onChange={setCurrentHit}
                    onReset={handleResetPitch}
                    disabled={!pitcher || !batter}
                  />
                )}
              </div>

              <div className="flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex rounded-lg p-1 bg-gray-100 shadow-sm">
                  <button
                    onClick={() => setIsStrikeZone(true)}
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                      isStrikeZone
                        ? "bg-white text-blue-600 shadow"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    Strike Zone
                  </button>
                  <button
                    onClick={() => setIsStrikeZone(false)}
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                      !isStrikeZone
                        ? "bg-white text-blue-600 shadow"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    Spray Chart
                  </button>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setIsPitcherView(!isPitcherView)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm
      border border-gray-200 text-sm font-medium text-gray-700
      hover:bg-gray-50 transition-colors"
                  >
                    Toggle View
                  </button>
                </div>
                <GamePitchCounter
                  pitches={pitches.filter(
                    (p) => p.pitcher?.name === pitcher?.name
                  )}
                  currentPitcher={pitcher}
                />
                {isStrikeZone ? (
                  <StrikeZone
                    key={isPitcherView ? "pitcher" : "catcher"}
                    onPlotPitch={handlePlotPitch}
                    pitches={pitches.filter(
                      (p) =>
                        !p.isHit && (!batter || p.batter?.name === batter?.name)
                    )}
                    currentPitch={currentPitch}
                    shouldReset={shouldResetPlot}
                    isBullpen={false}
                    isPitcherView={isPitcherView}
                  />
                ) : (
                  <SprayChart
                    hits={pitches.filter(
                      (p) => p.isHit && p.batter?.name === batter?.name
                    )}
                    onPlotHit={handlePlotPitch}
                    currentHit={currentHit}
                    shouldReset={shouldResetPlot}
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Pitch History
                </h2>
              </div>
              <div className="w-full max-w-full">
                <PitchTable
                  pitches={pitches}
                  onDeletePitch={handleDeletePitch}
                  onUpdatePitch={handleUpdatePitch}
                  showBatter={true}
                  isBullpen={isBullpen}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSubmit={handlePlayerSubmit}
        type={editingPlayer}
        chart={chart}
      />
    </div>
  );
};

export default ChartingView;
