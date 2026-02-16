'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  errorMessage?: string;
  searchable?: boolean;
  onScrollNearBottom?: () => void;
  footer?: React.ReactNode;
  onSearch?: (value: string) => void;
  usePortal?: boolean;
  disabled?: boolean;
};

export default function 
({
  options,
  value,
  placeholder = "Select option",
  onChange,
  error = false,
  errorMessage,
  searchable = false,
  onScrollNearBottom,
  footer,
  usePortal = false,
  onSearch,
  disabled = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | undefined>(undefined);

  const selectedOption = options.find(o => o.value === value);
useEffect(() => {
  if (disabled) {
    setOpen(false);
  }
}, [disabled]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = ref.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
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

  useEffect(() => {
    if (!open || !searchable) return;
    try {
      (searchInputRef.current as any)?.focus?.({ preventScroll: true });
    } catch {}
  }, [open, searchable]);

  const updatePortalPosition = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPortalStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
      zIndex: 1000,
    });
  };

  useEffect(() => {
    if (!usePortal || !open) return;
    updatePortalPosition();
    const handleScroll = () => updatePortalPosition();
    const handleResize = () => updatePortalPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [usePortal, open]);

  return (
    <div ref={ref} className="relative w-full">
      {/* TRIGGER (NORMAL DROPDOWN) */}
      <button
        type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen(!open);
          }}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border text-sm
          ${error ? "border-red-500" : "border-gray-300 dark:border-gray-700"}
            ${disabled 
      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800" 
      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"}
        `}
      >
        <span className={selectedOption ? "text-gray-800  dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon className="text-gray-400" />
      </button>
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}

      {/* DROPDOWN */}
      {open &&
        (usePortal
          ? createPortal(
              <div
                ref={dropdownRef}
                style={portalStyle}
                className="rounded-xl border border-gray-200 shadow-lg "
              >
                {searchable && (
                  <div className="p-2 border-b">
                    <Input
                      ref={searchInputRef as any}
                      isSearch
                      size="xs"
                      placeholder="Search..."
                      value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        onSearch?.(e.target.value);
                      }}


                    />
                  </div>
                )}
                <div
                  className="max-h-48 overflow-y-auto "
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const scrollPercentage =
                      (target.scrollTop + target.clientHeight) /
                      target.scrollHeight;
                    console.log(
                      `Scroll: ${scrollPercentage * 100}% | scrollTop: ${target.scrollTop}, clientHeight: ${target.clientHeight}, scrollHeight: ${target.scrollHeight}`
                    );
                    if (onScrollNearBottom && scrollPercentage >= 0.8) {
                      console.log("Pagination trigger - near bottom!");
                      onScrollNearBottom();
                    }
                  }}
                >
                  {filteredOptions.length ? (
                    filteredOptions.map((opt) => (
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
                  {footer && <div className="px-4 py-2">{footer}</div>}
                </div>
              </div>,
              document.body
            )
          : (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
              >
                {searchable && (
                  <div className="p-2 border-b">
                    <Input
                      ref={searchInputRef as any}
                      isSearch
                      size="sm"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        if (onSearch) onSearch(e.target.value);
                      }}
                    />
                  </div>
                )}
                <div
                  className="max-h-48 overflow-y-auto dark:text-white"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const scrollPercentage =
                      (target.scrollTop + target.clientHeight) /
                      target.scrollHeight;
                    console.log(
                      `Scroll: ${scrollPercentage * 100}% | scrollTop: ${target.scrollTop}, clientHeight: ${target.clientHeight}, scrollHeight: ${target.scrollHeight}`
                    );
                    if (onScrollNearBottom && scrollPercentage >= 0.8) {
                      console.log("Pagination trigger - near bottom!");
                      onScrollNearBottom();
                    }
                  }}
                >
                  {filteredOptions.length ? (
                    filteredOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          onChange(opt.value);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 dark:hover:text-gray-900"
                      >
                        {opt.label}
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-400">
                      No results found
                    </p>
                  )}
                  {footer && <div className="px-4 py-2">{footer}</div>}
                </div>
              </div>
            ))}
    </div>
  );
}
