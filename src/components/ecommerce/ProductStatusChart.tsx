"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";
import DoughnutChart from "@/components/common/DoughnutChart";

export default function ProductStatusChart() {
  const searchParams = useSearchParams();
  const range = (searchParams?.get("range") as string | null) ?? null;
  const startDate = (searchParams?.get("startDate") as string | null) ?? null;
  const endDate = (searchParams?.get("endDate") as string | null) ?? null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (range) params.set("range", range);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await api.get(`${endPointApi.getVendorDashboardMetrics}${query}`);
        if (response.data.success) {
          setData(response.data.data.metrics);
        }
      } catch (error) {
        console.error("Error fetching product status data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, startDate, endDate]);

  const chartData = [
    { label: "Sell Active", value: data?.sellActive || 0, color: "#22c55e" },
    { label: "Sell Inactive", value: data?.sellInactive || 0, color: "#64748b" },
    { label: "Rent Active", value: data?.rentActive || 0, color: "#10b981" },
    { label: "Rent Inactive", value: data?.rentInactive || 0, color: "#475569" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Product Status
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Active vs inactive products
        </p>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[280px]">
          {loading ? (
             <div className="h-[280px] flex items-center justify-center">Loading...</div>
          ) : (
             <DoughnutChart 
              data={chartData} 
              centerText={total.toString()}
              centerSubtext="Total Products"
              isPie={true}
             />
          )}
        </div>
      </div>
    </div>
  );
}
