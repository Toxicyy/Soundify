import { motion, AnimatePresence } from "framer-motion";
import {
  CrownOutlined,
  SettingOutlined,
  UserAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { userApiSlice } from "../../../../state/UserApi.slice";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "../../../../store";
import { useNavigate } from "react-router-dom";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  className = "",
}) => (
  <motion.div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:backgrop-blur-md hover:bg-white/10 hover:scale-[1.02] ${className}`}
    onClick={onClick}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="text-lg">{icon}</div>
    <span className="text-white font-medium tracking-wide">{label}</span>
  </motion.div>
);

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const menuItems = [
    {
      icon: <CrownOutlined style={{ color: "#FFD700" }} />,
      label: "Upgrade to Premium",
      onClick: () => {
        console.log("Upgrade to Premium clicked");
        onClose();
      },
      className:
        "hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-amber-500/20",
    },
    {
      icon: <SettingOutlined style={{ color: "#8B5CF6" }} />,
      label: "Settings",
      onClick: () => {
        console.log("Settings clicked");
        onClose();
      },
      className:
        "hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-violet-500/20",
    },
    {
      icon: <UserAddOutlined style={{ color: "#10B981" }} />,
      label: "Become an artist",
      onClick: () => {
        navigate("/become-an-artist");
        onClose();
      },
      className:
        "hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-green-500/20",
    },
    {
      icon: <LogoutOutlined style={{ color: "#EF4444" }} />,
      label: "Log Out",
      onClick: () => {
        logOut();
        onClose();
      },
      className:
        "hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 border-t border-white/10 mt-2 pt-4",
    },
  ];
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  function logOut() {
    localStorage.removeItem("token");
    dispatch(userApiSlice.util.resetApiState());
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            className="absolute top-full right-0 mt-2 w-64 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.2,
            }}
          >
            {/* Liquid Glass Container */}
            <div className="relative">
              {/* Animated Glass Background */}
              <motion.div
                className="absolute inset-0 rounded-2xl border shadow-2xl"
                initial={{
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(255, 255, 255, 0)",
                  backdropFilter: "blur(3px)",
                }}
                animate={{
                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(5px)",
                }}
                exit={{
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(255, 255, 255, 0)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />

              {/* Liquid Glass Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0) 100%)",
                }}
                animate={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(0, 0, 0, 0.1) 100%)",
                }}
                exit={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0) 100%)",
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />

              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                  }}
                />
              </motion.div>

              {/* Menu Content */}
              <div className="relative p-3">
                {/* Header */}
                <div className="px-4 py-2 mb-2">
                  <h3 className="text-white/80 text-sm font-semibold tracking-wider uppercase">
                    Account Menu
                  </h3>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MenuItem {...item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
