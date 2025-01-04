import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

class SubscriptionManager {
  constructor() {
    this.subscriptionsRef = collection(db, "subscriptions");
    this.unsubscribeFromFirestore = null;
  }

  async getUserSubscription(userId) {
    console.log(userId);
    if (!userId) throw new Error("User ID is required");

    const docRef = doc(this.subscriptionsRef, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      isActive:
        data.status === "active" &&
        new Date(data.expiresAt.toDate()) > new Date(),
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
          callback({
            ...data,
            isActive:
              data.status === "active" &&
              new Date(data.expiresAt.toDate()) > new Date(),
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

  // This method will be called by your webhook handler
  async handleStripeWebhook(event) {
    const { type, data } = event;
    const userId = data.object.client_reference_id; // From your URL parameter
    const subscriptionRef = doc(this.subscriptionsRef, userId);

    try {
      switch (type) {
        case "checkout.session.completed":
          // When checkout completes successfully
          await setDoc(subscriptionRef, {
            status: "active",
            stripeCustomerId: data.object.customer,
            customerId: data.object.customer,
            planType: data.object.metadata.planType, // 'monthly' or 'yearly'
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            expiresAt: new Date(
              data.object.subscription.current_period_end * 1000
            ),
          });
          break;

        case "customer.subscription.updated":
          // When subscription is updated (renewal, plan change, etc.)
          await updateDoc(subscriptionRef, {
            status: data.object.status,
            planType: data.object.metadata.planType,
            currentPeriodEnd: new Date(data.object.current_period_end * 1000),
            expiresAt: new Date(data.object.current_period_end * 1000),
            cancelAtPeriodEnd: data.object.cancel_at_period_end,
            updatedAt: serverTimestamp(),
          });
          break;

        case "customer.subscription.deleted":
          // When subscription is cancelled or expires
          await updateDoc(subscriptionRef, {
            status: "canceled",
            cancelAtPeriodEnd: false,
            updatedAt: serverTimestamp(),
          });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling subscription webhook:", error);
      throw error;
    }
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
