"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, CalenderIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import flatpickr from "flatpickr";

const DashboardFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date } | null>(null);
  
  // Initialize with URL param or default
  const urlRange = (searchParams?.get("range") as string | null) ?? "This Month";
  const [selectedFilter, setSelectedFilter] = useState(urlRange);

  useEffect(() => {
    setSelectedFilter(urlRange);
  }, [urlRange]);

  const filters = [
    "This Week",
    "This Month",
    "Last 3 Month",
    "Last 6 Month",
    "12 Month",
    "Custom Range",
  ];

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setIsOpen(false);
    
    // Update URL to trigger refetches in sibling components
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("range", filter);
    if (filter !== "Custom Range") {
      params.delete("startDate");
      params.delete("endDate");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!datePickerRef.current) return;
    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      clickOpens: true,
      prevArrow: `<i class="fa-solid fa-chevron-left"></i>`,
      nextArrow: `<i class="fa-solid fa-chevron-right"></i>`,
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          const [start, end] = selectedDates;
          setCustomDates({ start, end });
          const params = new URLSearchParams(searchParams?.toString() || "");
          params.set("range", "Custom Range");
          params.set("startDate", start.toISOString());
          params.set("endDate", end.toISOString());
          router.push(`${pathname}?${params.toString()}`);
        }
      },
    });
    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, [pathname, router, searchParams]);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-brand-500 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Overview
        </h2>
      </div>

      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="dropdown-toggle inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.08]"
        >
          <CalenderIcon className="size-4 text-gray-500" />
          {selectedFilter}
          <ChevronDownIcon className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="w-48 p-2 right-0 origin-top-right"
        >
          {filters.map((filter) => (
            <DropdownItem
              key={filter}
              onItemClick={() => handleFilterSelect(filter)}
              className={`flex w-full items-center px-3 py-2 text-sm rounded-lg transition-colors ${selectedFilter === filter
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
            >
              {filter}
            </DropdownItem>
          ))}
        </Dropdown>
        {selectedFilter === "Custom Range" && (
          <div className="mt-2">
            <input
              ref={datePickerRef}
              className="h-10 lg:h-auto lg:pl-3 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
              placeholder="Select date range"
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardFilter;
