// Pages/Admin/AdminComingSoon.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

interface AdminComingSoonProps {
  title: string;
  description?: string;
}

const AdminComingSoon: React.FC<AdminComingSoonProps> = ({
  title,
  description = "Coming soon...",
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/admin");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <button
          onClick={handleBackClick}
          className="absolute top-8 left-8 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
        >
          <ArrowLeftOutlined className="text-white text-xl" />
        </button>

        <div className="w-24 h-24 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-8">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
        <p className="text-white/60 text-lg mb-8">{description}</p>

        <button
          onClick={handleBackClick}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
        >
          Back to Admin Panel
        </button>
      </div>
    </div>
  );
};

// Individual page exports
export const AdminAnalytics = () => (
  <AdminComingSoon
    title="Analytics Dashboard"
    description="Platform statistics and insights coming soon..."
  />
);

export const AdminUsers = () => (
  <AdminComingSoon
    title="User Management"
    description="Manage users and permissions coming soon..."
  />
);

export const AdminContent = () => (
  <AdminComingSoon
    title="Content Management"
    description="Moderate tracks, albums and artists coming soon..."
  />
);

export const AdminReports = () => (
  <AdminComingSoon
    title="Reports"
    description="View and manage user reports coming soon..."
  />
);

export const AdminModeration = () => (
  <AdminComingSoon
    title="Moderation"
    description="Review flagged content and violations coming soon..."
  />
);

export default AdminComingSoon;
