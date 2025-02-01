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
} from "firebase/firestore";
import AuthManager from "../managers/AuthManager";

class ScoutingReportManager {
  constructor() {
    this.reportsRef = collection(db, "scoutingReports");
  }

  async createReport(reportData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for auth to initialize
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      // Ensure division is included in the report
      const report = {
        ...reportData,
        division: reportData.division || 3, // Default to D3 if not specified
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

  async getUserReports() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for auth to initialize
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const q = query(this.reportsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        division: doc.data().division || 3, // Ensure division exists for older reports
      }));
    } catch (error) {
      console.error("Error getting user reports:", error);
      throw error;
    }
  }

  async updateReport(reportId, updateData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for auth to initialize
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const reportRef = doc(this.reportsRef, reportId);

      // Preserve division when updating
      await updateDoc(reportRef, {
        ...updateData,
        division: updateData.division || 3, // Ensure division is preserved
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
