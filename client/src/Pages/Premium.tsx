import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import {
  CrownOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  CreditCardOutlined,
  LockOutlined,
  ForwardOutlined,
  AppstoreOutlined,
  SlidersOutlined,
} from "@ant-design/icons";

/**
 * Premium upgrade page component
 * Provides premium features overview and payment form
 */
const Premium = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showLoading, dismiss } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    email: "",
  });

  // Premium features data
  const premiumFeatures = [
    {
      icon: <SlidersOutlined className="text-2xl" />,
      title: "Timeline Navigation",
      description:
        "Navigate freely through any track by clicking on the progress bar",
      currentLimit: "Timeline navigation disabled",
      premiumFeature: "Click-to-seek enabled",
    },
    {
      icon: <AppstoreOutlined className="text-2xl" />,
      title: "More Playlists",
      description: "Create up to 15 custom playlists instead of 5",
      currentLimit: "5 playlists max",
      premiumFeature: "15 playlists max",
    },
    {
      icon: <ForwardOutlined className="text-2xl" />,
      title: "Unlimited Skips",
      description: "Skip as many tracks as you want without waiting",
      currentLimit: "Limited skips per hour",
      premiumFeature: "Unlimited skips",
    },
  ];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      const formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .substr(0, 19);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    // Format expiry date with slash
    if (name === "expiryDate") {
      const formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .substr(0, 5);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    // Limit CVV to 3 digits
    if (name === "cvv") {
      const formattedValue = value.replace(/\D/g, "").substr(0, 3);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.cardNumber ||
      !formData.expiryDate ||
      !formData.cvv ||
      !formData.cardholderName ||
      !formData.email
    ) {
      showError("Please fill in all required fields");
      return;
    }

    if (formData.cardNumber.replace(/\s/g, "").length !== 16) {
      showError("Please enter a valid 16-digit card number");
      return;
    }

    if (formData.cvv.length !== 3) {
      showError("Please enter a valid 3-digit CVV");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError("Please enter a valid email address");
      return;
    }

    setIsProcessing(true);
    const loadingToast = showLoading("Processing your payment...");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Simulate random success/failure for demo
      const success = Math.random() > 0.3; // 70% success rate

      dismiss(loadingToast);

      if (success) {
        showSuccess("Welcome to Premium! Your subscription is now active.");
        // Reset form
        setFormData({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
          email: "",
        });
        // Redirect after success
        setTimeout(() => navigate("/"), 2000);
      } else {
        showError(
          "Payment failed. Please check your card details and try again."
        );
      }
    } catch (error) {
      dismiss(loadingToast);
      showError(
        "An error occurred during payment processing. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-8 mb-45 xl:mb-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Go back to home"
        >
          <ArrowLeftOutlined className="text-white text-xl" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl border border-purple-500/30">
            <CrownOutlined className="text-yellow-400 text-2xl" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">
              Upgrade to Premium
            </h1>
            <p className="text-white/70 text-lg">
              Unlock unlimited music experience
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Features Section */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-2">
              <CheckOutlined className="text-green-400" />
              Premium Features
            </h2>

            <div className="space-y-4">
              {premiumFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg text-purple-300">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 text-sm mb-3">
                        {feature.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 text-sm">
                        <div className="flex items-center gap-2 text-red-400">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span>Free: {feature.currentLimit}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span>Premium: {feature.premiumFeature}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CrownOutlined className="text-yellow-400 text-xl" />
                <span className="text-white/70 text-sm uppercase tracking-wide">
                  Premium Plan
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-white text-4xl font-bold">$5</span>
                <span className="text-white/70 text-lg">/month</span>
              </div>
              <p className="text-white/60 text-sm">
                Cancel anytime • No hidden fees • Instant activation
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-2">
            <CreditCardOutlined className="text-blue-400" />
            Payment Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
              />
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <LockOutlined className="text-blue-400 text-lg mt-0.5" />
              <div>
                <p className="text-blue-300 text-sm font-medium">
                  Secure Payment
                </p>
                <p className="text-blue-300/70 text-xs">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isProcessing ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CrownOutlined />
                  Subscribe for $5/month
                </div>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-white/50 text-xs text-center mt-4">
            By subscribing, you agree to our Terms of Service and Privacy
            Policy. You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Premium;
