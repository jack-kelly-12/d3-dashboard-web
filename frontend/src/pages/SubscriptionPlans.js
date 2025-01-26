import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChartBar,
  ClipboardList,
  Target,
  Upload,
  Database,
  Search,
  FileBarChart,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";

const Feature = ({ children, available, icon: Icon }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-4 w-4 text-gray-600" />
    <span className="text-sm text-gray-700">{children}</span>
    {available ? (
      <Check className="h-4 w-4 text-blue-600 ml-auto" />
    ) : (
      <X className="h-4 w-4 text-red-400 ml-auto" />
    )}
  </div>
);

function SubscriptionManagement({ isPremium, subscriptionEndsAt }) {
  const navigate = useNavigate();
  const user = AuthManager.getCurrentUser();
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);

  const handleUpgrade = async (planType) => {
    if (!user || user.isAnonymous) {
      toast.error("Please create an account to purchase a subscription");
      navigate("/signin?signup=true", {
        state: {
          returnTo: "/subscriptions",
          message: "Create an account to continue with your purchase",
        },
      });
      return;
    }

    try {
      const stripeUrls = {
        monthly: process.env.REACT_APP_STRIPE_MONTHLY_URL,
        yearly: process.env.REACT_APP_STRIPE_YEARLY_URL,
      };

      const url = new URL(stripeUrls[planType]);
      url.searchParams.append("client_reference_id", user.uid);
      url.searchParams.append("prefilled_email", user.email);

      window.location.href = url.toString();
    } catch (error) {
      console.error("Stripe redirect error:", error);
      toast.error("Unable to process payment request. Please try again later.");
    }
  };

  const handleCancel = async () => {
    try {
      await SubscriptionManager.cancelSubscription(user.uid);
      toast.success("Your subscription has been cancelled");
    } catch (error) {
      console.error("Cancellation error:", error);
      toast.error("Unable to cancel subscription. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-8">
        <div className="space-y-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isPremium ? "Premium Plan" : "Free Plan"}
          </h1>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-900">
                Available Features
              </h2>
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
              <Feature icon={Database} available={isPremium}>
                D1-D3 Data Access
              </Feature>
              <Feature icon={Search} available={isPremium}>
                AI Powered Interactive Analytics Engine
              </Feature>
              <Feature icon={FileBarChart} available={isPremium}>
                Advanced Report Generation
              </Feature>
            </div>
          </div>

          {!isPremium && (
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

          {isPremium && (
            <button
              onClick={handleCancel}
              className="w-full py-2 px-4 text-center rounded text-red-600 text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
