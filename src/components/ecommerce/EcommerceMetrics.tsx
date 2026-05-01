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

  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null);
  const [openSubItem, setOpenSubItem] = useState<string | null>(null);

  const metrics = [
    {
      title: "Total Sell",
      value: loading ? "..." : `₹${Number(data?.totalSell || 0).toLocaleString('en-IN')}`,
      icon: (className: string) => <BoxCubeIcon className={className} />,
      change: "+14.2%",
      isPositive: true,
      color: "brand",
      hoverItems: []
    },
    {
      title: "Total Orders",
      value: loading ? "..." : (data?.totalOrders || 0).toLocaleString(),
      icon: (className: string) => <BoxIconLine className={className} />,
      change: "+8.2%",
      isPositive: true,
      color: "blue-light",
      hoverItems: []
    },
    {
      title: "Active Listings",
      value: loading ? "..." : (data?.activeListings || 0).toLocaleString(),
      icon: (className: string) => <ListIcon className={className} />,
      change: "+5.4%",
      isPositive: true,
      color: "emerald",
      hoverItems: []
    },
    {
      title: "Rental Orders (Active)",
      value: loading ? "..." : (data?.rentalOrdersActive || 0).toLocaleString(),
      icon: (className: string) => <TimeIcon className={className} />,
      change: "-2.1%",
      isPositive: false,
      color: "warning",
      hoverItems: []
    },
    {
      title: "Total Products",
      value: loading ? "..." : (data?.totalProducts || 0).toLocaleString(),
      icon: (className: string) => <BoxCubeIcon className={className} />,
      change: "+10.3%",
      isPositive: true,
      color: "amber",
      hoverItems: [
        {
          label: "For Sell",
          value: data?.sellProducts || 0,
          color: "text-blue-600",
          subItems: [
            { label: "Active (Visible)", value: data?.sellActive || 0, color: "text-emerald-600" },
            { label: "Inactive (Hidden)", value: data?.sellInactive || 0, color: "text-slate-400" },
          ]
        },
        {
          label: "For Rent",
          value: data?.rentProducts || 0,
          color: "text-purple-600",
          subItems: [
            { label: "Active (Visible)", value: data?.rentActive || 0, color: "text-emerald-600" },
            { label: "Inactive (Hidden)", value: data?.rentInactive || 0, color: "text-slate-400" },
          ]
        },
      ]
    },
    {
      title: "Total Customers",
      value: loading ? "..." : (data?.totalCustomers || 0).toLocaleString(),
      icon: (className: string) => <GroupIcon className={className} />,
      change: "+11.0%",
      isPositive: true,
      color: "indigo",
      hoverItems: []
    }
  ];

  const handleCardClick = (index: number) => {
    if (metrics[index].hoverItems.length > 0) {
      setOpenCardIndex(openCardIndex === index ? null : index);
      setOpenSubItem(null);
    }
  };

  const handleSubItemClick = (itemLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSubItem(openSubItem === itemLabel ? null : itemLabel);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.metric-card-container')) {
        setOpenCardIndex(null);
        setOpenSubItem(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="relative metric-card-container"
        >
          <div
            className={`rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm hover:shadow-md transition-all duration-300 min-h-[105px] flex flex-col justify-center cursor-pointer ${openCardIndex === index ? 'ring-2 ring-brand-500/20 shadow-md' : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-11 h-11 dark:bg-[#0d111c] rounded-xl bg-${metric.color}-50  flex-shrink-0`}>
                {metric.icon(`size-6 text-${metric.color}-600 dark:text-${metric.color}-400`)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {metric.title}
                  </span>
                  {/* <span className={`flex items-center text-[10px] font-bold ${metric.isPositive ? 'text-success-600' : 'text-error-600'} flex-shrink-0`}>
                    {metric.change}
                  </span> */}
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 leading-tight">
                  {metric.value}
                </h4>
                {metric.hoverItems.length > 0 && (
                  <p className="text-[9px] font-bold text-gray-400 mt-1 flex items-center gap-0.5">
                    Click to view details →
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Detail Card - Responsive positioning */}
          {openCardIndex === index && metric.hoverItems.length > 0 && (
            <div className={`fixed sm:absolute z-[100] left-4 right-4 bottom-4 sm:left-auto sm:right-auto sm:bottom-auto ${index % 4 === 3 ? 'sm:right-full sm:mr-2' : 'sm:left-full sm:ml-2'} sm:top-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl p-3 space-y-1 min-w-[220px]`}>
              {metric.hoverItems.map((item: any, i: number) => (
                <div
                  key={i}
                  className={`relative flex items-center justify-between text-xs font-medium p-2 rounded-lg transition-colors cursor-pointer ${openSubItem === item.label ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                  onClick={(e) => item.subItems?.length > 0 && handleSubItemClick(item.label, e)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    {item.subItems?.length > 0 && <span className="text-[8px] text-slate-300">▶</span>}
                  </div>
                  <span className={`font-bold ${item.color || "text-gray-800 dark:text-white"}`}>
                    {item.value.toLocaleString("en-IN")}
                  </span>

                  {/* Sub-items - show inline on mobile, absolute on desktop */}
                  {openSubItem === item.label && item.subItems?.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full mt-1 sm:left-auto sm:right-auto sm:top-0 ${index % 4 === 3 ? 'sm:right-full sm:mr-2' : 'sm:left-full sm:ml-2'} min-w-[180px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl p-3 space-y-2`}>
                      <p className="text-[9px] font-black text-slate-400 mb-1 whitespace-nowrap border-b border-slate-100 dark:border-slate-800 pb-1">{item.label} Breakdown</p>
                      {item.subItems.map((sub: any, si: number) => (
                        <div key={si} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500 whitespace-nowrap mr-4">{sub.label}</span>
                          <span className={`${sub.color || "text-slate-800 dark:text-white"}`}>
                            {sub.value.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};