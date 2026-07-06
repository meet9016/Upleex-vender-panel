"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";
import DoughnutChart from "@/components/common/DoughnutChart";

export default function ProductDistributionChart() {
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
        console.error("Error fetching product distribution data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, startDate, endDate]);

  const sellProducts = data?.sellProducts || 0;
  const rentProducts = data?.rentProducts || 0;
  const totalProducts = data?.totalProducts || 0;

  const chartData = [
    { label: "Sell", value: sellProducts, color: "#8b5cf6" },
    { label: "Rent", value: rentProducts, color: "#ec4899" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Product Distribution
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Split between sell and rent products
        </p>
      </div>
      <div className="w-full flex-1 flex items-center justify-center">
        {loading ? (
           <div className="flex items-center justify-center">Loading...</div>
        ) : (
           <DoughnutChart 
            data={chartData}
            centerText={totalProducts.toString()}
            centerSubtext="Total Products"
           />
        )}
      </div>
    </div>
  );
}
