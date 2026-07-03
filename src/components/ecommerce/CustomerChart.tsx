"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function CustomerChart() {
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
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, startDate, endDate]);

  const newCustomers = data?.newCustomers || 0;
  const returningCustomers = data?.returningCustomers || 0;
  const total = newCustomers + returningCustomers;

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      height: 280,
    },
    labels: ["New Customers", "Repeat Customers"],
    colors: ["#3b82f6", "#10b981"], // Blue and Green
    legend: {
      position: "bottom",
      fontFamily: "Outfit",
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#ffffff']
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.45
      },
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString('en-IN')} users`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontFamily: "Outfit, sans-serif",
              color: "#64748b",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              color: "#1e293b",
              formatter: () => total.toString(),
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Customers",
              fontSize: "14px",
              fontFamily: "Outfit, sans-serif",
              color: "#64748b",
              formatter: () => total.toString(),
            },
          },
        },
      },
    },
    stroke: {
      width: 2,
      colors: ["#ffffff"],
    },
  };

  const series = [newCustomers, returningCustomers];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Customer Acquisition
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          New vs Returning customer breakdown
        </p>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[280px]">
          {loading ? (
             <div className="h-[280px] flex items-center justify-center">Loading...</div>
          ) : total > 0 ? (
             <ReactApexChart options={options} series={series} type="donut" height={280} />
          ) : (
             <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                <p className="text-3xl font-bold mb-2">0</p>
                <p>No Customers Found</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
