import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";

class SubscriptionManager {
  constructor() {
    this.subscriptionsRef = collection(db, "subscriptions");
    this.unsubscribeFromFirestore = null;
  }

  async getUserSubscription(userId) {
    if (!userId) throw new Error("User ID is required");

    const docRef = doc(this.subscriptionsRef, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const now = new Date();
    const expirationDate = data.expiresAt.toDate();

    return {
      ...data,
      isActive: data.status === "active" && expirationDate > now,
      daysUntilExpiration: Math.ceil(
        (expirationDate - now) / (1000 * 60 * 60 * 24)
      ),
      features: this.getFeatureAccess(data),
    };
  }

  getFeatureAccess(subscription) {
    const baseFeatures = {
      d3Access: true,
      scoutingReports: true,
      bullpenCharting: true,
      dataUpload: true,
    };

    if (!subscription || !subscription.status === "active") {
      return {
        ...baseFeatures,
        d1Access: false,
        d2Access: false,
        aiAnalytics: false,
        advancedReports: false,
      };
    }

    return {
      ...baseFeatures,
      d1Access: true,
      d2Access: true,
      aiAnalytics: true,
      advancedReports: true,
    };
  }

  listenToSubscriptionUpdates(userId, callback) {
    if (this.unsubscribeFromFirestore) {
      this.unsubscribeFromFirestore();
    }

    if (!userId) {
      callback(null);
      return () => {};
    }

    const docRef = doc(this.subscriptionsRef, userId);
    this.unsubscribeFromFirestore = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const now = new Date();
          const expirationDate = data.expiresAt.toDate();

          callback({
            ...data,
            isActive: data.status === "active" && expirationDate > now,
            daysUntilExpiration: Math.ceil(
              (expirationDate - now) / (1000 * 60 * 60 * 24)
            ),
            features: this.getFeatureAccess(data),
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to subscription updates:", error);
        callback(null);
      }
    );

    return this.unsubscribeFromFirestore;
  }

  checkSubscriptionStatus = async (userId) => {
    try {
      const response = await fetch(`/api/subscriptions/status/${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return null;
    }
  };

  async getActivePremiumMembers() {
    const q = query(
      this.subscriptionsRef,
      where("status", "==", "active"),
      where("expiresAt", ">", new Date())
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    }));
  }

  async cancelSubscription(userId) {
    const docRef = doc(this.subscriptionsRef, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("No subscription found for this user");
    }

    await updateDoc(docRef, {
      cancelAtPeriodEnd: true,
      updatedAt: serverTimestamp(),
    });
  }

  stopListening() {
    if (this.unsubscribeFromFirestore) {
      this.unsubscribeFromFirestore();
      this.unsubscribeFromFirestore = null;
    }
  }
}

const manager = new SubscriptionManager();
export default manager;
