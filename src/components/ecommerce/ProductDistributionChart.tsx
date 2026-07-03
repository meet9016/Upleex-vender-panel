"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";
import DoughnutChart from "@/components/dashboard/DoughnutChart";

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

  const chartData = [
    { label: "Sell", value: data?.sellProducts || 0, color: "#8b5cf6" },
    { label: "Rent", value: data?.rentProducts || 0, color: "#ec4899" }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 pb-5 pt-5 dark:border-slate-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {!loading && (
        <DoughnutChart
          data={chartData}
          title="Product Distribution"
          subtitle="Sell vs Rent products"
          centerText={String(data?.totalProducts || 0)}
          centerSubtext="Total Products"
        />
      )}
    </div>
  );
}
