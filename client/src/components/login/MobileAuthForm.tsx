import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LoginValid, {
  type LoginErrors,
  type LoginFormData,
} from "../../validation/LoginValid";
import SignUpValid, {
  type SignUpErrors,
  type SignUpFormData,
} from "../../validation/SignUpValid";
import { api } from "../../shared/api";

/**
 * Props for mobile authentication form
 */
interface MobileAuthFormProps {
  /** Initial form mode */
  initialMode: "login" | "signup";
}

/**
 * Mobile authentication form with toggle between login and signup
 * Card-based design with modern animations and micro-interactions
 *
 * Features:
 * - Toggle between login and registration forms
 * - Card-based design with glassmorphism
 * - Swipe gestures for form switching
 * - Animated transitions and micro-interactions
 * - Real-time validation
 * - API error handling
 * - Responsive design for mobile devices
 * - Password visibility toggle
 */
export const MobileAuthForm: React.FC<MobileAuthFormProps> = ({
  initialMode,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({
    username: [],
    password: [],
  });

  // Signup form state
  const [signupData, setSignupData] = useState<SignUpFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    check: false,
  });
  const [signupErrors, setSignupErrors] = useState<SignUpErrors>({
    name: [],
    email: [],
    username: [],
    password: [],
    check: [],
  });

  /**
   * Form validation on data change
   */
  useEffect(() => {
    if (mode === "login") {
      setLoginErrors(LoginValid(loginData));
    } else {
      setSignupErrors(SignUpValid(signupData));
    }
    if (apiError) setApiError("");
  }, [loginData, signupData, mode, apiError]);

  /**
   * Handle login
   */
  const handleLogin = async () => {
    if (
      loginErrors.username.length === 0 &&
      loginErrors.password.length === 0
    ) {
      setIsLoading(true);
      setApiError("");

      try {
        const response = await api.auth.login(
          loginData.username,
          loginData.password
        );

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.data.tokenInfo.token);
          navigate("/");
        } else {
          const errorData = await response.json();
          switch (response.status) {
            case 401:
              setApiError("Invalid username or password");
              break;
            case 404:
              setApiError("User not found");
              break;
            case 429:
              setApiError("Too many attempts. Try again later");
              break;
            default:
              setApiError(errorData.message || "Something went wrong");
          }
        }
      } catch (error) {
        setApiError("Network error. Check your connection");
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle signup
   */
  const handleSignup = async () => {
    if (isSignupFormValid()) {
      setIsLoading(true);
      setApiError("");

      try {
        const response = await api.auth.register(
          signupData.email,
          signupData.password,
          signupData.name,
          signupData.username
        );

        if (response.ok) {
          setMode("login");
          setApiError("");
        } else {
          const errorData = await response.json();
          switch (response.status) {
            case 409:
              setApiError("User with this email or username already exists");
              break;
            case 400:
              setApiError("Invalid data provided");
              break;
            case 429:
              setApiError("Too many registration attempts. Try again later");
              break;
            default:
              setApiError(errorData.message || "Something went wrong");
          }
        }
      } catch (error) {
        setApiError("Network error. Check your connection");
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Checks if login form is valid
   */
  const isLoginFormValid = () => {
    return (
      loginErrors.username.length === 0 &&
      loginErrors.password.length === 0 &&
      loginData.username.trim() !== "" &&
      loginData.password.trim() !== ""
    );
  };

  /**
   * Checks if signup form is valid
   */
  const isSignupFormValid = () => {
    return (
      signupErrors.name.length === 0 &&
      signupErrors.email.length === 0 &&
      signupErrors.username.length === 0 &&
      signupErrors.password.length === 0 &&
      signupErrors.check.length === 0 &&
      signupData.name.trim() !== "" &&
      signupData.email.trim() !== "" &&
      signupData.username.trim() !== "" &&
      signupData.password.trim() !== "" &&
      signupData.check
    );
  };

  /**
   * Render mobile input field
   */
  const renderMobileInput = (
    id: string,
    label: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    errors: string[],
    delay: number,
    isPassword: boolean = false
  ) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-2"
    >
      <label className="block text-sm font-medium text-purple-200" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <motion.input
          type={isPassword && showPassword ? "text" : type}
          id={id}
          className={`w-full px-4 py-3 ${
            isPassword ? "pr-12" : ""
          } rounded-2xl bg-white/10 backdrop-blur-sm border-2 text-white placeholder-purple-200/50 focus:outline-none transition-all duration-300 ${
            errors.length > 0
              ? "border-red-400 focus:border-red-300"
              : "border-purple-400/30 focus:border-purple-300"
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          whileFocus={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        />
        {isPassword && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </motion.button>
        )}
      </div>
      {errors.length > 0 && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-red-300 text-xs"
        >
          {errors[0]}
        </motion.p>
      )}
    </motion.div>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)",
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 pt-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </motion.button>

        <motion.h1
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Soundify
        </motion.h1>

        <div className="w-10"></div>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        className="mx-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
          <motion.button
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
              mode === "login"
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
                : "text-purple-200"
            }`}
            onClick={() => setMode("login")}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
          <motion.button
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
              mode === "signup"
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
                : "text-purple-200"
            }`}
            onClick={() => setMode("signup")}
            whileTap={{ scale: 0.98 }}
          >
            Sign Up
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-purple-200/70">
                  Sign in to continue your music journey
                </p>
              </motion.div>

              {/* API Error */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-500/20 border border-red-500/30 rounded-2xl p-3 mb-4"
                >
                  <p className="text-red-300 text-sm text-center">{apiError}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {renderMobileInput(
                  "login-username",
                  "Email or Username",
                  "text",
                  "Enter your email or username",
                  loginData.username,
                  (value) => setLoginData({ ...loginData, username: value }),
                  loginErrors.username,
                  0.2,
                  false
                )}

                {renderMobileInput(
                  "login-password",
                  "Password",
                  "password",
                  "Enter your password",
                  loginData.password,
                  (value) => setLoginData({ ...loginData, password: value }),
                  loginErrors.password,
                  0.3,
                  true
                )}

                <motion.button
                  onClick={handleLogin}
                  disabled={!isLoginFormValid() || isLoading}
                  className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 mt-6 ${
                    isLoginFormValid() && !isLoading
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg"
                      : "bg-gray-600/50 cursor-not-allowed opacity-50"
                  }`}
                  whileHover={isLoginFormValid() ? { scale: 1.02 } : {}}
                  whileTap={isLoginFormValid() ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Join Soundify
                </h2>
                <p className="text-purple-200/70">
                  Create your account and start your musical journey
                </p>
              </motion.div>

              {/* API Error */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-500/20 border border-red-500/30 rounded-2xl p-3 mb-4"
                >
                  <p className="text-red-300 text-sm text-center">{apiError}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {renderMobileInput(
                  "signup-name",
                  "Full Name",
                  "text",
                  "Enter your full name",
                  signupData.name,
                  (value) => setSignupData({ ...signupData, name: value }),
                  signupErrors.name,
                  0.2,
                  false
                )}

                {renderMobileInput(
                  "signup-email",
                  "Email",
                  "email",
                  "Enter your email address",
                  signupData.email,
                  (value) => setSignupData({ ...signupData, email: value }),
                  signupErrors.email,
                  0.3,
                  false
                )}

                {renderMobileInput(
                  "signup-username",
                  "Username",
                  "text",
                  "Choose a username",
                  signupData.username,
                  (value) => setSignupData({ ...signupData, username: value }),
                  signupErrors.username,
                  0.4,
                  false
                )}

                {renderMobileInput(
                  "signup-password",
                  "Password",
                  "password",
                  "Create a strong password",
                  signupData.password,
                  (value) => setSignupData({ ...signupData, password: value }),
                  signupErrors.password,
                  0.5,
                  true
                )}

                {/* Terms Checkbox */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex items-start gap-3 mt-4"
                >
                  <motion.button
                    onClick={() =>
                      setSignupData({ ...signupData, check: !signupData.check })
                    }
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-0.5 ${
                      signupData.check
                        ? "bg-gradient-to-br from-purple-500 to-violet-600 border-purple-400"
                        : "bg-white/10 border-purple-400/50"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {signupData.check && (
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 16 16"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 8l3 3 5-5"
                        />
                      </motion.svg>
                    )}
                  </motion.button>
                  <div className="text-xs text-purple-100/80 leading-relaxed">
                    I agree to the{" "}
                    <button className="text-purple-300 underline">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button className="text-purple-300 underline">
                      Privacy Policy
                    </button>
                  </div>
                </motion.div>

                {signupErrors.check.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-red-300 text-xs"
                  >
                    {signupErrors.check[0]}
                  </motion.p>
                )}

                <motion.button
                  onClick={handleSignup}
                  disabled={!isSignupFormValid() || isLoading}
                  className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 mt-6 ${
                    isSignupFormValid() && !isLoading
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg"
                      : "bg-gray-600/50 cursor-not-allowed opacity-50"
                  }`}
                  whileHover={isSignupFormValid() ? { scale: 1.02 } : {}}
                  whileTap={isSignupFormValid() ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer spacing */}
      <div className="h-8"></div>
    </div>
  );
};
