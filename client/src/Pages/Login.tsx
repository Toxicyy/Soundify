import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/login/LoginForm";
import { MobileAuthForm } from "../components/login/MobileAuthForm.tsx";
import { useGetUserQuery, userApiSlice } from "../state/UserApi.slice.ts";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store.ts";
import { motion } from "framer-motion";

/**
 * Responsive login page
 * Desktop (xl+): Classic design with wave
 * Mobile (<xl): Modern card-based design with animations
 */
export default function Login() {
  const { data: user } = useGetUserQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  function logOut() {
    localStorage.removeItem("token");
    dispatch(userApiSlice.util.resetApiState());
    window.location.reload();
  }
  return (
    <>
      {/* Desktop version (xl and above) */}
      {!user && (
        <div className="hidden xl:block">
          <LoginForm />
        </div>
      )}

      {/* Mobile version (less than xl) */}
      {!user && (
        <div className="block xl:hidden">
          <MobileAuthForm initialMode="login" />
        </div>
      )}

      {user && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-[800px] bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-12 text-center"
          >
            {/* Animated Background Elements */}
            <motion.div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                }}
              />
            </motion.div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-400/30">
                  <svg
                    className="w-12 h-12 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {user.username}!
                </h2>
                <p className="text-purple-200/70">
                  You're already logged in to your Soundify account
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <motion.button
                  onClick={() => navigate("/")}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Home
                </motion.button>

                <motion.button
                  onClick={logOut}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-transparent border border-purple-400/30 hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Out
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}