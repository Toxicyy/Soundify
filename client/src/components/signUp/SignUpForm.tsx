import { useNavigate } from "react-router-dom";
import { CustomCheckbox } from "./CustomCheckbox";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SignUpValid, {
  type SignUpErrors,
  type SignUpFormData,
} from "../../validation/SignUpValid";
import { api } from "../../shared/api";

/**
 * Desktop registration form with purple redesign
 * Includes validation, API error handling and animations
 *
 * Features:
 * - Purple color scheme with gradients
 * - Real-time form validation
 * - Registration API error handling
 * - Custom checkbox with animations
 * - Smooth animations and hover effects
 * - Password visibility toggle
 */
export const SignUpModal: React.FC = () => {
  const navigate = useNavigate();

  // Состояния формы
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    check: false,
  });

  const [errors, setErrors] = useState<SignUpErrors>({
    name: [],
    email: [],
    username: [],
    password: [],
    check: [],
  });

  const [apiError, setApiError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getErrorMessage = (errorMessage: string, status: number) => {
    // Обработка русских сообщений с бекенда
    if (errorMessage.includes("Пользователь с таким email уже существует")) {
      return "User with this email already exists";
    }
    if (errorMessage.includes("Пользователь с таким username уже существует")) {
      return "User with this username already exists";
    }

    // Обработка по статус кодам
    switch (status) {
      case 409:
        if (errorMessage.toLowerCase().includes("email")) {
          return "User with this email already exists";
        }
        if (errorMessage.toLowerCase().includes("username")) {
          return "User with this username already exists";
        }
        return "User with this email or username already exists";
      case 400:
        return "Invalid data provided. Please check your information";
      case 429:
        return "Too many registration attempts. Please try again later";
      case 500:
        return "Server error. Please try again later";
      default:
        return errorMessage || "Something went wrong. Please try again";
    }
  };

  /**
   * Form validation on data change
   */
  useEffect(() => {
    const errorCheck = SignUpValid(formData);
    setErrors(errorCheck);
  }, [formData, apiError]);

  /**
   * Form submit handler with API error handling
   */
  const handleSignUp = async () => {
    if (isFormValid()) {
      setIsLoading(true);
      setApiError("");

      try {
        const response = await api.auth.register(
          formData.email,
          formData.password,
          formData.name,
          formData.username
        );

        if (response.ok) {
          navigate("/login");
        } else {
          const errorData = await response.json();
          const errorMessage = getErrorMessage(
            errorData.message || errorData.error,
            response.status
          );
          setApiError(errorMessage);
        }
      } catch (error) {
        console.error("Signup error:", error);
        setApiError("Network error. Please check your connection");
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Checks if form is valid
   */
  const isFormValid = () => {
    return (
      errors.name.length === 0 &&
      errors.email.length === 0 &&
      errors.username.length === 0 &&
      errors.password.length === 0 &&
      errors.check.length === 0 &&
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.username.trim() !== "" &&
      formData.password.trim() !== "" &&
      formData.check
    );
  };

  /**
   * Render input field with animations
   */
  const renderInputField = (
    id: keyof SignUpFormData,
    label: string,
    type: string,
    placeholder: string,
    delay: number,
    showHelper: boolean = false
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <label
        className="block text-sm font-medium text-purple-200 mb-2"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={id === "password" && showPassword ? "text" : type}
          id={id}
          className={`w-full px-4 py-3 ${
            id === "password" ? "pr-12" : ""
          } rounded-xl bg-white/10 backdrop-blur-sm border-2 text-white placeholder-purple-200/50 focus:outline-none transition-all duration-300 ${
            errors[id].length > 0
              ? "border-red-400 focus:border-red-300 focus:ring-red-300/20"
              : "border-purple-400/30 focus:border-purple-300 focus:ring-purple-300/20 focus:ring-4"
          }`}
          placeholder={placeholder}
          value={formData[id] as string}
          onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
          disabled={isLoading}
        />
        {id === "password" && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
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
      {errors[id].length > 0 && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-red-300 text-xs mt-1"
        >
          {errors[id][0]}
        </motion.p>
      )}
      {showHelper && (
        <div className="text-xs text-purple-200/50 mt-2">
          Minimum 6 characters, at least one letter and one number
        </div>
      )}
    </motion.div>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", damping: 20 }}
        className="relative w-[900px] bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex overflow-hidden"
      >
        {/* Левая часть - Форма */}
        <div className="flex-1 p-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Join Soundify
            </h2>
            <p className="text-purple-200/70 mb-6">
              Create your account and start your musical journey
            </p>
          </motion.div>

          <form className="space-y-4">
            {/* API Error Display */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-red-300 text-sm font-medium">{apiError}</p>
                </div>
              </motion.div>
            )}

            {/* Form Fields */}
            {renderInputField(
              "name",
              "Full Name",
              "text",
              "Enter your full name",
              0.4
            )}
            {renderInputField(
              "email",
              "Email",
              "email",
              "Enter your email address",
              0.5
            )}
            {renderInputField(
              "username",
              "Username",
              "text",
              "Choose a username",
              0.6
            )}
            {renderInputField(
              "password",
              "Password",
              "password",
              "Create a strong password",
              0.7,
              true
            )}
          </form>
        </div>

        {/* Правая часть - Декоративная секция с чекбоксом и кнопкой */}
        <div className="relative w-[46%] flex flex-col justify-center items-center bg-gradient-to-br from-purple-600/30 to-violet-700/30 backdrop-blur-sm">
          <motion.div
            className="relative z-10 flex flex-col items-start pl-8 pr-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {/* Terms Checkbox */}
            <div className="flex items-start mb-6">
              <CustomCheckbox
                checked={formData.check}
                onChange={() =>
                  setFormData({ ...formData, check: !formData.check })
                }
                disabled={isLoading}
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-purple-200 hover:text-white font-medium transition-colors duration-200 underline decoration-purple-400/50 hover:decoration-white"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-purple-200 hover:text-white font-medium transition-colors duration-200 underline decoration-purple-400/50 hover:decoration-white"
                >
                  Privacy Policy
                </a>
              </CustomCheckbox>
            </div>
            {errors.check.length > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-300 text-xs mb-4 -mt-4"
              >
                {errors.check[0]}
              </motion.p>
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSignUp}
              disabled={!isFormValid() || isLoading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                isFormValid() && !isLoading
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  : "bg-gray-600/50 cursor-not-allowed opacity-50"
              }`}
              whileHover={isFormValid() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={isFormValid() && !isLoading ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
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

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-center w-full mt-4"
            >
              <p className="text-purple-200/70 text-xs">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-purple-300 hover:text-white font-medium transition-colors duration-200 underline decoration-purple-400/50 hover:decoration-white"
                  disabled={isLoading}
                >
                  Sign in here
                </button>
              </p>
            </motion.div>
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center group disabled:opacity-50"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpModal;
