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
  });
  const [shouldResetPlot, setShouldResetPlot] = useState(false);
  const isBullpen = chart.chartType === "bullpen";
  const zoneType = chart.zoneType;
  const [shouldOpenCatcherModal, setShouldOpenCatcherModal] = useState(false);
  const [shouldOpenBatterModal, setShouldOpenBatterModal] = useState(false);
  const [shouldOpenPitcherModal, setShouldOpenPitcherModal] = useState(false);
  const [outs, setOuts] = useState(isBullpen ? null : 0);
  const [balls, setBalls] = useState(isBullpen ? null : 0);
  const [strikes, setStrikes] = useState(isBullpen ? null : 0);
  const [inning, setInning] = useState(isBullpen ? null : 1);
  const [topBottom, setTopBottom] = useState(isBullpen ? null : "Top");
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
            setBalls(lastPitch.balls || 0);
            setStrikes(lastPitch.strikes || 0);
            setOuts(lastPitch.outs || 0);
            setInning(lastPitch.inning || 1);
            setTopBottom(lastPitch.topBottom || "Top");
          } else {
            setBalls(0);
            setStrikes(0);
            setOuts(0);
            setInning(1);
            setTopBottom("Top");
          }

          // Only open pitcher modal if there's no pitcher set
          if (!updatedChart.pitcher) {
            setNextModalType("batter");
            setShouldOpenPitcherModal(true);
          }
        } else {
          // For bullpen, only prompt if no pitcher is set
          if (!updatedChart.pitcher) {
            setShouldOpenPitcherModal(true);
          }
        }
      } catch (error) {
        toast.error("Failed to load chart data");
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
        default:
          break;
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
      const isNewBatterEvent = [
        "walk",
        "strikeout_swinging",
        "strikeout_looking",
        "hbp",
      ].includes(currentPitch.result.toLowerCase());

      let newBalls = balls;
      let newStrikes = strikes;
      let newOuts = outs;

      if (!isBullpen) {
        const result = currentPitch.result?.toLowerCase();
        const hitResult = currentHit.result?.toLowerCase();
        const hitType = currentHit.type?.toLowerCase();

        const isOutType = ["groundout", "flyout", "lineout", "popout"].includes(
          hitType
        );

        if (hitResult === "double_play") {
          newOuts = Math.min(outs + 2, 3);
        } else if (hitResult === "triple_play") {
          newOuts = 3;
        } else if (
          isOutType ||
          ["strikeout_swinging", "strikeout_looking"].includes(result)
        ) {
          newOuts = Math.min(outs + 1, 3);
        }

        if (result === "ball") {
          newBalls = balls + 1;
        } else if (
          ["swinging_strike", "called_strike", "foul"].includes(result)
        ) {
          if (result !== "foul" || strikes < 2) {
            newStrikes = strikes + 1;
          }
        }

        const isHit = [
          "single",
          "double",
          "triple",
          "home_run",
          "fielders_choice",
          "error",
        ].includes(hitResult);
        if (
          result === "walk" ||
          result === "hit_by_pitch" ||
          isOutType ||
          isHit
        ) {
          newBalls = 0;
          newStrikes = 0;
        }

        if (newOuts >= 3) {
          if (!disableAutoOuts) {
            newOuts = 0;
            newBalls = 0;
            newStrikes = 0;

            if (topBottom === "Top") {
              setTopBottom("Bottom");
            } else {
              setTopBottom("Top");
              setInning((prev) => prev + 1);
            }

            setBatter(null);
            setPitcher(null);
            setNextModalType("batter");
            setEditingPlayer("pitcher");
            setIsPlayerModalOpen(true);
          }
        }

        setBalls(newBalls);
        setStrikes(newStrikes);
        setOuts(newOuts);
      }

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
        newPitch.balls = newBalls;
        newPitch.strikes = newStrikes;
        newPitch.outs = newOuts;
        newPitch.inning = inning;
        newPitch.topBottom = topBottom;
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

      const shouldChangeBatter =
        (!disableAutoOuts || newOuts < 3) &&
        (isNewBatterEvent ||
          (isInPlay && (currentHit.result || currentHit.type)));

      if (shouldChangeBatter) {
        setBatter(null);
        setShouldOpenBatterModal(true);
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
              {" "}
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
                <BullpenPitchCounter pitches={pitches} />{" "}
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
              {/* Fixed table container with max-width and horizontal scrolling */}
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
              {/* Fixed table container with max-width and horizontal scrolling */}
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
