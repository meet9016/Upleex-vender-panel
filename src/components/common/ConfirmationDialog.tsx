import React from "react";
import { MdDelete, MdWarning, MdBlock } from "react-icons/md";

type ActionType = 'delete' | 'deactivate' | 'activate' | 'custom';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  actionType?: ActionType;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const ConfirmationDialog: React.FC<Props> = ({
  open,
  title,
  message,
  actionType = 'delete',
  confirmText,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'delete':
        return {
          title: title || "Confirm Delete",
          message: message || "Are you sure you want to delete this item?",
          icon: <MdDelete className="text-3xl" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          buttonBg: "bg-red-600 hover:bg-red-700",
          confirmText: confirmText || "Delete"
        };
      case 'deactivate':
        return {
          title: title || "Confirm Deactivate",
          message: message || "Are you sure you want to deactivate this item?",
          icon: <MdBlock className="text-3xl" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          buttonBg: "bg-yellow-600 hover:bg-yellow-700",
          confirmText: confirmText || "Deactivate"
        };
      case 'activate':
        return {
          title: title || "Confirm Activate",
          message: message || "Are you sure you want to activate this item?",
          icon: <MdWarning className="text-3xl" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
          buttonBg: "bg-green-600 hover:bg-green-700",
          confirmText: confirmText || "Activate"
        };
      default:
        return {
          title: title || "Confirm Action",
          message: message || "Are you sure you want to proceed?",
          icon: <MdWarning className="text-3xl" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          confirmText: confirmText || "Confirm"
        };
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-[400px] p-6 shadow-2xl transform transition-all animate-scaleIn dark:border-1 dark:border-amber-50">
        <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 ${config.iconBg} rounded-full`}>
          <div className={config.iconColor}>
            {config.icon}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          {config.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {config.message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-lg ${config.buttonBg} text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {actionType === 'delete' && <MdDelete className="text-lg" />}
                {actionType === 'deactivate' && <MdBlock className="text-lg" />}
                {config.confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;