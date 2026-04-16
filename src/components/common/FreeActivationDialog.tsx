"use client";
import React from "react";
import Button from "@/components/ui/button/Button";
import Loader from "@/components/common/Loader";

interface FreeActivationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  loading?: boolean;
  onConfirm: () => void;
}

const FreeActivationDialog: React.FC<FreeActivationDialogProps> = ({
  isOpen,
  onClose,
  products,
  loading = false,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]" />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-[100000] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Activate Free Listing
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  No payment required — activate for 1 month
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {products.length} Free product{products.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {products.map((p) => (
                  <li
                    key={p._id || p.id}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="truncate">{p.product_name || "Unnamed product"}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <div className="flex items-center justify-between">
                <span>Activation period</span>
                <span className="font-semibold text-gray-800 dark:text-white">1 Month</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan cost</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-base">FREE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status after</span>
                <span className="font-semibold text-gray-800 dark:text-white">Active</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 !bg-white border border-gray-300 dark:border-gray-600 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-50 dark:hover:!bg-gray-700 rounded-xl font-medium disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 btn-primary hover:bg-green-700 !text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader type="button" text="Activating..." iconClassName="text-white h-4 w-4" />
              ) : (
                "Activate Now"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FreeActivationDialog;
