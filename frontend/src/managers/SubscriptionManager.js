import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

class SubscriptionManager {
  constructor() {
    this.subscriptionsRef = collection(db, "subscriptions");
  }

  async getUserSubscription(userId) {
    if (!userId) throw new Error("User ID is required");

    const docRef = doc(this.subscriptionsRef, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      isActive: data.status === "active" && new Date(data.endDate) > new Date(),
    };
  }

  async createCheckoutSession(userId, priceId) {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          priceId,
        }),
      });

      const session = await response.json();

      if (!session || !session.id) {
        throw new Error("Invalid checkout session response");
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async handleSubscriptionUpdate(subscriptionId, userId, status) {
    const docRef = doc(this.subscriptionsRef, userId);

    await updateDoc(docRef, {
      subscriptionId,
      status,
      updatedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  async createSubscription(userId, subscriptionData) {
    const docRef = doc(this.subscriptionsRef, userId);

    await setDoc(docRef, {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async cancelSubscription(userId) {
    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error("Failed to cancel subscription");

      const docRef = doc(this.subscriptionsRef, userId);
      await updateDoc(docRef, {
        status: "canceled",
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
}

const manager = new SubscriptionManager();
export default manager;
