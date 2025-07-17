import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginErrors, LoginFormData } from "../../validation/LoginValid";
import LoginValid from "../../validation/LoginValid";
import { api } from "../../shared/api";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({
    username: [],
    password: [],
  });

  useEffect(() => {
    const errorCheck = LoginValid(formData);
    setErrors(errorCheck);
  }, [formData]);

  const handleLogin = async (e : React.FormEvent) => {
    e.preventDefault();
    if (errors.username.length === 0 && errors.password.length === 0) {
      const response = await api.auth.login(formData.username, formData.password);
      if (response.ok) {
        localStorage.setItem("token", (await response.json()).data.tokenInfo.token);
        navigate("/");
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
        <div className="flex-1 p-12 h-[500px]">
          <h2 className="text-2xl font-semibold text-[#183646] mb-8">
            Sign in
          </h2>
          <form className="space-y-6">
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
                className="w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f7a6ad]"
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
                className="w-full px-3 py-2 rounded bg-[#f7f7f7] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f7a6ad]"
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
            <button
              className={
                "border-3 tracking-widest border-[#22516c] text-[#22516c] px-6 py-2 rounded-full shadow-md mt-14 transition hover:bg-[#22516c] hover:text-[#f8919a] duration-300 cursor-pointer m-auto w-[130px] " +
                (errors.username.length > 0 || errors.password.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer")
              }
              onClick={(e) => handleLogin(e)}
            >
              Sign in
            </button>
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
            style={{ height: "100%", rotate: "180deg", marginLeft: "50px" }}
          >
            <path d="M80 0 Q0 250 80 500 Z" fill="#fff" />
          </svg>
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

export default LoginForm;
