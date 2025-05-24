import { useNavigate } from "react-router-dom";
import { CustomCheckbox } from "./CustomCheckbox";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SignUpValid, {
  type SignUpErrors,
  type SignUpFormData,
} from "../../validation/SignUpValid";
import { api } from "../../shared/api";

export const SignUpModal: React.FC = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    const errorCheck = SignUpValid(formData);
    setErrors(errorCheck);
  }, [formData]);

  const handleSignUp = async () => {
    if (
      errors.name.length === 0 &&
      errors.email.length === 0 &&
      errors.username.length === 0 &&
      errors.password.length === 0 &&
      errors.check.length === 0
    ) {
      const response = await api.register(
        formData.email,
        formData.password,
        formData.name,
        formData.username
      );
      if (response.ok) {
        navigate("/login");
      }
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f7a6ad]">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative w-[800px] bg-white rounded shadow-lg flex overflow-hidden"
      >
        {/* Левая часть */}
        <div className="flex-1 p-12">
          <h2 className="text-2xl font-semibold text-[#183646] mb-8">
            Sign up
          </h2>
          <form className="space-y-6">
            <div>
              <label
                className="block text-sm text-[#183646] mb-2"
                htmlFor="name"
              >
                First and last name
              </label>
              <input
                type="text"
                id="name"
                className={
                  "w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 " +
                  (errors.name.length > 0
                    ? "focus:ring-[#f7a6ad]"
                    : "focus:ring-[#83F52C]")
                }
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm text-[#183646] mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className={
                  "w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 " +
                  (errors.email.length > 0
                    ? "focus:ring-[#f7a6ad]"
                    : "focus:ring-[#83F52C]")
                }
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm text-[#183646] mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                className={
                  "w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 " +
                  (errors.username.length > 0
                    ? "focus:ring-[#f7a6ad]"
                    : "focus:ring-[#83F52C]")
                }
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm text-[#183646] mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className={
                  "w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 " +
                  (errors.password.length > 0
                    ? "focus:ring-[#f7a6ad]"
                    : "focus:ring-[#83F52C]")
                }
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <div className="text-xs text-gray-400 mt-1">
                Minimum 6 characters, at least one letter
                <br />
                and one number.
              </div>
            </div>
          </form>
        </div>
        {/* Правая часть с розовым фоном и волной */}
        <div className="relative w-[46%] flex flex-col justify-center items-center bg-[#f8919a]">
          {/* SVG Волна */}
          <svg
            className="absolute left-[-60px] top-0 h-full"
            width="100"
            height="100%"
            viewBox="0 0 80 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: "100%", rotate: "180deg", marginLeft: "53px" }}
          >
            <path d="M80 0 Q0 250 80 500 Z" fill="#fff" />
          </svg>
          <div className="relative z-10 flex flex-col items-start pl-10 pt-70">
            <div className="flex items-center mb-4">
              <CustomCheckbox
                onClick={() =>
                  setFormData({ ...formData, check: !formData.check })
                }
              />
              <span className="text-xs text-white">
                Creating an account means you’re okay with <br /> our{" "}
                <a
                  href="#"
                  className="underline text-white/80 hover:text-white"
                >
                  Terms of Service
                </a>{" "}
                and our{" "}
                <a
                  href="#"
                  className="underline text-white/80 hover:text-white"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </div>
            <button
              className={
                "bg-[#22516c] text-[#f8919a] px-6 py-2 rounded shadow-md mt-2 hover:bg-[#183646] transition m-auto " +
                (errors.check.length > 0 ||
                errors.name.length > 0 ||
                errors.email.length > 0 ||
                errors.username.length > 0 ||
                errors.password.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer")
              }
              onClick={handleSignUp}
            >
              Create Account
            </button>
          </div>
          {/* Кнопка закрытия */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 right-4 text-[#183646] text-2xl hover:text-black transition cursor-pointer"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpModal;
