import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * 404 Not Found Page - Purple gradient with glass morphism effects
 */

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const NotFound404 = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>(
    []
  );

  // Generate random floating elements
  useEffect(() => {
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 60 + 20,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setFloatingElements(elements);
  }, []);

  // Track mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Navigation handlers
  const goHome = () => navigate("/");
  const goBack = () => navigate(-1);

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)",
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute rounded-full opacity-10"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              background: "linear-gradient(45deg, #a855f7, #ec4899, #06b6d4)",
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Particle Effects */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Number with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div
              className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl"
              style={{
                transform: `translate(${(mousePosition.x - 50) * 0.05}px, ${
                  (mousePosition.y - 50) * 0.05
                }px)`,
              }}
            >
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 leading-none">
                404
              </h1>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Oops! Page Not Found
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-purple-200 leading-relaxed">
                The page you're looking for seems to have drifted into the
                digital void. Don't worry though, we'll help you find your way
                back to the music!
              </p>
            </div>
          </motion.div>

          {/* Floating Musical Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {["🎵", "🎶", "🎤", "🎧", "🎸"].map((emoji, index) => (
              <motion.div
                key={index}
                className="absolute text-2xl sm:text-3xl opacity-20"
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + (index % 2) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3 + index,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              onClick={goHome}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </span>
            </motion.button>

            <motion.button
              onClick={goBack}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md border border-purple-400/30 hover:from-purple-600/80 hover:to-pink-600/80 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Go Back
              </span>
            </motion.button>
          </motion.div>

          {/* Additional Help Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">
                Need help finding something?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <motion.button
                  onClick={() => navigate("/search")}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-purple-100 py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Discover Music
                </motion.button>
                <motion.button
                  onClick={() => navigate("/artists")}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-purple-100 py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Browse Artists
                </motion.button>
                <motion.button
                  onClick={() => navigate("/playlists")}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-purple-100 py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Playlists
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Animated Wave Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
            <svg
              className="absolute bottom-0 w-full h-24"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
                fill="rgba(139, 92, 246, 0.1)"
                animate={{
                  d: [
                    "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z",
                    "M0,80 C300,40 900,100 1200,80 L1200,120 L0,120 Z",
                    "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound404;
