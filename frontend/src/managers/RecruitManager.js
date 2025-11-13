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
import AuthManager from "./AuthManager";

class RecruitManager {
  constructor() {
    this.recruitsRef = collection(db, "recruits");
  }

  async createRecruit(recruitData) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const recruit = {
        ...recruitData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(this.recruitsRef, recruit);
      return { id: docRef.id, ...recruit };
    } catch (error) {
      console.error("Error creating recruit:", error);
      throw error;
    }
  }

  async getRecruitById(recruitId) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const recruitRef = doc(this.recruitsRef, recruitId);
      const recruitSnap = await getDoc(recruitRef);

      if (!recruitSnap.exists()) {
        throw new Error("Recruit not found");
      }

      const recruitData = recruitSnap.data();

      if (recruitData.userId !== userId) {
        throw new Error("Unauthorized access to recruit");
      }

      return {
        id: recruitId,
        ...recruitData,
      };
    } catch (error) {
      console.error("Error getting recruit:", error);
      throw error;
    }
  }

  async getUserRecruits() {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const q = query(this.recruitsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting user recruits:", error);
      throw error;
    }
  }

  async updateRecruit(recruitId, updateData) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const recruitRef = doc(this.recruitsRef, recruitId);

      await updateDoc(recruitRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating recruit:", error);
      throw error;
    }
  }

  async deleteRecruit(recruitId) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) {
        throw new Error("User must be authenticated");
      }

      const recruitRef = doc(this.recruitsRef, recruitId);
      const snapshot = await getDocs(
        query(this.recruitsRef, where("userId", "==", userId))
      );

      const recruitExists = snapshot.docs.some((doc) => doc.id === recruitId);
      if (!recruitExists) {
        throw new Error("Recruit not found or unauthorized");
      }

      await deleteDoc(recruitRef);

      return { success: true };
    } catch (error) {
      console.error("Error deleting recruit:", error);
      throw error;
    }
  }
}

const manager = new RecruitManager();
export default manager;

