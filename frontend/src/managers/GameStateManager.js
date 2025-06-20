export default class GameStateManager {
  /**
   * Updates the game state based on pitch and hit results
   * @param {Object} currentState - Current game state
   * @param {Object} pitch - Pitch details
   * @param {Object} hit - Hit details (if any)
   * @param {boolean} disableAutoOuts - Whether to disable automatic inning changes
   * @returns {Object} Updated game state and flags
   */
  static updateGameState(
    currentState,
    pitch,
    hit = null,
    disableAutoOuts = false
  ) {
    const { balls, strikes, outs, inning, topBottom } = currentState;

    let newState = {
      balls,
      strikes,
      outs,
      inning,
      topBottom,
      shouldChangeBatter: false,
      shouldChangeInning: false,
      shouldChangePitcher: false,
    };

    const pitchResult = pitch.result?.toLowerCase();
    const isInPlay = pitchResult === "in_play";

    if (["swinging_strike", "called_strike", "foul"].includes(pitchResult)) {
      if (!(pitchResult === "foul" && strikes === 2)) {
        newState.strikes = Math.min(strikes + 1, 2);
      }
    }

    if (pitchResult === "ball") {
      newState.balls = Math.min(balls + 1, 3);
    }

    if (["strikeout_swinging", "strikeout_looking"].includes(pitchResult)) {
      newState.strikes = 0;
      newState.balls = 0;
      newState.outs = Math.min(outs + 1, 3);
      newState.shouldChangeBatter = true;
    }

    if (pitchResult === "walk" || pitchResult === "hbp") {
      newState.strikes = 0;
      newState.balls = 0;
      newState.shouldChangeBatter = true;
    }

    if (newState.balls === 4) {
      // Walk
      newState.strikes = 0;
      newState.balls = 0;
      newState.shouldChangeBatter = true;
    }

    if (newState.strikes === 3) {
      // Strikeout
      newState.strikes = 0;
      newState.balls = 0;
      newState.outs = Math.min(outs + 1, 3);
      newState.shouldChangeBatter = true;
    }

    if (isInPlay && hit) {
      const hitResult = hit.result?.toLowerCase();

      if (hitResult === "double_play") {
        newState.outs = Math.min(outs + 2, 3);
      } else if (hitResult === "triple_play") {
        newState.outs = 3;
      } else if (hitResult === "field_out" || hitResult === "fielders_choice") {
        newState.outs = Math.min(outs + 1, 3);
      }

      if (pitchResult === "baserunner_(1_out)") {
        newState.outs = Math.min(outs + 1, 3);
      } else if (hitResult === "baserunner_(2_out)") {
        newState.outs = Math.min(outs + 2, 3);
      }

      newState.strikes = 0;
      newState.balls = 0;
      newState.shouldChangeBatter = true;
    }

    if (newState.outs >= 3 && !disableAutoOuts) {
      newState.outs = 0;
      newState.balls = 0;
      newState.strikes = 0;
      newState.shouldChangeInning = true;

      if (topBottom === "Top") {
        newState.topBottom = "Bottom";
      } else {
        newState.topBottom = "Top";
        newState.inning = inning + 1;
        newState.shouldChangePitcher = true;
      }
    }

    return newState;
  }

  /**
   * Formats the current game state as a string
   * @param {Object} state - Current game state
   * @returns {string} Formatted game state (e.g., "Top 3, 1 Out, 2-1 Count")
   */
  static formatGameState(state) {
    const { balls, strikes, outs, inning, topBottom } = state;
    const outText = outs === 1 ? "Out" : "Outs";
    return `${topBottom} ${inning}, ${outs} ${outText}, ${balls}-${strikes} Count`;
  }
}
