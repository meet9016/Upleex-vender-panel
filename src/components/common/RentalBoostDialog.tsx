"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Rocket, Check, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";

interface RentalBoostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

const RentalBoostDialog: React.FC<RentalBoostDialogProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.getAllRentalBoostPlans, {
        params: { status: "active" },
      });
      if (res?.data?.success) {
        setPlans(res.data.data);
        // Select popular plan by default if it exists
        const popular = res.data.data.find((p: any) => p.is_popular);
        if (popular) setSelectedPlanId(popular._id);
        else if (res.data.data.length > 0) setSelectedPlanId(res.data.data[0]._id);
      }
    } catch (error) {
      toast.error("Failed to load boost plans");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlanId || !product) return;
    try {
      setPurchasing(true);
      const res = await api.post(endPointApi.purchaseRentalBoostPlan, {
        plan_id: selectedPlanId,
        product_id: product._id || product.id,
      });
      if (res?.data?.success) {
        toast.success(res.data.message || "Product boosted successfully!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Boost purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl p-0 overflow-hidden"
      showCloseButton
    >
      <div className="relative">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10 dark:opacity-20" />
        
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none animate-pulse">
              <Rocket className="text-white w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Boost Your Product
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Increase visibility and sales for <strong>{product?.product_name || "this product"}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl mb-6">
            <AlertCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold">Benefits of Boosting:</p>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Show up first in &quot;You May Like&quot; recommendations.</li>
                <li>Reach up to 10x more potential buyers.</li>
                <li>Priority sorting in category browsing.</li>
              </ul>
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-400 mb-4">
            Select a Boost Plan
          </h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-8 h-8" />
              <span>Loading amazing plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">No active boost plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex flex-col group ${
                    selectedPlanId === plan._id
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-900/5"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {plan.is_popular && (
                    <span className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-bold rounded-full shadow-sm">
                      MOST POPULAR
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                       selectedPlanId === plan._id ? "bg-indigo-600 border-indigo-600" : "border-gray-200 dark:border-gray-700"
                    }`}>
                        {selectedPlanId === plan._id && <Check className="text-white w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                      {plan.name}
                    </h5>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                        {plan.days} Days Visibility Boost
                    </p>
                  </div>
                  
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-3 line-clamp-2">
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Total Payable</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
                ₹{plans.find(p => p._id === selectedPlanId)?.price || 0}
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
               onClick={onClose}
               className="flex-1 sm:flex-none px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all text-sm"
            >
                Cancel
            </button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing || !selectedPlanId || plans.length === 0}
              className="flex-1 sm:flex-none py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none min-w-[160px]"
            >
              {purchasing ? (
                <div className="flex items-center gap-2">
                   <Loader2 className="animate-spin w-4 h-4" />
                   <span>Processing...</span>
                </div>
              ) : (
                "Boost Now"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RentalBoostDialog;
