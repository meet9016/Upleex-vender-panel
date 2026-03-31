"use client"

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import ChartTab from "../common/ChartTab";
import { CalenderIcon } from "../../icons";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { useSearchParams } from "next/navigation";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function StatisticsChart() {
  const searchParams = useSearchParams();
  const range = searchParams?.get("range") || "";
  const qsStart = searchParams?.get("startDate");
  const qsEnd = searchParams?.get("endDate");

  const datePickerRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [customDates, setCustomDates] = useState<{ start: Date, end: Date } | null>(null);
  const [series, setSeries] = useState<any>([
    { name: "Sell Earnings", data: new Array(12).fill(0) },
    { name: "Rent Earnings", data: new Array(12).fill(0) },
  ]);
  const [selectedTab, setSelectedTab] = useState<"optionOne" | "optionTwo" | "optionThree">("optionOne");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (range) params.append("range", range);
        const start = qsStart ? new Date(qsStart) : customDates?.start;
        const end = qsEnd ? new Date(qsEnd) : customDates?.end;
        if (range === "Custom Range" && start && end) {
          params.append("chartStartDate", start.toISOString());
          params.append("chartEndDate", end.toISOString());
        }

        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await api.get(`${endPointApi.getVendorDashboardMetrics}${query}`);
        if (response.data.success) {
          const { earnings } = response.data.data.graphs;
          setSeries([
            { name: "Sell Earnings", data: earnings.sell },
            { name: "Rent Earnings", data: earnings.rent },
          ]);
        }
      } catch (error) {
        console.error("Error fetching earnings graph data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, customDates, qsStart, qsEnd]);

  useEffect(() => {
    if (!datePickerRef.current) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
      prevArrow: `<i class="fa-solid fa-chevron-left"></i>`,
      nextArrow: `<i class="fa-solid fa-chevron-right"></i>`,
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          setCustomDates({ start: selectedDates[0], end: selectedDates[1] });
        }
      }
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  const transformSeries = () => {
    if (selectedTab === "optionOne") {
      return {
        categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        series,
      };
    }
    if (selectedTab === "optionTwo") {
      const cats = ["Q1","Q2","Q3","Q4"];
      const sum3 = (arr: Array<number | null>) => [0,1,2,3].map(q=>{
        const start = q*3;
        const slice = arr.slice(start,start+3) as Array<number | null>;
        const s = slice.reduce<number>((acc, val)=> acc + (val ?? 0), 0);
        return s > 0 ? s : null;
      });
      return {
        categories: cats,
        series: series.map((s:any)=>({ ...s, data: sum3((s.data as Array<number | null>) || []) })),
      };
    }
    const yearLabel = String(new Date().getFullYear());
    const sumAll = (arr: Array<number | null>) => {
      const s = arr.reduce<number>((acc, val)=> acc + (val ?? 0), 0);
      return [s > 0 ? s : null];
    };
    return {
      categories: [yearLabel],
      series: series.map((s:any)=>({ ...s, data: sumAll((s.data as Array<number | null>) || []) })),
    };
  };

  const { categories: displayCategories, series: displaySeries } = transformSeries();

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
    },
    colors: ["#465FFF", "#f97316"], // blue-600 (Sell) and orange-500 (Rent)
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: selectedTab === "optionThree" ? "25%" : selectedTab === "optionTwo" ? "40%" : "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0',
      },
    },
    xaxis: {
      type: "category",
      categories: displayCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0',
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Earnings Graph
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Monthly earnings overview (Sell vs Rent)
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab selected={selectedTab} onChange={setSelectedTab} />
          {range === "Custom Range" && (
            <div className="relative inline-flex items-center">
              <CalenderIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2  text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
              <input
                ref={datePickerRef}
                className="h-10 w-10 lg:w-40 lg:h-auto  lg:pl-10 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent lg:text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300 cursor-pointer"
                placeholder="Select date range"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[700px] xl:min-w-full">
          <Chart options={options} series={displaySeries} type="bar" height={310} />
        </div>
      </div>
    </div>
  );
}
