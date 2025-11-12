import { useCallback, useMemo, useState } from "react";
import {
  getPlayerHitting,
  getPlayerPitching,
  getTeamHitting,
  getTeamPitching,
} from "../../../services/dataService";
import { getErrorMessage } from "../../../utils/errorUtils";
import { transformData } from "../utils/transformers";

export function useDataFetch(state, setState) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const endpointMap = useMemo(
    () => ({
      player_hitting: (year) => () => getPlayerHitting(year, state.division),
      player_pitching: (year) => () => getPlayerPitching(year, state.division),
      team_hitting: (year) => () => getTeamHitting(year, state.division),
      team_pitching: (year) => () => getTeamPitching(year, state.division),
    }),
    [state.division]
  );

  const fetchData = useCallback(async () => {
    if (!state.selectedYears.length) return;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        state.selectedYears.map((year) =>
          endpointMap[state.dataType](year)().catch((err) => {
            const errorMessage = getErrorMessage(err, {
              division: state.division,
              dataType: state.dataType,
            });
            throw new Error(errorMessage);
          })
        )
      );

      const combinedData = results.flat();
      if (combinedData.length === 0) {
        setError("No data found for the selected years and filters.");
        return;
      }

      setData(combinedData.map(transformData));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [state, endpointMap]);

  return { data, isLoading, error, fetchData };
}


