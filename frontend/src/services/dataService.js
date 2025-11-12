import { fetchAPI } from "../config/api";
import { db } from "../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const getPlayerHitting = (year, division) =>
  fetchAPI(`/api/batting?year=${year}&division=${division}`);

export const getPlayerPitching = (year, division) =>
  fetchAPI(`/api/pitching_war/${year}?division=${division}`);

export const getTeamHitting = (year, division) =>
  fetchAPI(`/api/batting_team_war/${year}?division=${division}`);

export const getTeamPitching = (year, division) =>
  fetchAPI(`/api/pitching_team_war/${year}?division=${division}`);

export const getConferences = (division) =>
  fetchAPI(`/conferences?division=${division}`).then((r) => r.sort());

export const trackPlayerPageVisit = async (playerId, playerName) => {
  try {
    const playerDocRef = doc(db, "playerPageVisits", playerId);
    const docSnap = await getDoc(playerDocRef);
    
    if (docSnap.exists()) {
      await setDoc(playerDocRef, {
        playerId,
        playerName,
        visitCount: docSnap.data().visitCount + 1,
        lastVisitedAt: serverTimestamp(),
      });
    } else {
      await setDoc(playerDocRef, {
        playerId,
        playerName,
        visitCount: 1,
        lastVisitedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Error tracking player page visit:", err);
  }
};

export const getTopPlayersByVisits = async (limit = 10) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || "http://localhost:8000"}/api/trending-players?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch trending players");
    return await response.json();
  } catch (err) {
    console.error("Error fetching trending players:", err);
    return [];
  }
};



