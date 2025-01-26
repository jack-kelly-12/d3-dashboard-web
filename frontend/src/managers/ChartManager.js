import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getDoc,
  orderBy,
} from "firebase/firestore";
import AuthManager from "./AuthManager";

class ChartManager {
  constructor() {
    this.chartsRef = collection(db, "charts");
    this.authInitialized = false;
    this.currentUser = null;

    AuthManager.onAuthStateChanged((user) => {
      this.authInitialized = true;
      this.currentUser = user;
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async waitForAuth() {
    if (this.authInitialized) return;

    return new Promise((resolve) => {
      const unsubscribe = AuthManager.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.authInitialized = true;
        unsubscribe();
        resolve();
      });
    });
  }

  async getUserCharts() {
    await this.waitForAuth();

    const userId = this.currentUser?.uid;
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    try {
      try {
        const q = query(
          this.chartsRef,
          where("userId", "==", userId),
          orderBy("updatedAt", "desc")
        );

        const snapshot = await getDocs(q);
        return this.processChartDocuments(snapshot);
      } catch (indexError) {
        const q = query(this.chartsRef, where("userId", "==", userId));

        const snapshot = await getDocs(q);
        const charts = this.processChartDocuments(snapshot);

        return charts.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
      }
    } catch (error) {
      console.error("Error in getUserCharts:", error);
      throw new Error(`Failed to fetch charts: ${error.message}`);
    }
  }

  async createChart(chartData) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chart = {
      ...chartData,
      userId,
      pitches: chartData.pitches || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalPitches: chartData.pitches?.length || 0,
      zoneType: chartData.zoneType,
    };

    const docRef = await addDoc(this.chartsRef, chart);

    const returnData = {
      id: docRef.id,
      ...chart,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pitches: chartData.pitches || [],
      totalPitches: chartData.pitches?.length || 0,
      zoneType: chartData.zoneType,
    };

    return returnData;
  }

  processChartDocuments(snapshot) {
    return snapshot.docs.map((doc) => {
      const data = doc.data();

      const createdAt =
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
      const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || createdAt;
      const date = data.date || createdAt;

      const processedData = {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        source: data.source || "d3",
        date,
        totalPitches: data.totalPitches || data.pitches?.length || 0,
        pitches: data.pitches || [],
        homeTeam: data.homeTeam || "",
        awayTeam: data.awayTeam || "",
        zoneType: data.zoneType,
      };

      return processedData;
    });
  }

  async updateChart(chartId, updateData) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));
    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }
    if (chartDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    const { id, userId: _, createdAt, ...safeUpdateData } = updateData;

    const updatePayload = {
      ...safeUpdateData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(this.chartsRef, chartId), updatePayload);

    const updatedDoc = await getDoc(doc(this.chartsRef, chartId));
    return this.processChartDocuments({ docs: [updatedDoc] })[0];
  }

  async getChartById(chartId) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));

    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }

    const chartData = chartDoc.data();

    if (chartData.userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    return {
      id: chartDoc.id,
      ...chartData,
      source: chartData.source || "d3",
      createdAt: chartData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: chartData.updatedAt?.toDate?.()?.toISOString() || null,
    };
  }

  async addPitch(chartId, pitchData) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));
    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }

    const chartData = chartDoc.data();
    if (chartData.userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    const newPitch = {
      ...pitchData,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };

    const updatedPitches = [...(chartData.pitches || []), newPitch];

    await updateDoc(doc(this.chartsRef, chartId), {
      pitches: updatedPitches,
      totalPitches: updatedPitches.length,
      updatedAt: serverTimestamp(),
    });

    return newPitch;
  }

  async updatePitches(chartId, pitches) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));
    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }
    if (chartDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    await updateDoc(doc(this.chartsRef, chartId), {
      pitches,
      totalPitches: pitches.length,
      updatedAt: serverTimestamp(),
    });
  }

  async deletePitch(chartId, pitchId) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));
    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }

    const chartData = chartDoc.data();
    if (chartData.userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    const updatedPitches = chartData.pitches.filter(
      (pitch) => pitch.id !== pitchId
    );

    await updateDoc(doc(this.chartsRef, chartId), {
      pitches: updatedPitches,
      totalPitches: updatedPitches.length,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteChart(chartId) {
    await this.waitForAuth();
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const chartDoc = await getDoc(doc(this.chartsRef, chartId));
    if (!chartDoc.exists()) {
      throw new Error("Chart not found");
    }
    if (chartDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to chart");
    }

    await deleteDoc(doc(this.chartsRef, chartId));
  }

  _formatTimestamp(timestamp) {
    return timestamp?.toDate?.()?.toISOString() || null;
  }
}

const manager = new ChartManager();
export default manager;
