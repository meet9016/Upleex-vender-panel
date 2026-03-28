"use client";
import React, { useState } from "react";
import { ChevronDownIcon, CalenderIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const DashboardFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("This Month");

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
  };

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
              className={`flex w-full items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedFilter === filter
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {filter}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
    </div>
  );
};

export default DashboardFilter;
