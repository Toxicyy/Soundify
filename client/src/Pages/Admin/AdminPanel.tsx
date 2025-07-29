import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SettingOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  FlagOutlined,
  SoundOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const AdminPanel = () => {
  const navigate = useNavigate();

  const adminActions = [
    {
      id: "create-playlist",
      title: "Platform Playlists",
      description: "Create and manage platform playlists",
      icon: <PlusCircleOutlined className="text-3xl" />,
      color: "from-emerald-500 to-teal-600",
      path: "/admin/playlists",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "View platform statistics and insights",
      icon: <BarChartOutlined className="text-3xl" />,
      color: "from-blue-500 to-indigo-600",
      path: "/admin/analytics",
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage users and permissions",
      icon: <TeamOutlined className="text-3xl" />,
      color: "from-purple-500 to-violet-600",
      path: "/admin/users",
    },
    {
      id: "content",
      title: "Content Management",
      description: "Moderate tracks, albums and artists",
      icon: <SoundOutlined className="text-3xl" />,
      color: "from-orange-500 to-red-600",
      path: "/admin/content",
    },
    {
      id: "reports",
      title: "Reports",
      description: "View and manage user reports",
      icon: <FileTextOutlined className="text-3xl" />,
      color: "from-pink-500 to-rose-600",
      path: "/admin/reports",
    },
    {
      id: "moderation",
      title: "Moderation",
      description: "Review flagged content and violations",
      icon: <FlagOutlined className="text-3xl" />,
      color: "from-yellow-500 to-amber-600",
      path: "/admin/moderation",
    },
  ];

  const handleActionClick = (action: typeof adminActions[0]) => {
    navigate(action.path);
  };

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftOutlined className="text-white text-xl" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Admin Panel
              </h1>
              <p className="text-white/70 text-lg mt-1">
                Manage your music platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <SettingOutlined className="text-white text-xl" />
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <UserOutlined className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action, index) => (
            <motion.div
              key={action.id}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                style={{
                  background: `linear-gradient(135deg, ${action.color.split(' ')[1]} 0%, ${action.color.split(' ')[3]} 100%)`
                }}
              />
              
              <div
                onClick={() => handleActionClick(action)}
                className="relative p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 cursor-pointer group-hover:scale-105 group-hover:border-white/30"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${action.color} mb-6`}>
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {action.title}
                </h3>
                
                <p className="text-white/60 leading-relaxed">
                  {action.description}
                </p>
                
                <div className="mt-6 flex items-center text-white/40 group-hover:text-white/60 transition-colors">
                  <span className="text-sm font-medium">Manage</span>
                  <svg 
                    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {[
            { label: "Total Users", value: "12,456", change: "+5.2%" },
            { label: "Active Artists", value: "3,891", change: "+12%" },
            { label: "Platform Playlists", value: "142", change: "+3%" },
            { label: "Monthly Streams", value: "2.4M", change: "+18%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">{stat.label}</span>
                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;