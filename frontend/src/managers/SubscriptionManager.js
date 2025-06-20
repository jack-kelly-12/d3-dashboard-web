import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { fetchAPI } from "../config/api";

class SubscriptionManager {
  constructor() {
    this.subscriptionsRef = collection(db, "subscriptions");
    this.unsubscribeFromFirestore = null;
    this.stripeCache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  async getUserSubscription(userId) {
    if (!userId) throw new Error("User ID is required");

    try {
      const stripeSubscription = await this.getStripeSubscription(userId);

      if (stripeSubscription) {
        return {
          ...stripeSubscription,
          features: this.getFeatureAccess(stripeSubscription),
        };
      }

      const docRef = doc(this.subscriptionsRef, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const now = new Date();
      const expirationDate = data.expiresAt?.toDate() || now;

      return {
        ...data,
        isActive: data.status === "active" && expirationDate > now,
        daysUntilExpiration: Math.ceil(
          (expirationDate - now) / (1000 * 60 * 60 * 24)
        ),
        features: this.getFeatureAccess(data),
      };
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return null;
    }
  }

  async getStripeSubscription(userId) {
    const cacheKey = `stripe_sub_${userId}`;
    const cachedData = this.stripeCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this.cacheTTL) {
      return cachedData.data;
    }

    try {
      const response = await fetchAPI(`/api/stripe/subscription/${userId}`, {
        method: "GET",
      });

      if (!response || !response.subscription) {
        return null;
      }

      const subscription = response.subscription;
      const now = new Date();
      const expirationDate = new Date(subscription.current_period_end * 1000);

      const processedData = {
        status: subscription.status,
        planType: this.getPlanTypeFromPrice(
          subscription.items.data[0]?.price?.id
        ),
        isActive: subscription.status === "active" && expirationDate > now,
        expiresAt: expirationDate,
        daysUntilExpiration: Math.ceil(
          (expirationDate - now) / (1000 * 60 * 60 * 24)
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
      };

      this.stripeCache.set(cacheKey, {
        timestamp: Date.now(),
        data: processedData,
      });

      return processedData;
    } catch (error) {
      console.error("Error fetching from Stripe:", error);
      return null;
    }
  }

  getPlanTypeFromPrice(priceId) {
    if (!priceId) return "monthly";
    return priceId === "price_1QQjEeIb7aERwB58FkccirOh" ? "yearly" : "monthly";
  }

  getFeatureAccess(subscription) {
    const baseFeatures = {
      d3Access: true,
      scoutingReports: true,
      bullpenCharting: true,
      dataUpload: true,
    };

    if (!subscription || subscription.status !== "active") {
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

    this.getStripeSubscription(userId).then((subscription) => {
      if (subscription) {
        callback({
          ...subscription,
          features: this.getFeatureAccess(subscription),
        });
      } else {
        const docRef = doc(this.subscriptionsRef, userId);
        this.unsubscribeFromFirestore = onSnapshot(
          docRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              const now = new Date();
              const expirationDate = data.expiresAt?.toDate() || now;

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
      }
    });

    const pollInterval = setInterval(() => {
      this.getStripeSubscription(userId).then((subscription) => {
        if (subscription) {
          callback({
            ...subscription,
            features: this.getFeatureAccess(subscription),
          });
        }
      });
    }, 60000);

    return () => {
      if (this.unsubscribeFromFirestore) {
        this.unsubscribeFromFirestore();
      }
      clearInterval(pollInterval);
    };
  }

  async checkSubscriptionStatus(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const subscription = await this.getStripeSubscription(userId);
      if (subscription) {
        return {
          isPremium: subscription.isActive,
          status: subscription.status,
          planType: subscription.planType,
          expiresAt: subscription.expiresAt,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        };
      }

      return await fetchAPI(`/api/subscription/status/${userId}`, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return { isActive: false, isPremium: false, error: error.message };
    }
  }

  async cancelSubscription(userId) {
    try {
      const subscription = await this.getStripeSubscription(userId);

      if (!subscription || !subscription.stripeSubscriptionId) {
        const docRef = doc(this.subscriptionsRef, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("No subscription found for this user");
        }

        const subscriptionData = docSnap.data();
        if (!subscriptionData.stripeSubscriptionId) {
          throw new Error("No Stripe subscription ID found");
        }

        await this.cancelStripeSubscription(
          userId,
          subscriptionData.stripeSubscriptionId
        );

        await updateDoc(docRef, {
          cancelAtPeriodEnd: true,
          updatedAt: serverTimestamp(),
        });

        return;
      }

      await this.cancelStripeSubscription(
        userId,
        subscription.stripeSubscriptionId
      );

      this.stripeCache.delete(`stripe_sub_${userId}`);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  async cancelStripeSubscription(userId, subscriptionId) {
    const response = await fetchAPI("/api/cancel-subscription", {
      method: "POST",
      body: JSON.stringify({
        userId,
        subscriptionId: subscriptionId,
      }),
    });

    if (!response.success) {
      const error = response.error || "Failed to cancel subscription in Stripe";
      throw new Error(error);
    }

    return response;
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
