"use client";

import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useFilter } from "@/context/FilterContext";

export default function FilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, setFilters } = useFilter();

  const activeCount = Number(filters.service) + Number(filters.vendor);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleToggle = (key: "service" | "vendor") => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClear = () => {
    setFilters({ service: false, vendor: false });
  };

  return (
    <div className="relative">
      {/* Trigger button — matches rounded button style of NotificationDropdown */}
      <button
        onClick={toggleDropdown}
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Filter"
      >
        {/* Active badge */}
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
        {/* Filter icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-current"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.5 4.5A.75.75 0 0 1 3.25 3.75h13.5a.75.75 0 0 1 0 1.5H3.25A.75.75 0 0 1 2.5 4.5ZM5 10a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 10Zm2.75 4.75a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] w-[220px] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            View As
          </h6>
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Toggle options */}
        <div className="flex flex-col gap-1 p-3">
          {(["service", "vendor"] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                filters[key]
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <span className="capitalize">{key}</span>
              {/* Checkbox-style indicator */}
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                  filters[key]
                    ? "border-brand-500 bg-brand-500"
                    : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                }`}
              >
                {filters[key] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 3.5L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Active indicator footer */}
        {activeCount > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Viewing as:{" "}
              <span className="font-medium text-brand-500">
                {[filters.service && "Service", filters.vendor && "Vendor"]
                  .filter(Boolean)
                  .join(" & ")}
              </span>
            </p>
          </div>
        )}
      </Dropdown>
    </div>
  );
}