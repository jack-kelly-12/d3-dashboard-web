import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

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
      isActive:
        data.status === "active" && new Date(data.expiresAt) > new Date(),
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
      const stripe = await stripePromise;

      return stripe.redirectToCheckout({
        sessionId: session.id,
      });
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

export const manageSubscription = async (userId, subscriptionData) => {
  try {
    const subscriptionRef = doc(db, "subscriptions", userId);

    await setDoc(subscriptionRef, {
      status: "active",
      type: subscriptionData.type, // "monthly" or "yearly"
      startDate: new Date(),
      endDate: new Date(
        Date.now() +
          (subscriptionData.type === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error managing subscription:", error);
    return { success: false, error };
  }
};

export const checkSubscriptionStatus = async (userId) => {
  try {
    const subscriptionRef = doc(db, "subscriptions", userId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return { isSubscribed: false };
    }

    const data = subscriptionDoc.data();
    const isActive =
      data.status === "active" && new Date(data.endDate.toDate()) > new Date();

    return {
      isSubscribed: isActive,
      subscription: data,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isSubscribed: false, error };
  }
};

const manager = new SubscriptionManager();
export default manager;
