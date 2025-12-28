export function filterData(allData, state, selectedListPlayerIds) {
  let filtered = allData.filter((item) => {
    const searchStr = state.searchTerm.toLowerCase();
    const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
    const team = item.Team?.toLowerCase() || "";
    const meetsQualifier =
      state.dataType === "player_pitching"
        ? item.IP >= state.minIP
        : state.dataType === "player_hitting"
        ? item.PA >= state.minPA
        : true;
    const meetsConference = state.selectedConference
      ? item.Conference === state.selectedConference
      : true;

    return (
      meetsQualifier &&
      meetsConference &&
      (name.includes(searchStr) || team.includes(searchStr))
    );
  });

  if (
    state.selectedListId &&
    selectedListPlayerIds.length > 0 &&
    state.dataType.includes("player")
  ) {
    filtered = filtered.filter((item) => {
      const playerId = item.player_id || item.Player_ID;
      if (!playerId) return false;
      return selectedListPlayerIds.some(
        (id) =>
          id === playerId.toString() ||
          id === playerId ||
          (playerId.toString().includes("d3d-") &&
            id === playerId.toString().replace("d3d-", ""))
      );
    });
  }

  return filtered;
}



