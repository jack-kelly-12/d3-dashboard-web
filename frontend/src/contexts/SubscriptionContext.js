import React, { createContext, useContext, useState, useEffect } from "react";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscriptionState, setSubscriptionState] = useState({
    isPremiumUser: false,
    isLoadingPremium: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
      if (!isMounted) return;

      if (user) {
        try {
          const initialSubscription =
            await SubscriptionManager.getUserSubscription(user.uid);

          if (isMounted) {
            setSubscriptionState((prev) => ({
              ...prev,
              isPremiumUser: initialSubscription?.isActive || false,
              isLoadingPremium: false,
            }));
          }

          SubscriptionManager.listenToSubscriptionUpdates(
            user.uid,
            (subscription) => {
              if (isMounted) {
                setSubscriptionState((prev) => ({
                  ...prev,
                  isPremiumUser: subscription?.isActive || false,
                  isLoadingPremium: false,
                }));
              }
            }
          );
        } catch (error) {
          if (isMounted) {
            setSubscriptionState((prev) => ({
              ...prev,
              error: error.message,
              isLoadingPremium: false,
            }));
          }
        }
      } else {
        if (isMounted) {
          setSubscriptionState((prev) => ({
            ...prev,
            isPremiumUser: false,
            isLoadingPremium: false,
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      SubscriptionManager.stopListening();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={subscriptionState}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
