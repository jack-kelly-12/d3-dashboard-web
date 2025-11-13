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
    return await fetchAPI(`/trending-players?limit=${limit}`);
  } catch (err) {
    console.error("Error fetching trending players:", err);
    throw err;
  }
};



