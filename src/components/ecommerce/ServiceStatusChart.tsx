"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";
import DoughnutChart from "@/components/common/DoughnutChart";

export default function ServiceStatusChart() {
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
        console.error("Error fetching service status data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, startDate, endDate]);

  const chartData = [
    { label: "Approved", value: data?.serviceActive || 0, color: "#22c55e" },
    { label: "Pending", value: data?.servicePending || 0, color: "#f59e0b" },
    { label: "Rejected", value: data?.serviceRejected || 0, color: "#ef4444" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Services Status
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Approved, Pending, and Rejected services
        </p>
      </div>
      <div className="w-full flex-1 flex items-center justify-center">
        {loading ? (
           <div className="flex items-center justify-center">Loading...</div>
        ) : total > 0 ? (
           <DoughnutChart 
            data={chartData} 
            centerText={total.toString()}
            centerSubtext="Total Services"
            isPie={true}
           />
        ) : (
           <div className="flex flex-col items-center justify-center text-gray-400">
              <p className="text-3xl font-bold mb-2">0</p>
              <p>No Services Found</p>
           </div>
        )}
      </div>
    </div>
  );
}
