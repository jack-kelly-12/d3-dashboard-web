import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import AuthManager from "../managers/AuthManager";

class ScoutingReportManager {
  constructor() {
    this.reportsRef = collection(db, "scoutingReports");
  }

  async createReport(reportData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const report = {
        ...reportData,
        division: reportData.division || 3,
        year: reportData.year || 2024,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(this.reportsRef, report);
      return { id: docRef.id, ...report };
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  async getReportById(reportId) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const reportRef = doc(this.reportsRef, reportId);
      const reportSnap = await getDoc(reportRef);

      if (!reportSnap.exists()) {
        throw new Error("Report not found");
      }

      const reportData = reportSnap.data();

      // Verify the user has permission to access this report
      if (reportData.userId !== userId) {
        throw new Error("Unauthorized access to report");
      }

      return {
        id: reportId,
        ...reportData,
        division: reportData.division || 3,
        year: reportData.year || 2024,
      };
    } catch (error) {
      console.error("Error getting report:", error);
      throw error;
    }
  }

  async getUserReports() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const q = query(this.reportsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        division: doc.data().division || 3,
        year: doc.data().year || 2024,
      }));
    } catch (error) {
      console.error("Error getting user reports:", error);
      throw error;
    }
  }

  async updateReport(reportId, updateData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const reportRef = doc(this.reportsRef, reportId);

      await updateDoc(reportRef, {
        ...updateData,
        division: updateData.division || 3,
        year: updateData.year || 2024,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating report:", error);
      throw error;
    }
  }

  async deleteReport(reportId) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) {
        throw new Error("User must be authenticated");
      }

      const reportRef = doc(this.reportsRef, reportId);
      const snapshot = await getDocs(
        query(this.reportsRef, where("userId", "==", userId))
      );

      const reportExists = snapshot.docs.some((doc) => doc.id === reportId);
      if (!reportExists) {
        throw new Error("Report not found or unauthorized");
      }

      await deleteDoc(reportRef);

      return { success: true };
    } catch (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
  }
}

const manager = new ScoutingReportManager();
export default manager;
