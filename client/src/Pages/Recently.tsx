import { motion } from 'framer-motion';
import { ClockCircleOutlined, HeartOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';

/**
 * Recently Played - Coming Soon Page
 * 
 * Features:
 * - Beautiful gradient background matching app theme
 * - Animated loading spinner with music notes
 * - Smooth entrance animations
 * - Responsive design
 * - Coming soon message with feature hints
 * - Floating music elements
 */

export default function Recently() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Floating background elements - LOWERED Z-INDEX */}
      <div className="inset-0">
        {/* Animated circles */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-48 h-48 bg-pink-500/10 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Floating music notes - LOWERED Z-INDEX */}
      <div className="absolute inset-0 pointer-events-none -z-5">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -60, -20],
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            <SoundOutlined style={{ fontSize: '24px' }} />
          </motion.div>
        ))}
      </div>

      {/* Main content with responsive padding - FIXED Z-INDEX */}
      <div className="z-0 px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] py-8 pb-36 xl:pb-8 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto">
          {/* Main loading spinner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* Inner rotating ring */}
              <motion.div
                className="absolute inset-4 rounded-full border-2 border-pink-500/30 border-r-pink-500"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* Center icon */}
              <motion.div
                className="relative z-10"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ClockCircleOutlined 
                  style={{ 
                    color: 'white', 
                    fontSize: '48px',
                    filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))'
                  }} 
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent pb-4">
              Coming Soon
            </h1>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white/80 mb-2">
              Recently Played
            </h2>
            <p className="text-lg text-white/60">
              Your music history is being prepared...
            </p>
          </motion.div>

          {/* Feature preview cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
          >
            {/* Recent Tracks */}
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="mb-4">
                <PlayCircleOutlined 
                  style={{ 
                    color: '#8b5cf6', 
                    fontSize: '32px' 
                  }} 
                />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Recent Tracks</h3>
              <p className="text-white/60 text-sm">
                Quick access to your recently played songs
              </p>
            </motion.div>

            {/* Listening History */}
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="mb-4">
                <ClockCircleOutlined 
                  style={{ 
                    color: '#ec4899', 
                    fontSize: '32px' 
                  }} 
                />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">History</h3>
              <p className="text-white/60 text-sm">
                Complete timeline of your music journey
              </p>
            </motion.div>

            {/* Favorites */}
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="mb-4">
                <HeartOutlined 
                  style={{ 
                    color: '#ef4444', 
                    fontSize: '32px' 
                  }} 
                />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Favorites</h3>
              <p className="text-white/60 text-sm">
                Easy access to your most loved tracks
              </p>
            </motion.div>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-8"
          >
            <div className="bg-white/10 rounded-full h-2 w-full max-w-md mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 2, delay: 1, ease: "easeOut" }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-white/50 text-sm mt-3"
            >
              75% Complete
            </motion.p>
          </motion.div>

          {/* Status message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <p className="text-white/70 text-lg mb-2">
              We're working hard to bring you this feature
            </p>
            <p className="text-white/50 text-sm">
              Stay tuned for updates! Your recently played tracks will be available soon.
            </p>
          </motion.div>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex justify-center space-x-2 mt-8"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-purple-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient overlay - LOWERED Z-INDEX */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none -z-5" />
    </div>
  );
}