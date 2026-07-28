import React from "react";

type StatusBadgeProps = {
  status: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  approval: { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  active: { label: "Active", className: "text-green-700 bg-green-50 border-green-200" },
  rejected: { label: "Rejected", className: "text-rose-700 bg-rose-50 border-rose-200" },
  reject: { label: "Rejected", className: "text-rose-700 bg-rose-50 border-rose-200" },
  inactive: { label: "Inactive", className: "text-gray-600 bg-gray-100 border-gray-200" },
  completed: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  complete: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  pending: { label: "Pending", className: "text-amber-700 bg-amber-50 border-amber-200" },
  draft: { label: "Draft", className: "text-gray-600 bg-gray-100 border-gray-200" },
  new: { label: "New", className: "text-green-700 bg-green-50 border-green-200" },
  successful: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  success: { label: "Completed", className: "text-blue-700 bg-blue-50 border-blue-200" },
  delivery: { label: "In Delivery", className: "text-purple-700 bg-purple-50 border-purple-200" },
  accepted: { label: "Accepted", className: "text-blue-700 bg-blue-50 border-blue-200" },
  preparing: { label: "Preparing", className: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  ready_for_pickup: { label: "Ready for Pickup", className: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  picked_up: { label: "Picked Up", className: "text-teal-700 bg-teal-50 border-teal-200" },
  out_for_delivery: { label: "Out for Delivery", className: "text-orange-700 bg-orange-50 border-orange-200" },
  delivered: { label: "Delivered", className: "text-green-700 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelled", className: "text-rose-700 bg-rose-50 border-rose-200" },
  free: { label: "Free", className: "text-green-700 bg-green-50 border-green-200" },
  paid: { label: "Paid", className: "text-blue-700 bg-blue-50 border-blue-200" },
  hold: { label: "Payment Hold", className: "text-amber-700 bg-amber-50 border-amber-200" },
  '30 percent': { label: "30% Advance", className: "text-purple-700 bg-purple-50 border-purple-200" },
  full: { label: "Full Payment", className: "text-blue-700 bg-blue-50 border-blue-200" },
  failed: { label: "Failed", className: "text-rose-700 bg-rose-50 border-rose-200" },
  released: { label: "Released", className: "text-blue-700 bg-blue-50 border-blue-200" },
  'ready to ship': { label: "Ready to Ship", className: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  'label generated': { label: "Label Generated", className: "text-sky-700 bg-sky-50 border-sky-200" },
  'pickup scheduled': { label: "Pickup Scheduled", className: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  'pickup generated': { label: "Pickup Generated", className: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  'in transit': { label: "In Transit", className: "text-violet-700 bg-violet-50 border-violet-200" },
  'rto initiated': { label: "RTO Initiated", className: "text-amber-700 bg-amber-50 border-amber-200" },
  'rto delivered': { label: "RTO Delivered", className: "text-orange-700 bg-orange-50 border-orange-200" },
  'undelivered': { label: "Undelivered", className: "text-rose-700 bg-rose-50 border-rose-200" },
  'lost': { label: "Lost", className: "text-red-700 bg-red-50 border-red-200" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase().replace(/_/g, ' ');
  const config = STATUS_MAP[key] ?? { label: status || "Pending", className: "text-gray-600 bg-gray-100 border-gray-200" };
  const { label, className } = config;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium border leading-none whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}