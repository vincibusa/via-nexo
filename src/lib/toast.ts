/**
 * Toast Helper
 * Wrapper around sonner with consistent styling
 */

import { toast as sonnerToast } from "sonner";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { createElement } from "react";

interface ToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(CheckCircleIcon, {
        className: "w-5 h-5 text-green-600",
      }),
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
        borderRadius: "12px",
      },
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: createElement(AlertCircleIcon, {
        className: "w-5 h-5 text-red-600",
      }),
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "12px",
      },
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: createElement(AlertTriangleIcon, {
        className: "w-5 h-5 text-amber-600",
      }),
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        borderRadius: "12px",
      },
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(InfoIcon, {
        className: "w-5 h-5 text-blue-600",
      }),
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        borderRadius: "12px",
      },
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(156, 163, 175, 0.2)",
        borderRadius: "12px",
      },
    });
  },

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
      duration: options?.duration,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      style: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
      },
    });
  },

  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};
