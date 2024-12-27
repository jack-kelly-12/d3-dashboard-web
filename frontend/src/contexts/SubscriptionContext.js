import React, { createContext, useContext, useState, useEffect } from "react";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const setupSubscriptionListener = async () => {
      const user = AuthManager.getCurrentUser();
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      unsubscribe = SubscriptionManager.listenToSubscriptionUpdates(
        user.uid,
        (subscriptionData) => {
          setSubscription(subscriptionData);
          setIsLoading(false);
        }
      );
    };

    setupSubscriptionListener();

    return () => unsubscribe();
  }, []);

  const value = {
    subscription,
    isLoading,
    hasActiveSubscription: subscription?.isActive || false,
    isPremium: subscription?.status === "active",
    planType: subscription?.planType,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
