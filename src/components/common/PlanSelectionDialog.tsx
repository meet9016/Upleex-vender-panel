"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/common/Input";
import Label from "@/components/form/Label";

interface PlanSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyPlan: (planType: "basic" | "standard" | "premium" | "custom", months?: number, maxProducts?: number) => void;
}

const PlanSelectionDialog: React.FC<PlanSelectionDialogProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyPlan,
}) => {
  const [customMonths, setCustomMonths] = useState<number>(2);
  const [customMaxProducts, setCustomMaxProducts] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]"></div>
      <div className="fixed inset-0 flex items-center justify-center z-[100000] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Choose Your Plan
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Activate {selectedCount} selected product{selectedCount > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Basic Plan */}
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">Basic Plan</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹39</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/plan</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 2 months duration</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 1 product listing</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ Basic support</p>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onApplyPlan("basic");
                    }} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Choose Basic
                  </Button>
                </div>
              </div>

              {/* Standard Plan */}
              <div className="relative border-2 border-blue-400 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group bg-blue-50/50 dark:bg-blue-900/10">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">POPULAR</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">Standard Plan</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹59</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/plan</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 5 months duration</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 3 product listings</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ Priority support</p>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onApplyPlan("standard");
                    }} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Choose Standard
                  </Button>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-600 mb-2">Premium Plan</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹109</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/plan</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 12 months duration</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ 7 product listings</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">✓ Premium support</p>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onApplyPlan("premium");
                    }} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Choose Premium
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Plan */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Custom Plan
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create your own plan with custom duration and product limits</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Duration (Months)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={customMonths}
                      onChange={(e) => setCustomMonths(parseInt(e.target.value, 10) || 1)}
                      className="w-full"
                      placeholder="1-12 months"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Max Products</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={customMaxProducts}
                      onChange={(e) => setCustomMaxProducts(parseInt(e.target.value, 10) || 1)}
                      className="w-full"
                      placeholder="1-10 products"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onApplyPlan("custom", customMonths, customMaxProducts);
                      }} 
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Apply Custom Plan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlanSelectionDialog;