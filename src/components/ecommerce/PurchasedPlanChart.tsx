"use client";
import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import DoughnutChart from "@/components/common/DoughnutChart";

export default function PurchasedPlanChart() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [listingRes, priorityRes, rentalBoostRes, generalRes] = await Promise.all([
        api.get(endPointApi.getVendorListingPurchases),
        api.get(endPointApi.getVendorPriorityPurchases),
        api.get(endPointApi.getVendorRentalBoostPurchases),
        api.get(endPointApi.getVendorGeneralPurchases)
      ]);

      const getActiveSum = (data: any[]) => {
        if (!Array.isArray(data)) return 0;
        return data
          .filter((p: any) => {
            const expireAt = p.expire_at || p.expiry_date || p.expires_at;
            const isExpired = expireAt ? new Date(expireAt) < new Date() : false;
            return (p.status === 'active' || !isExpired);
          })
          .reduce((sum: number, p: any) => sum + (Number(p.amount || p.price || 0)), 0);
      };

      const listingAmount = getActiveSum(listingRes.data?.data || []);
      const priorityAmount = getActiveSum(priorityRes.data?.data || []);
      const rentalBoostAmount = getActiveSum(rentalBoostRes.data?.data || []);
      const generalAmount = getActiveSum(generalRes.data?.data || []);

      const amounts = [listingAmount, priorityAmount, rentalBoostAmount, generalAmount];
      setChartData([
        { label: "Base Listing", value: listingAmount, color: "#3b82f6" },
        { label: "Priority", value: priorityAmount, color: "#f59e0b" },
        { label: "Rental Boost", value: rentalBoostAmount, color: "#10b981" },
        { label: "General Plan", value: generalAmount, color: "#8b5cf6" },
      ]);
      setTotalSpent(amounts.reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error("Error fetching purchased plans data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Purchased Plans Breakdown
        </h3>
        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Amount spent on active plans</p>
      </div>
      
      <div className="w-full flex-1 flex items-center justify-center">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : totalSpent === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
            <p className="text-3xl font-bold mb-2">₹0</p>
            <p>No active plan purchases</p>
          </div>
        ) : (
          <DoughnutChart 
            data={chartData}
            centerText={`₹${totalSpent.toLocaleString('en-IN')}`}
            centerSubtext="Active Plans Total"
          />
        )}
      </div>
    </div>
  );
}
