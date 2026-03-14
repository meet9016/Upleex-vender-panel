import React from "react";

type StatusBadgeProps = {
  status: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  approved:  { label: "Approved",  className: "text-green-700 bg-green-50 border-green-200" },
  approval:  { label: "Approved",  className: "text-green-700 bg-green-50 border-green-200" },
  active:    { label: "Active",    className: "text-green-700 bg-green-50 border-green-200" },
  rejected:  { label: "Rejected",  className: "text-rose-700 bg-rose-50 border-rose-200" },
  reject:    { label: "Rejected",  className: "text-rose-700 bg-rose-50 border-rose-200" },
  inactive:  { label: "Inactive",  className: "text-gray-600 bg-gray-100 border-gray-200" },
  completed: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  complete:  { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  pending:   { label: "Pending",   className: "text-amber-700 bg-amber-50 border-amber-200" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase();
  const config = STATUS_MAP[key] ?? STATUS_MAP["pending"];
  const { label, className } = config;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}