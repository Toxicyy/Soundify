import toast from "react-hot-toast";

interface CustomNotificationOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

/**
 * Hook for managing notifications throughout the application
 * Provides methods for success, error, loading, and custom notifications
 */
export const useNotification = () => {
  /**
   * Show success notification
   */
  const showSuccess = (
    message: string,
    options?: CustomNotificationOptions
  ) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position,
    });
  };

  /**
   * Show error notification
   */
  const showError = (message: string, options?: CustomNotificationOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000, // Error messages stay longer
      position: options?.position,
    });
  };

  /**
   * Show loading notification
   */
  const showLoading = (
    message: string,
    options?: CustomNotificationOptions
  ) => {
    return toast.loading(message, {
      duration: options?.duration || Infinity, // Loading stays until dismissed
      position: options?.position,
    });
  };

  /**
   * Show info notification (custom styled)
   */
  const showInfo = (message: string, options?: CustomNotificationOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position,
      icon: "ℹ️",
      style: {
        background: "rgba(59, 130, 246, 0.1)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      },
    });
  };

  /**
   * Show warning notification (custom styled)
   */
  const showWarning = (
    message: string,
    options?: CustomNotificationOptions
  ) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position,
      icon: "⚠️",
      style: {
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      },
    });
  };

  /**
   * Show playlist limit error with custom styling
   */
  const showPlaylistLimitError = (currentCount: number, limit: number) => {
    const isUserStatus = limit === 5;

    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-red-500/10 backdrop-blur-lg border border-red-500/30 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-red-500/20`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">
                  Лимит плейлистов превышен
                </p>
                <p className="mt-1 text-sm text-white/80">
                  У вас уже {currentCount} из {limit} возможных плейлистов
                </p>
                {isUserStatus ? (
                  <p className="mt-1 text-xs text-white/60">
                    Удалите ненужные плейлисты или обновитесь до Premium для
                    увеличения лимита до 15 плейлистов
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/60">
                    Удалите ненужные плейлисты для создания новых
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex border-l border-red-500/20">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000, // Увеличиваем время показа для важного сообщения
      }
    );
  };

  /**
   * Dismiss specific notification by ID
   */
  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  /**
   * Dismiss all notifications
   */
  const dismissAll = () => {
    toast.dismiss();
  };

  /**
   * Custom notification with full control
   */
  const showCustom = (
    component: React.ReactElement,
    options?: CustomNotificationOptions
  ) => {
    return toast.custom(component, {
      duration: options?.duration || 4000,
      position: options?.position,
    });
  };

  /**
   * Promise-based notification (useful for async operations)
   */
  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: CustomNotificationOptions
  ) => {
    return toast.promise(promise, messages, {
      position: options?.position,
      success: {
        duration: options?.duration || 4000,
      },
      error: {
        duration: options?.duration || 5000,
      },
    });
  };

  return {
    showSuccess,
    showError,
    showLoading,
    showInfo,
    showWarning,
    showPlaylistLimitError,
    showCustom,
    showPromise,
    dismiss,
    dismissAll,
  };
};
