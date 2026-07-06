"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";
import { CalenderIcon } from "@/icons";
import flatpickr from "flatpickr";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartRange = "monthly" | "weekly" | "yearly" | "custom";

export default function MonthlySalesChart() {
  const searchParams = useSearchParams();
  const kpiRange = (searchParams?.get("range") as string | null) ?? null;
  const kpiStart = searchParams?.get("startDate");
  const kpiEnd = searchParams?.get("endDate");

  const datePickerRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<ChartRange>("monthly");
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date } | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<any>([
    { name: "Orders (Sell)", data: [] },
    { name: "Quotes (Rent)", data: [] },
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kpiRange) params.append("range", kpiRange);
      if (kpiStart) params.append("startDate", kpiStart);
      if (kpiEnd) params.append("endDate", kpiEnd);

      params.append("chartRange", chartRange);
      if (chartRange === "custom" && customDates) {
        params.append("chartStartDate", customDates.start.toISOString());
        params.append("chartEndDate", customDates.end.toISOString());
      }

      const response = await api.get(`${endPointApi.getVendorDashboardMetrics}?${params.toString()}`);
      if (response.data.success) {
        const { labels: lbs, orders, quotes } = response.data.data.graphs;
        setLabels(lbs || []);
        setSeries([
          { name: "Orders (Sell)", data: (orders || []).map((v: any) => v ?? 0) },
          { name: "Quotes (Rent)", data: (quotes || []).map((v: any) => v ?? 0) },
        ]);
      }
    } catch (error) {
      console.error("Error fetching orders graph data:", error);
    } finally {
      setLoading(false);
    }
  }, [kpiRange, kpiStart, kpiEnd, chartRange, customDates]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // flatpickr for custom range
  useEffect(() => {
    if (!datePickerRef.current || chartRange !== "custom") return;
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d, Y",
      defaultDate: [oneMonthAgo, today],
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          setCustomDates({ start: selectedDates[0], end: selectedDates[1] });
        }
      },
    });
    return () => { if (!Array.isArray(fp)) fp.destroy(); };
  }, [chartRange]);

  const options: ApexOptions = {
    colors: ["#6366f1", "#ec4899"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 310,
      toolbar: { show: false },
      dropShadow: { enabled: true, color: '#6366f1', top: 18, left: 0, blur: 5, opacity: 0.1 }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["#6366f1", "#ec4899"], curve: "smooth" },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
    },
    markers: { size: 0, hover: { size: 6 } },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: labels.length > 12 ? -45 : 0,
        style: { fontSize: "11px", colors: ["#6B7280"] }
      }
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: {
      min: 0,
      labels: {
        formatter: (val: number) => val ? `${Math.round(val)}` : "0",
        style: { colors: ["#6B7280"], fontSize: "12px" }
      }
    },
    grid: { yaxis: { lines: { show: true } }, borderColor: "#f1f5f9" },
    tooltip: {
      x: { show: true },
      y: { formatter: (val: number) => val ? `${val}` : "0" },
    },
  };

  const tabs: { label: string; value: ChartRange }[] = [
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-slate-50/50 px-5 pt-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6 h-full">
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Orders &amp; Quotes Trend
          </h3>
          <p className="text-xs text-gray-500 mt-1">Volume breakdown (Sell orders vs Rent quotes)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setChartRange(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  chartRange === tab.value
                    ? "bg-white shadow-sm text-blue-600 dark:bg-gray-800 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom date picker — inline next to Custom tab */}
          {chartRange === "custom" && (
            <div className="relative inline-flex items-center">
              <CalenderIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 w-3.5 h-3.5" />
              <input
                ref={datePickerRef}
                className="h-8 w-44 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                placeholder="Select date range"
                readOnly
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[310px]">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full">
          <div className="-ml-5 w-full pl-2">
            <ReactApexChart options={options} series={series} type="area" height={310} />
          </div>
        </div>
      )}
    </div>
  );
}
