import { useEffect, useState } from "react";
import PlayerListManager from "../../../managers/PlayerListManager";

export function useSelectedPlayerListIds(selectedListId, dataType) {
  const [selectedListPlayerIds, setSelectedListPlayerIds] = useState([]);
  const [isLoadingPlayerList, setIsLoadingPlayerList] = useState(false);

  useEffect(() => {
    const fetchPlayerList = async () => {
      if (!selectedListId || !dataType.includes("player")) {
        setSelectedListPlayerIds([]);
        return;
      }

      try {
        setIsLoadingPlayerList(true);
        const list = await PlayerListManager.getPlayerListById(selectedListId);
        if (list && list.playerIds) setSelectedListPlayerIds(list.playerIds);
        else setSelectedListPlayerIds([]);
      } catch (err) {
        console.error("Error fetching player list:", err);
        setSelectedListPlayerIds([]);
      } finally {
        setIsLoadingPlayerList(false);
      }
    };

    fetchPlayerList();
  }, [selectedListId, dataType]);

  return { selectedListPlayerIds, isLoadingPlayerList };
}



