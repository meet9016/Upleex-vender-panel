'use client';

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import Input from "./Input";

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  value: string | null;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: boolean;
  searchable?: boolean;
  onScrollNearBottom?: () => void;
  footer?: React.ReactNode;
  onSearch?: (value: string) => void;
};

export default function 
({
  options,
  value,
  placeholder = "Select option",
  onChange,
  error = false,
  searchable = false,
  onScrollNearBottom,
  footer,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find(o => o.value === value);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOptions = searchable
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <div ref={ref} className="relative w-full">
      {/* TRIGGER (NORMAL DROPDOWN) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border bg-white dark:bg-dark-900
          ${error ? "border-red-500" : "border-gray-300"}
        `}
      >
        <span className={selectedOption ? "text-gray-800" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon className="text-gray-400" />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white dark:bg-dark-800 shadow-lg">

          {/* 🔍 SEARCH INPUT INSIDE DROPDOWN */}
          {searchable && (
            <div className="p-2 border-b">
              <Input
                isSearch
                size="sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                autoFocus
              />
            </div>
          )}

          {/* OPTIONS (with scroll handler for pagination) */}
          <div
            className="max-h-48 overflow-y-auto"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
              console.log(`Scroll: ${scrollPercentage * 100}% | scrollTop: ${target.scrollTop}, clientHeight: ${target.clientHeight}, scrollHeight: ${target.scrollHeight}`);
              
              // Trigger when user scrolls to 80% or more
              if (onScrollNearBottom && scrollPercentage >= 0.8) {
                console.log("Pagination trigger - near bottom!");
                onScrollNearBottom();
              }
            }}
          >
            {filteredOptions.length ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <p className="px-4 py-2 text-sm text-gray-400">
                No results found
              </p>
            )}

            {/* footer (loader / load more) */}
            {footer && <div className="px-4 py-2">{footer}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
