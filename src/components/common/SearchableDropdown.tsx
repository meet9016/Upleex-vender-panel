'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "@/icons";
import Input from "./Input";
import { FiCheck } from "react-icons/fi";

type Option = {
  label: string;
  value: string;
  image?: string;
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

export default function SearchableDropdown({
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>();
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      setSearch("");
    }
  }, [open]);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !ref.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
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
    searchInputRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (highlightedIndex >= 0 && scrollContainerRef.current) {
      const highlightedElement = scrollContainerRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling to parent
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!disabled) {
            const currentValue = value;
            if (currentValue === opt.value) {
              onChange("");
            } else {
              onChange(opt.value);
            }
            setOpen(false);
            setSearch("");
          }
        }
        break;
      case 'Backspace':
        
        if (!search) {
          if (value) {
            onChange("");
          }
        }
        break;
        
      case 'Escape':
      case 'Tab':
        setOpen(false);
        setSearch("");
        break;
    }
  };

  const updatePortalPosition = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPortalStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (!usePortal || !open) return;
    updatePortalPosition();
    window.addEventListener("scroll", updatePortalPosition, true);
    window.addEventListener("resize", updatePortalPosition);
    return () => {
      window.removeEventListener("scroll", updatePortalPosition, true);
      window.removeEventListener("resize", updatePortalPosition);
    };
  }, [usePortal, open]);

  const renderDropdown = (
    <div
      ref={dropdownRef}
      style={usePortal ? portalStyle : undefined}
      className={`${
        usePortal ? "" : "absolute mt-2 w-full"
      } z-50 rounded-xl border border-gray-200 dark:border-gray-700 
      bg-white dark:bg-gray-900 shadow-xl`}
    >
      {searchable && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <Input
            ref={searchInputRef as any}
            isSearch
            size="sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearch?.(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="max-h-52 overflow-y-auto"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const scrollPercentage =
            (target.scrollTop + target.clientHeight) /
            target.scrollHeight;
          if (onScrollNearBottom && scrollPercentage >= 0.8) {
            onScrollNearBottom();
          }
        }}
      >
   {filteredOptions.length ? (
  filteredOptions.map((opt, index) => {
    const isSelected = value === opt.value;

    return (
      <div
        key={opt.value}
        role="option"
        data-index={index}
        aria-selected={isSelected}
        onClick={() => {
          if (disabled) return;
          const currentValue = value;
          if (currentValue === opt.value) {
            onChange("");
          } else {
            onChange(opt.value);
          }
          setOpen(false);
          setSearch("");
        }}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-3 transition
          ${
            isSelected
              ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }
          ${highlightedIndex === index ? "bg-gray-100 dark:bg-gray-800" : ""}
        `}
      >
        {/* CHECKBOX FIRST */}
        <div
          className={`w-5 h-5 flex items-center justify-center border rounded
          ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          {isSelected && <FiCheck size={14} className="text-white" />}
        </div>

        {/* IMAGE */}
        {opt.image && (
          <img
            src={opt.image}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        )}

        {/* LABEL */}
        <span className="flex-1">{opt.label}</span>
      </div>
    );
  })
) : (
  <p className="px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
    No results found
  </p>
)}

        {footer && <div className="px-4 py-2">{footer}</div>}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && usePortal && ref.current) {
            // Compute position synchronously BEFORE opening to avoid first-render blink
            const r = ref.current.getBoundingClientRect();
            setPortalStyle({
              position: "fixed",
              top: r.bottom + 4,
              left: r.left,
              width: r.width,
              zIndex: 9999,
            });
          }
          setOpen(!open);
        }}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border text-sm transition
          ${error ? "border-red-500  dark:border-red-500" : "border-gray-300 dark:border-gray-700"}
          ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
              : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          }
        `}
      >
        <span
          className={`flex items-center gap-2 ${
            selectedOption
              ? "text-gray-800 dark:text-gray-200"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selectedOption?.image && (
            <img
              src={selectedOption.image}
              alt=""
              className="w-6 h-6 rounded-full object-cover "
            />
          )}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}

      {open &&
        (usePortal
          ? createPortal(renderDropdown, document.body)
          : renderDropdown)}
    </div>
  );
}