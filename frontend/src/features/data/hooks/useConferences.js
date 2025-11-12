import { useEffect, useState } from "react";
import { getConferences } from "../../../services/dataService";

export function useConferences(division) {
  const [conferences, setConferences] = useState([]);

  useEffect(() => {
    const loadConferences = async () => {
      try {
        const response = await getConferences(division);
        setConferences(response);
      } catch (err) {
        console.error("Error fetching conferences:", err);
      }
    };
    loadConferences();
  }, [division]);

  return conferences;
}



