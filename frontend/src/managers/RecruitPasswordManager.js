import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import AuthManager from "./AuthManager";

class RecruitPasswordManager {
  constructor() {
    this.passwordsRef = collection(db, "recruitPasswords");
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  async setPassword(password) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const passwordHash = await this.hashPassword(password);
      const passwordDocRef = doc(this.passwordsRef, userId);

      await setDoc(passwordDocRef, {
        passwordHash,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error setting password:", error);
      throw error;
    }
  }

  async verifyPassword(password) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) throw new Error("User must be authenticated");

      const passwordDocRef = doc(this.passwordsRef, userId);
      const passwordSnap = await getDoc(passwordDocRef);

      if (!passwordSnap.exists()) {
        return { verified: false, needsSetup: true };
      }

      const passwordData = passwordSnap.data();
      const inputHash = await this.hashPassword(password);

      if (inputHash === passwordData.passwordHash) {
        return { verified: true, needsSetup: false };
      }

      return { verified: false, needsSetup: false };
    } catch (error) {
      console.error("Error verifying password:", error);
      throw error;
    }
  }

  async hasPassword() {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) return false;

      const passwordDocRef = doc(this.passwordsRef, userId);
      const passwordSnap = await getDoc(passwordDocRef);

      return passwordSnap.exists();
    } catch (error) {
      console.error("Error checking password:", error);
      return false;
    }
  }

  async hasActiveAccess() {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) return false;

      const cachedAccess = sessionStorage.getItem(`recruitAccess_${userId}`);
      if (cachedAccess === "true") {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }

  getCurrentUserId() {
    return AuthManager.getCurrentUser()?.uid;
  }
}

const manager = new RecruitPasswordManager();
export default manager;

