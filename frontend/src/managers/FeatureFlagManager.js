import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import AuthManager from "./AuthManager";

class FeatureFlagManager {
  constructor() {
    this.featureFlagsRef = collection(db, "featureFlags");
  }

  async hasAccessToFeature(featureName) {
    try {
      const userId = AuthManager.getCurrentUser()?.uid;
      if (!userId) return false;

      const flagDocRef = doc(this.featureFlagsRef, userId);
      const flagSnap = await getDoc(flagDocRef);

      if (!flagSnap.exists()) {
        return false;
      }

      const flagData = flagSnap.data();
      const hasAccess = flagData.features?.[featureName] === true;
      return hasAccess;
    } catch (error) {
      console.error(`Error checking feature flag ${featureName}:`, error);
      return false;
    }
  }

  async grantFeatureAccess(userId, featureName) {
    try {
      const flagDocRef = doc(this.featureFlagsRef, userId);
      const flagSnap = await getDoc(flagDocRef);

      const features = flagSnap.exists() ? flagSnap.data().features || {} : {};
      features[featureName] = true;

      await setDoc(flagDocRef, {
        userId,
        features,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error(`Error granting feature access:`, error);
      throw error;
    }
  }

  async revokeFeatureAccess(userId, featureName) {
    try {
      const flagDocRef = doc(this.featureFlagsRef, userId);
      const flagSnap = await getDoc(flagDocRef);

      if (!flagSnap.exists()) {
        return { success: true };
      }

      const features = flagSnap.data().features || {};
      features[featureName] = false;

      await setDoc(flagDocRef, {
        userId,
        features,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error(`Error revoking feature access:`, error);
      throw error;
    }
  }
}

const manager = new FeatureFlagManager();
export default manager;

