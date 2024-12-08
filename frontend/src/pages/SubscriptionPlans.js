import React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

const PlanFeature = ({ children, isPremium }) => (
  <li className="flex items-start gap-3">
    <Check
      className={`h-5 w-5 ${
        isPremium ? "text-blue-500" : "text-gray-400"
      } flex-shrink-0`}
    />
    <span className={`text-gray-600 ${isPremium ? "font-medium" : ""}`}>
      {children}
    </span>
  </li>
);

function SubscriptionPlans() {
  const navigate = useNavigate();

  const handleStartFree = () => {
    navigate("/data");
  };

  const handleBuyPremium = async () => {
    try {
      // Replace with your Stripe checkout URL
      const stripeCheckoutUrl = process.env.REACT_APP_STRIPE_CHECKOUT_URL;
      if (!stripeCheckoutUrl) {
        throw new Error("Stripe checkout URL not configured");
      }
      window.location.href = stripeCheckoutUrl;
    } catch (error) {
      console.error("Stripe redirect error:", error);
      toast.error("Unable to process payment request. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start with our free plan or unlock all features with Premium
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="flex flex-col p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <span className="ml-1 text-xl font-semibold">/forever</span>
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              <PlanFeature>Access to all basic statistics</PlanFeature>
              <PlanFeature>Create scouting reports</PlanFeature>
              <PlanFeature>Basic charting features</PlanFeature>
              <PlanFeature>Community support</PlanFeature>
            </ul>

            <button
              onClick={handleStartFree}
              className="block w-full py-3 px-6 text-center rounded-lg text-gray-700 font-medium border-2 border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              Get Started Free
            </button>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-col p-8 bg-white rounded-2xl shadow-sm ring-2 ring-blue-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
              Premium Features
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-bold tracking-tight">$10</span>
                <span className="ml-1 text-xl font-semibold">/month</span>
              </div>
              <p className="mt-2 text-sm text-blue-600 font-medium">
                or $40/year (save 67%)
              </p>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              <PlanFeature isPremium>Everything in Free plan</PlanFeature>
              <PlanFeature isPremium>Data upload capability</PlanFeature>
              <PlanFeature isPremium>Custom analytical reports</PlanFeature>
            </ul>

            <button
              onClick={handleBuyPremium}
              className="block w-full py-3 px-6 text-center rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlans;
