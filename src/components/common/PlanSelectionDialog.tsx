"use client";
import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/common/Input";
import Label from "@/components/form/Label";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { CiWarning } from "react-icons/ci";
import { IoMdStar } from "react-icons/io";

interface PlanSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyPlan: (
    planType: "basic" | "standard" | "premium" | "custom",
    months?: number,
    maxProducts?: number,
    planId?: string
  ) => void;
  selectedProducts: any[];
}

const PlanSelectionDialog: React.FC<PlanSelectionDialogProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyPlan,
  selectedProducts,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<any>(null);
  const customMobileRef = useRef<string>("");

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get((endPointApi as any).getPlanOptions as string);
      const list = res?.data?.data || [];
      const normalized = list.map((p: any) => ({
        key: p.plan_type,
        id: p._id || p.id,
        name: p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1),
        description: p.description || `${p.months} months, up to ${p.max_products} products`,
        price: p.amount,
        duration_months: p.months,
        product_limit: p.max_products,
        popular: p.popular || false,
      }));
      setPlans(normalized);
    } catch (e) {
      // Fallback plans if API fails
      setPlans([
        { 
          key: 'basic', 
          name: 'Basic', 
          description: '2 months, 1 product', 
          price: 39, 
          duration_months: 2, 
          product_limit: 1,
          popular: false 
        },
        { 
          key: 'standard', 
          name: 'Standard', 
          description: '5 months, up to 3 products', 
          price: 59, 
          duration_months: 5, 
          product_limit: 3, 
          popular: true 
        },
        { 
          key: 'premium', 
          name: 'Premium', 
          description: '12 months, up to 7 products', 
          price: 109, 
          duration_months: 12, 
          product_limit: 7,
          popular: false 
        },
      ]);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      // Reset confirm plan when dialog opens
      setConfirmPlan(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]"></div>

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-[100000] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">

          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Choose Your Plan
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Activate {selectedCount} selected product{selectedCount > 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {plansLoading ? (
                <div className="col-span-4 text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
                  <p className="text-sm text-gray-500">Loading plans...</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan.key}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-200 group ${
                      plan.popular 
                        ? 'border-[#28a8e9] shadow-lg shadow-[#28a8e9]/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:shadow-lg'
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-[#28a8e9] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          <IoMdStar className="text-sm" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        plan.popular 
                          ? 'bg-[#28a8e9]/10 dark:bg-[#28a8e9]/30 text-[#28a8e9]' 
                          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'
                      }`}>
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      {/* Plan Name */}
                      <h3 className={`text-xl font-bold mb-2 ${
                        plan.popular ? 'text-[#28a8e9] dark:text-[#28a8e9]' : 'text-gray-700 dark:text-white'
                      }`}>
                        {plan.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="mb-4">
                        <span className={`text-3xl font-bold ${
                          plan.popular ? 'text-[#28a8e9]' : 'text-gray-900 dark:text-white'
                        }`}>
                          ₹{plan.price}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          /plan
                        </span>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ✓ {plan.duration_months} months duration
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ✓ Up to {plan.product_limit} products
                        </p>
                        {selectedCount > plan.product_limit && (
                          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            ⚠️ You have selected {selectedCount} products, but this plan only supports {plan.product_limit}
                          </p>
                        )}
                      </div>

                      {/* Button */}
                      <Button
                        onClick={() =>
                          setConfirmPlan({
                            key: plan.key,
                            name: plan.name,
                            id: plan.id,
                            popular: plan.popular,
                            max_products: plan.product_limit,
                            months: plan.duration_months
                          })
                        }
                        disabled={selectedCount > plan.product_limit}
                        className={`w-full py-3 rounded-lg font-medium transition-all ${
                          selectedCount > plan.product_limit
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : plan.popular 
                              ? 'btn-primary text-white shadow-md hover:shadow-lg' 
                              : 'bg-gray-700 hover:bg-gray-800 text-white'
                        }`}
                      >
                        Choose {plan.name}
                        {selectedCount > plan.product_limit && (
                          <span className="block text-xs mt-1 opacity-75">
                            Exceeds limit
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Custom Plan Card */}
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-400 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                    Custom Plan
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Request a custom plan
                  </p>

                  {/* Mobile Input */}
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    onChange={(e: any) => (customMobileRef.current = e.target.value)}
                    className="w-full mb-4"
                  />

                  {/* Button */}
                  <Button
                    onClick={async () => {
                      const mobile = customMobileRef.current?.trim();

                      if (!mobile) {
                        toast.error("Enter mobile number");
                        return;
                      }

                      try {
                        const ids = selectedProducts.map((r) => r._id || r.id);

                        await api.post(endPointApi.postCustomPlanRequest, {
                          mobile,
                          product_ids: ids,
                        });

                        toast.success("Request sent. Admin will contact you.");
                        onClose();
                      } catch (e) {
                        toast.error("Failed to send request");
                      }
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-medium"
                  >
                    Request Callback
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPlan && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110000]" />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[110001] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-8 text-center">

              {/* Focus Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 flex items-center justify-center rounded-full ${
                  confirmPlan.popular ? 'bg-[#28a8e9]/20 text-[#28a8e9]' : 'bg-indigo-100 text-indigo-600'
                } text-2xl`}>
                  <CiWarning />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Activate Plan
              </h3>

              {/* Subtitle */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                You are about to activate
              </p>

              {/* Plan Highlight */}
              <div className={`rounded-xl py-3 mb-4 border ${
                confirmPlan.popular 
                  ? 'bg-[#28a8e9]/10 border-[#28a8e9] dark:border-[#28a8e9]' 
                  : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800'
              }`}>
                <span className={`text-lg font-semibold ${
                  confirmPlan.popular ? 'text-[#28a8e9]' : 'text-indigo-600'
                }`}>
                  {confirmPlan.name} Plan
                </span>
                {confirmPlan.popular && (
                  <div className="flex items-center justify-center gap-1 mt-1 ">
                    <IoMdStar className="text-[#28a8e9] text-sm" />
                    <span className="text-xs text-[#28a8e9]">Most Popular</span>
                    <IoMdStar className="text-[#28a8e9] text-sm" />
                  </div>
                )}
              </div>

              {/* Product Count */}
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                📦 {selectedCount} Product{selectedCount > 1 ? "s" : ""} selected
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setConfirmPlan(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 !bg-white hover:bg-gray-100 !text-gray-700"
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    onApplyPlan(
                      confirmPlan.key,
                      confirmPlan.months,
                      confirmPlan.max_products,
                      confirmPlan.id
                    );
                    setConfirmPlan(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-white shadow-lg ${
                    confirmPlan.popular 
                      ? 'bg-[#28a8e9] hover:bg-[#28a8e9]/90' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PlanSelectionDialog;