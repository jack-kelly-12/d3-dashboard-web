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
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const report = {
      ...reportData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(this.reportsRef, report);
    return { id: docRef.id, ...report };
  }

  async getUserReports() {
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const q = query(this.reportsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async updateReport(reportId, updateData) {
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const reportRef = doc(this.reportsRef, reportId);
    await updateDoc(reportRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteReport(reportId) {
    const userId = AuthManager.getCurrentUser()?.uid;
    if (!userId) throw new Error("User must be authenticated");

    await deleteDoc(doc(this.reportsRef, reportId));
  }
}

const manager = new ScoutingReportManager();
export default manager;
