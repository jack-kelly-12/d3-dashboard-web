import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  arrayUnion,
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

  async handleStripeWebhook(event) {
    const { type, data } = event;
    const userId = data.object.client_reference_id;
    const subscriptionRef = doc(this.subscriptionsRef, userId);

    try {
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      switch (type) {
        case "checkout.session.completed":
          await setDoc(subscriptionRef, {
            status: "active",
            stripeCustomerId: data.object.customer,
            customerId: data.object.customer,
            planType: data.object.metadata.planType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isManuallySet: false,
            expiresAt: new Date(
              data.object.subscription.current_period_end * 1000
            ),
            lastPayment: serverTimestamp(),
            paymentHistory: [
              {
                amount: data.object.amount_total,
                date: serverTimestamp(),
                status: "succeeded",
              },
            ],
          });
          break;

        case "customer.subscription.updated":
          Object.assign(updateData, {
            status: data.object.status,
            planType: data.object.metadata.planType,
            currentPeriodEnd: new Date(data.object.current_period_end * 1000),
            expiresAt: new Date(data.object.current_period_end * 1000),
            cancelAtPeriodEnd: data.object.cancel_at_period_end,
          });
          await updateDoc(subscriptionRef, updateData);
          break;

        case "customer.subscription.deleted":
          Object.assign(updateData, {
            status: "canceled",
            cancelAtPeriodEnd: false,
            canceledAt: serverTimestamp(),
          });
          await updateDoc(subscriptionRef, updateData);
          break;

        case "invoice.payment_succeeded":
          await updateDoc(subscriptionRef, {
            lastPayment: serverTimestamp(),
            paymentHistory: arrayUnion({
              amount: data.object.amount_paid,
              date: serverTimestamp(),
              status: "succeeded",
            }),
          });
          break;

        case "invoice.payment_failed":
          await updateDoc(subscriptionRef, {
            status: "past_due",
            paymentHistory: arrayUnion({
              amount: data.object.amount_due,
              date: serverTimestamp(),
              status: "failed",
            }),
          });
          break;

        default:
          console.log(`Unhandled webhook event type: ${type}`);
          break;
      }
    } catch (error) {
      console.error("Error handling subscription webhook:", error);
      throw error;
    }
  }

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
