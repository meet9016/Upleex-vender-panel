"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/common/Input";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { CiWarning } from "react-icons/ci";
import { IoMdStar } from "react-icons/io";

interface ServicePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyPlan: (planType: string, months?: number, maxServices?: number, planId?: string) => void;
  selectedServices: any[];
}

const ServicePlanDialog: React.FC<ServicePlanDialogProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyPlan,
  selectedServices,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<any>(null);
  const [customMobile, setCustomMobile] = useState("");

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get(endPointApi.getServicePlanOptions);
      const list = res?.data?.data || [];
      const normalized = list.map((p: any) => ({
        key: p.plan_name,
        id: p._id || p.id,
        name: p.plan_name?.charAt(0).toUpperCase() + p.plan_name?.slice(1),
        description: `${p.months} months, up to ${p.max_services} services`,
        price: p.amount,
        duration_months: p.months,
        service_limit: p.max_services,
        popular: p.plan_name === 'standard',
      }));
      setPlans(normalized);
    } catch (e) {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setConfirmPlan(null);
      setCustomMobile("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]"></div>
      <div className="fixed inset-0 flex items-center justify-center z-[100000] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Service Plan</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Activate {selectedCount} selected service{selectedCount > 1 ? "s" : ""}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {plansLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-sm text-gray-500">Loading plans...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.key}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-200 ${
                      plan.popular
                        ? "border-teal-500 shadow-lg shadow-teal-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-lg"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          <IoMdStar className="text-sm" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        plan.popular ? "bg-teal-100 dark:bg-teal-900/30 text-teal-600" : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                      }`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      <h3 className={`text-lg font-bold mb-2 ${plan.popular ? "text-teal-600" : "text-gray-700 dark:text-white"}`}>
                        {plan.name}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{plan.description}</p>

                      <div className="mb-4">
                        <span className={`text-2xl font-bold ${plan.popular ? "text-teal-600" : "text-gray-900 dark:text-white"}`}>
                          ₹{plan.price}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">/plan</span>
                      </div>

                      <div className="space-y-1 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <p>✓ {plan.duration_months} months duration</p>
                        <p>✓ Up to {plan.service_limit} services</p>
                      </div>

                      <Button
                        onClick={() => setConfirmPlan({
                          key: plan.key,
                          name: plan.name,
                          id: plan.id,
                          popular: plan.popular,
                          max_services: plan.service_limit,
                          months: plan.duration_months
                        })}
                        disabled={selectedCount > plan.service_limit}
                        className={`w-full py-2.5 rounded-lg font-medium ${
                          selectedCount > plan.service_limit
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : plan.popular
                              ? "bg-teal-600 hover:bg-teal-700 text-white"
                              : "bg-gray-700 hover:bg-gray-800 text-white"
                        }`}
                      >
                        Choose {plan.name}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Custom Plan Card */}
                <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-teal-400 hover:shadow-lg transition-all duration-200">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>

                    <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">Custom Plan</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Request a custom plan</p>

                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={customMobile}
                      onChange={(e) => setCustomMobile(e.target.value)}
                      className="w-full px-4 py-2.5 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />

                    <Button
                      onClick={async () => {
                        const mobile = customMobile.trim();
                        if (!mobile) {
                          toast.error("Enter mobile number");
                          return;
                        }
                        try {
                          const ids = selectedServices.map((r) => r._id || r.id);
                          await api.post(endPointApi.postCustomPlanRequest, {
                            mobile,
                            service_ids: ids,
                          });
                          toast.success("Request sent. Admin will contact you.");
                          onClose();
                        } catch (e) {
                          toast.error("Failed to send request");
                        }
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2.5 rounded-lg font-medium"
                    >
                      Request Callback
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmPlan && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110000]" />
          <div className="fixed inset-0 flex items-center justify-center z-[110001] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 flex items-center justify-center rounded-full ${
                  confirmPlan.popular ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-600"
                } text-2xl`}>
                  <CiWarning />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Activate Plan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You are about to activate</p>

              <div className={`rounded-xl py-3 mb-4 border ${
                confirmPlan.popular
                  ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}>
                <span className={`text-lg font-semibold ${confirmPlan.popular ? "text-teal-600" : "text-gray-700 dark:text-white"}`}>
                  {confirmPlan.name} Plan
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                📦 {selectedCount} Service{selectedCount > 1 ? "s" : ""} selected
              </p>

              <div className="flex gap-3">
                <Button onClick={() => setConfirmPlan(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 !bg-white hover:bg-gray-100 !text-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onApplyPlan(confirmPlan.key, confirmPlan.months, confirmPlan.max_services, confirmPlan.id);
                    setConfirmPlan(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-white ${
                    confirmPlan.popular ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-700 hover:bg-gray-800"
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

export default ServicePlanDialog;
