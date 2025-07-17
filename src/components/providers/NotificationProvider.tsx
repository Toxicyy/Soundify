import { type FC, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Global notification provider using react-hot-toast
 * Provides toast notifications with glassmorphism design
 */
export const NotificationProvider: FC<NotificationProviderProps> = ({
  children,
}) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "#ffffff",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            fontSize: "14px",
            fontWeight: "500",
            padding: "16px",
            maxWidth: "400px",
          },
          // Custom styles for different types
          success: {
            style: {
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            },
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },
          error: {
            style: {
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
          loading: {
            style: {
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            },
            iconTheme: {
              primary: "#3b82f6",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </>
  );
};
