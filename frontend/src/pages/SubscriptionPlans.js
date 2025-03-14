import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChartBar,
  ClipboardList,
  Target,
  Upload,
  Database,
  Search,
  FileBarChart,
  Check,
  Calendar,
  HelpCircle,
} from "lucide-react";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";
import { useSubscription } from "../contexts/SubscriptionContext";
import toast from "react-hot-toast";
import { fetchAPI } from "../config/api";

const Feature = ({ children, available, icon: Icon }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-4 w-4 text-gray-600" />
    <span className="text-sm text-gray-700">{children}</span>
    {available && <Check className="h-4 w-4 text-blue-600 ml-auto" />}
  </div>
);

function SubscriptionManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(AuthManager.getCurrentUser());
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get("status");

  // Use the subscription context instead of local state
  const { isPremiumUser, isLoadingPremium, error } = useSubscription();
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const getValidDate = (dateValue) => {
    if (!dateValue) return null;

    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const subscriptionEndsAt = getValidDate(subscriptionDetails?.expiresAt);
  const daysUntilExpiration = subscriptionEndsAt
    ? Math.ceil((subscriptionEndsAt - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  useEffect(() => {
    if (status === "success") {
      toast("Successfully subscribed to premium!", {
        icon: "✅",
      });
    } else if (status === "canceled") {
      toast("Payment canceled", {
        icon: "❌",
      });
    }
  }, [status]);

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          // Only fetch subscription details for display purposes
          // The subscription status is already handled by the context
          const subscription = await SubscriptionManager.getUserSubscription(
            currentUser.uid
          );
          setSubscriptionDetails(subscription);
        } else {
          setSubscriptionDetails(null);
        }
      }
    );

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleUpgrade = async (planType) => {
    if (!user || user.isAnonymous) {
      toast("Please create an account to purchase a subscription", {
        icon: "❌",
      });
      navigate("/signin?signup=true", {
        state: {
          returnTo: "/subscriptions",
          message: "Create an account to continue with your purchase",
        },
      });
      return;
    }

    try {
      const response = await fetchAPI("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          userId: user.uid,
          planType: planType,
          email: user.email,
        }),
      });

      const { url } = response;

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from API.");
      }
    } catch (error) {
      console.error("Stripe redirect error:", error);
      toast("Unable to process payment request. Please try again later.", {
        icon: "❌",
      });
    }
  };

  const handleCancel = async () => {
    try {
      await SubscriptionManager.cancelSubscription(user.uid);
      toast("Your subscription has been cancelled", {
        icon: "✅",
      });
      setShowCancelConfirm(false);
    } catch (error) {
      console.error("Cancellation error:", error);
      toast("Unable to cancel subscription. Please try again later.", {
        icon: "❌",
      });
    }
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state
  if (isLoadingPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-8">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">
            <p>Error loading subscription information: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-8">
        <div className="space-y-6">
          {/* Header section */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {isPremiumUser ? "Premium Plan" : "Free Plan"}
            </h1>
            {isPremiumUser && subscriptionEndsAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Premium access until {formatDate(subscriptionEndsAt)}
                </span>
              </div>
            )}
            {isPremiumUser &&
              daysUntilExpiration &&
              daysUntilExpiration <= 30 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  Your subscription will expire in {daysUntilExpiration} days
                </div>
              )}
          </div>

          {/* Features section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-900">Features</h2>
              <button
                onClick={() => setShowFeatureInfo(!showFeatureInfo)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showFeatureInfo && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                Premium features include access to all divisions' data,
                AI-powered insights, and advanced reporting capabilities.
              </div>
            )}

            <div className="space-y-4">
              <Feature icon={ChartBar} available={true}>
                Division 3 Basic/Advance Stats Access
              </Feature>
              <Feature icon={ClipboardList} available={true}>
                Scouting Reports
              </Feature>
              <Feature icon={Target} available={true}>
                Bullpen, Game Charting
              </Feature>
              <Feature icon={Upload} available={true}>
                Trackman, Rapsodo Data Upload
              </Feature>
              <Feature icon={Database} available={isPremiumUser}>
                D1-D3 Data Access
              </Feature>
              <Feature icon={Search} available={isPremiumUser}>
                AI Powered Interactive Analytics Engine
              </Feature>
              <Feature icon={FileBarChart} available={isPremiumUser}>
                Advanced Report Generation
              </Feature>
            </div>
          </div>

          {/* Cancel subscription section for premium users */}
          {isPremiumUser && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-2 px-4 text-center rounded text-red-600 text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
            >
              Cancel Subscription
            </button>
          )}

          {isPremiumUser && showCancelConfirm && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600">
                Are you sure you want to cancel? You'll continue to have access
                until {formatDate(subscriptionEndsAt)}.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-2 px-4 text-center rounded text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-2 px-4 text-center rounded text-red-600 text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upgrade section for free users */}
          {!isPremiumUser && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Upgrade to Premium to unlock all features
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleUpgrade("monthly")}
                  className="w-full flex flex-col items-center justify-center py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <span className="text-sm font-medium text-white">
                    Monthly
                  </span>
                  <span className="text-blue-200 text-xs">$10/month</span>
                </button>
                <div className="relative">
                  <div className="absolute -top-2 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    67% off
                  </div>
                  <button
                    onClick={() => handleUpgrade("yearly")}
                    className="w-full flex flex-col items-center justify-center py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-white">
                      Yearly
                    </span>
                    <span className="text-blue-200 text-xs">$40/year</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Secure payment via Stripe • Cancel anytime
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
