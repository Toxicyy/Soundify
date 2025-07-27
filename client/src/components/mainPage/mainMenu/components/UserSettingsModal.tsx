import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGetUserQuery } from "../../../../state/UserApi.slice";
import { api } from "../../../../shared/api";
import { message } from "antd";
import defaultImage from "../../../../images/User/Anonym.jpg"

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  username: string;
  email: string;
  avatar: File | null;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
}: UserSettingsModalProps) {
  const { data: user, refetch } = useGetUserQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    avatar: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        avatar: null,
      });
    }
  }, [user]);

  // Handle form field changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle password field changes
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle avatar upload
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        message.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error("File size must be less than 5MB");
        return;
      }

      setFormData((prev) => ({ ...prev, avatar: file }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  // Handle profile update using regular fetch
  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const profileFormData = new FormData();

      // Add text fields
      profileFormData.append("name", formData.name);
      profileFormData.append("username", formData.username);
      profileFormData.append("email", formData.email);

      // Add avatar if selected
      if (formData.avatar) {
        profileFormData.append("avatar", formData.avatar);
      }

      const response = await api.user.updateProfile(user._id, profileFormData);

      if (response.ok) {
        await response.json();
        message.success("Profile updated successfully");

        // Refetch user data to update cache
        await refetch();

        // Reset form and close modal
        setAvatarPreview(null);
        setFormData((prev) => ({ ...prev, avatar: null }));
        onClose();
      } else {
        const error = await response.json();
        message.error(error.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      message.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle password change using regular fetch
  const handlePasswordUpdate = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      message.error("Password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (response.ok) {
        message.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        message.error(error.message || "Failed to update password");
      }
    } catch (error: any) {
      console.error("Password update error:", error);
      message.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setAvatarPreview(null);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        avatar: null,
      });
    }
    onClose();
  };

  if (!user) return null;

  const isLoading = isUpdatingProfile || isChangingPassword;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="queue-scroll">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl">
              {/* Glass Background */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-2xl" />

              {/* Content */}
              <div className="relative p-6 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    User Settings
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full w-10 hover:bg-white/10 transition-colors"
                  >
                    <CloseOutlined className="text-xl" style={{ color: "white" }}/>
                  </button>
                </div>

                {/* Profile Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <UserOutlined /> Profile Information
                  </h3>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
                        <img
                          src={
                            avatarPreview ||
                            user.avatar ||
                            defaultImage
                          }
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-2 bg-purple-500 rounded-full w-10 h-10 hover:bg-purple-600 transition-colors"
                        disabled={isLoading}
                      >
                        <CameraOutlined className="text-white text-sm" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-white/60 text-sm">
                        Click camera to change avatar
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      <MailOutlined className="mr-2" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                      placeholder="Enter your email"
                    />
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <SaveOutlined />
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </div>

                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <LockOutlined /> Change Password
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "currentPassword",
                            e.target.value
                          )
                        }
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordUpdate}
                    disabled={
                      isLoading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword
                    }
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LockOutlined />
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
