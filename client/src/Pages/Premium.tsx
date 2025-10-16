import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import { motion, AnimatePresence } from "framer-motion";
import {
  CrownOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  CreditCardOutlined,
  LockOutlined,
  ForwardOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

/**
 * Premium upgrade page
 * Features: subscription form, payment processing, animated UI
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

  const premiumFeatures = useMemo(
    () => [
      {
        icon: <PlayCircleOutlined className="text-2xl" />,
        title: "Unlimited Navigation",
        description: "Navigate through tracks without any restrictions",
        currentLimit: "Limited skips",
        premiumFeature: "Unlimited skips",
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
    ],
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === "cardNumber") {
        const formattedValue = value
          .replace(/\s/g, "")
          .replace(/(\d{4})/g, "$1 ")
          .trim();
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
        return;
      }

      if (name === "expiryDate") {
        const formattedValue = value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d)/, "$1/$2");
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
        return;
      }

      if (name === "cvv") {
        const formattedValue = value.replace(/\D/g, "").substr(0, 3);
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

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
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const success = Math.random() > 0.3;

        dismiss(loadingToast);

        if (success) {
          showSuccess("Welcome to Premium! Your subscription is now active.");
          setFormData({
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            cardholderName: "",
            email: "",
          });
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
    },
    [formData, showError, showLoading, showSuccess, dismiss, navigate]
  );

  return (
    <motion.main
      className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-8 mb-45 xl:mb-8 py-8 overflow-x-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Go back to home"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeftOutlined className="text-white text-xl" />
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl border border-purple-500/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              type: "spring",
              bounce: 0.6,
            }}
          >
            <CrownOutlined className="text-2xl" style={{ color: "yellow" }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-white text-3xl font-bold">
              Upgrade to Premium
            </h1>
            <p className="text-white/70 text-lg">
              Unlock unlimited music experience
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="grid lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.h2
              className="text-white text-2xl font-semibold mb-6 flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <CheckOutlined className="text-green-400" />
              Premium Features
            </motion.h2>

            <div className="space-y-4">
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg text-purple-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 text-sm mb-3">
                        {feature.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 text-sm">
                        <motion.div
                          className="flex items-center gap-2 text-red-400"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                        >
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span>Free: {feature.currentLimit}</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-2 text-green-400"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay: 1.1 + index * 0.1,
                          }}
                        >
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span>Premium: {feature.premiumFeature}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)",
            }}
          >
            <div className="text-center">
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <CrownOutlined
                    className="text-xl"
                    style={{ color: "yellow" }}
                  />
                </motion.div>
                <span className="text-white/70 text-sm uppercase tracking-wide">
                  Premium Plan
                </span>
              </motion.div>
              <motion.div
                className="flex items-center justify-center gap-1 mb-4"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 1.4,
                  type: "spring",
                  bounce: 0.6,
                }}
              >
                <span className="text-white text-4xl font-bold">$5</span>
                <span className="text-white/70 text-lg">/month</span>
              </motion.div>
              <motion.p
                className="text-white/60 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                Cancel anytime • No hidden fees • Instant activation
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.h2
            className="text-white text-2xl font-semibold mb-6 flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <CreditCardOutlined className="text-blue-400" />
            Payment Details
          </motion.h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <motion.input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <label className="block text-white/80 text-sm font-medium mb-2">
                Card Number
              </label>
              <motion.input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <motion.input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  required
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  CVV
                </label>
                <motion.input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  required
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <label className="block text-white/80 text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <motion.input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <motion.div
              className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <LockOutlined className="text-blue-400 text-lg mt-0.5" />
              </motion.div>
              <div>
                <p className="text-blue-300 text-sm font-medium">
                  Secure Payment
                </p>
                <p className="text-blue-300/70 text-xs">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isProcessing ? "cursor-not-allowed opacity-50" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              whileHover={{
                scale: isProcessing ? 1 : 1.05,
                boxShadow: "0 10px 30px rgba(139, 92, 246, 0.5)",
              }}
              whileTap={{ scale: isProcessing ? 1 : 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Processing...
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    key="subscribe"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CrownOutlined className="mb-0.5" />
                    Subscribe for $5/month
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <motion.p
            className="text-white/50 text-xs text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            By subscribing, you agree to our Terms of Service and Privacy
            Policy. You can cancel your subscription at any time.
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.main>
  );
};

export default Premium;
