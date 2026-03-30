"use client"
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  GridIcon,
  DollarLineIcon,
  ListIcon,
  TimeIcon,
  AlertIcon,
  BoxCubeIcon,
  WalletIcon,
  PlusIcon
} from "@/icons";
import { useSearchParams } from "next/navigation";

export const EcommerceMetrics = () => {
  const searchParams = useSearchParams();
  const range = (searchParams?.get("range") as string | null) ?? null;
  const startDate = (searchParams?.get("startDate") as string | null) ?? null;
  const endDate = (searchParams?.get("endDate") as string | null) ?? null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
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
        console.error("Error fetching dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [range, startDate, endDate]);

  const metrics = [
    {
      title: "Total Sell",
      value: loading ? "..." : `₹${Number(data?.totalSell || 0).toLocaleString('en-IN')}`,
      icon: (className: string) => <BoxCubeIcon className={className} />,
      change: "+14.2%",
      isPositive: true,
      color: "brand"
    },
    {
      title: "Total Earnings",
      value: "₹4,25,380", // Static as requested
      icon: (className: string) => <DollarLineIcon className={className} />,
      change: "+12.5%",
      isPositive: true,
      color: "success"
    },
    {
      title: "Total Orders",
      value: loading ? "..." : (data?.totalOrders || 0).toLocaleString(),
      icon: (className: string) => <BoxIconLine className={className} />,
      change: "+8.2%",
      isPositive: true,
      color: "blue-light"
    },
    {
      title: "Total Items Sold",
      value: "3,842", // Static as requested
      icon: (className: string) => <GridIcon className={className} />,
      change: "+11.0%",
      isPositive: true,
      color: "orange"
    },
    {
      title: "Active Listings",
      value: loading ? "..." : (data?.activeListings || 0).toLocaleString(),
      icon: (className: string) => <ListIcon className={className} />,
      change: "+5.4%",
      isPositive: true,
      color: "emerald"
    },
    {
      title: "Rental Orders (Active)",
      value: loading ? "..." : (data?.rentalOrdersActive || 0).toLocaleString(),
      icon: (className: string) => <TimeIcon className={className} />,
      change: "-2.1%",
      isPositive: false,
      color: "warning"
    },
    {
      title: "Total Products",
      value: loading ? "..." : (data?.totalProducts || 0).toLocaleString(),
      icon: (className: string) => <BoxCubeIcon className={className} />,
      change: "+10.3%",
      isPositive: true,
      color: "amber"
    },
    {
      title: "Total Customers",
      value: loading ? "..." : (data?.totalCustomers || 0).toLocaleString(),
      icon: (className: string) => <GroupIcon className={className} />,
      change: "+11.0%",
      isPositive: true,
      color: "indigo"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm hover:shadow-md transition-all duration-300 min-h-[105px] flex flex-col justify-center"
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-${metric.color}-50 dark:bg-${metric.color}-500/10 flex-shrink-0`}>
              {metric.icon(`size-6 text-${metric.color}-600 dark:text-${metric.color}-400`)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">
                  {metric.title}
                </span>
                <span className={`flex items-center text-[10px] font-bold ${metric.isPositive ? 'text-success-600' : 'text-error-600'} flex-shrink-0`}>
                  {metric.change}
                </span>
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 leading-tight">
                {metric.value}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
