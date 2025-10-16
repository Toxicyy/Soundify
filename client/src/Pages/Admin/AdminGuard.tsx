// Route guard component for admin-only pages
import React from "react";
import { FlagOutlined } from "@ant-design/icons";
import { useGetUserQuery } from "../../state/UserApi.slice";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { data: user, isLoading } = useGetUserQuery();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || user.status !== "ADMIN") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <FlagOutlined className="text-4xl text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60">
            You don't have permission to access this area
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
