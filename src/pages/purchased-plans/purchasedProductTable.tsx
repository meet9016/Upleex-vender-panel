"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import StatusBadge from "@/components/common/StatusBadge";
import { Package, Layers, Zap, Rocket, TrendingUp, CheckCircle2, Clock, XCircle, Eye, X } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PlanSource = "Base Listing" | "Priority" | "Rental Boost" | "General Plan";

type PlanRow = {
  id: string;
  plan_source: PlanSource;
  plan_name: string;
  plan_type?: string;
  amount: number;
  max_products?: number;
  start_at: string;
  expire_at: string;
  is_expired: boolean;
  status: string;
  products_used?: number;
  product_names?: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatDate = (val: string) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSlug = (str: string) => {
  if (!str) return "";
  return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const extractProductNames = (productIds: any[]): string => {
  if (!Array.isArray(productIds) || productIds.length === 0) return "—";
  const names = productIds
    .map((p: any) => {
      const name = typeof p === "object" ? p?.product_name || p?.name || p?.slug || "" : String(p);
      return formatSlug(name);
    })
    .filter(Boolean);
  return names.length ? names.join(", ") : "—";
};

// ─────────────────────────────────────────────
// Plan Source Config
// ─────────────────────────────────────────────
const PLAN_CONFIG: Record<
  PlanSource,
  { icon: React.ReactNode; bg: string; text: string; dot: string; tabColor: string }
> = {
  "Base Listing": {
    icon: <Layers className="w-3.5 h-3.5" />,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    tabColor: "text-blue-600",
  },
  Priority: {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    tabColor: "text-amber-600",
  },
  "Rental Boost": {
    icon: <Zap className="w-3.5 h-3.5" />,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    tabColor: "text-emerald-600",
  },
  "General Plan": {
    icon: <Rocket className="w-3.5 h-3.5" />,
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    tabColor: "text-purple-600",
  },
};

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}) => (
  <div className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm ${accent}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
          {value}
        </p>
        {sub && (
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
    </div>
    {/* Decorative accent line */}
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.includes("blue") ? "bg-blue-400" : accent.includes("green") ? "bg-green-400" : accent.includes("amber") ? "bg-amber-400" : "bg-gray-300"}`} />
  </div>
);

// ─────────────────────────────────────────────
// Source Badge
// ─────────────────────────────────────────────
const SourceBadge = ({ source }: { source: PlanSource }) => {
  const cfg = PLAN_CONFIG[source];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {source}
    </span>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function PurchasedProductsPage() {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | PlanSource>("all");
  const [viewPlan, setViewPlan] = useState<PlanRow | null>(null);
  const { setBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([{ label: "Purchased Plans" }]);
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [listingRes, priorityRes, boostRes, generalRes] =
          await Promise.allSettled([
            api.get(endPointApi.getVendorListingPurchases),
            api.get(endPointApi.getVendorPriorityPurchases),
            api.get(endPointApi.getVendorRentalBoostPurchases),
            api.get(endPointApi.getVendorGeneralPurchases),
          ]);

        const allRows: PlanRow[] = [];

        const pushRows = (
          res: PromiseSettledResult<any>,
          source: PlanSource,
          nameBuilder: (item: any) => string
        ) => {
          if (res.status !== "fulfilled") return;
          const data: any[] = res.value?.data?.data || res.value?.data || [];
          data.forEach((item: any) => {
            const expireAt =
              item.expire_at || item.expiry_date || item.expires_at || "";
            const isExpired = expireAt
              ? new Date(expireAt) < new Date()
              : false;
            allRows.push({
              id: item._id || item.id,
              plan_source: source,
              plan_name: nameBuilder(item),
              plan_type: item.plan_type,
              amount: item.amount || item.price || 0,
              max_products: item.max_products,
              start_at:
                item.start_at ||
                item.createdAt ||
                item.created_at ||
                "",
              expire_at: expireAt,
              is_expired: isExpired,
              status: item.status || (isExpired ? "expired" : "active"),
              products_used: Array.isArray(item.product_ids)
                ? item.product_ids.length
                : undefined,
              product_names: extractProductNames(item.product_ids || []),
            });
          });
        };

        pushRows(
          listingRes,
          "Base Listing",
          (i) => formatSlug(i.plan_name || i.plan_type || "Listing Plan")
        );
        pushRows(
          priorityRes,
          "Priority",
          (i) =>
            i.plan_name || i.plan_type
              ? `Priority • ${formatSlug(i.plan_type || i.plan_name)}`
              : "Priority Plan"
        );
        pushRows(
          boostRes,
          "Rental Boost",
          (i) =>
            i.plan_name || i.plan_type
              ? `Boost • ${formatSlug(i.plan_type || i.plan_name)}`
              : "Rental Boost"
        );
        pushRows(
          generalRes,
          "General Plan",
          (i) =>
            i.plan_type
              ? `General • ${formatSlug(i.plan_type)}`
              : "General Plan"
        );

        allRows.sort(
          (a, b) =>
            new Date(b.start_at || 0).getTime() -
            new Date(a.start_at || 0).getTime()
        );

        setRows(allRows);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Derived counts ──
  const counts = useMemo(() => {
    const base = { "Base Listing": 0, Priority: 0, "Rental Boost": 0, "General Plan": 0 } as Record<PlanSource, number>;
    rows.forEach((r) => base[r.plan_source]++);
    return base;
  }, [rows]);

  const activePlans = rows.filter((r) => !r.is_expired).length;
  const totalSpent = rows.reduce((s, r) => s + r.amount, 0);

  const filtered = useMemo(() => {
    if (activeTab === "all") return rows;
    return rows.filter((r) => r.plan_source === activeTab);
  }, [rows, activeTab]);

  // ── Tab definitions ──
  const tabs = [
    { key: "all" as const, label: "All Plans", count: rows.length },
    { key: "Base Listing" as const, label: "Base Listing", count: counts["Base Listing"] },
    { key: "Priority" as const, label: "Priority", count: counts["Priority"] },
    { key: "Rental Boost" as const, label: "Rental Boost", count: counts["Rental Boost"] },
    { key: "General Plan" as const, label: "General Plan", count: counts["General Plan"] },
  ];

  return (
    <div className="space-y-7 px-0">
      {/* ── Header Banner ── */}
      {/* <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Purchased Plans
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              All your active &amp; past plan purchases across all plan types
            </p>
          </div>
        </div>
      </div> */}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Plans"
          value={rows.length}
          icon={<Package className="w-5 h-5" />}
          accent="border-gray-200 dark:border-gray-700"
          sub={`${activePlans} currently active`}
        />
        <StatCard
          label="Base Listing"
          value={counts["Base Listing"]}
          icon={<Layers className="w-5 h-5 text-blue-500" />}
          accent="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          label="Priority Plans"
          value={counts["Priority"]}
          icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
          accent="border-amber-200 dark:border-amber-800"
        />
        <StatCard
          label="Rental Boost"
          value={counts["Rental Boost"]}
          icon={<Zap className="w-5 h-5 text-emerald-500" />}
          accent="border-emerald-200 dark:border-emerald-800"
        />
        <StatCard
          label="General Plans"
          value={counts["General Plan"]}
          icon={<Rocket className="w-5 h-5 text-purple-500" />}
          accent="border-purple-200 dark:border-purple-800"
        />
      </div>

      {/* ── Total spent strip ── */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span><span className="font-bold text-gray-900 dark:text-gray-100">{activePlans}</span> active plans</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span><span className="font-bold text-gray-900 dark:text-gray-100">{rows.length - activePlans}</span> expired</span>
          </div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Total Spent: <span className="text-brand-600 dark:text-brand-400">₹{totalSpent.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const cfg = tab.key !== "all" ? PLAN_CONFIG[tab.key as PlanSource] : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                isActive
                  ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-md"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              {cfg && (
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : cfg.dot}`} />
              )}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table / Empty ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-brand-600" />
          <p className="text-sm text-gray-400 font-medium">Loading plans...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-semibold">No plans found</p>
          <p className="text-xs opacity-60">Purchase a plan to see it here</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
          {/* Table header */}
          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_1fr_1fr_0.8fr_0.5fr] gap-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {["Plan Type", "Plan Name", "Amount", "Products", "Start Date", "Expiry", "Status", "Action"].map((h) => (
              <div key={h} className={`px-4 py-3.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${h === 'Action' ? 'text-center' : ''}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((row, idx) => {
              const cfg = PLAN_CONFIG[row.plan_source];
              return (
                <div
                  key={`${row.id}-${idx}`}
                  className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_1fr_1fr_0.8fr_0.5fr] gap-0 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors duration-150"
                >
                  {/* Plan Type */}
                  <div className="px-4 py-4 flex items-center">
                    <SourceBadge source={row.plan_source} />
                  </div>

                  {/* Plan Name */}
                  <div className="px-4 py-4 flex items-center">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 capitalize">
                      {row.plan_name}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="px-4 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      ₹{Number(row.amount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Products used / max */}
                  <div className="px-4 py-4 flex flex-col justify-center gap-0.5">
                    {row.max_products !== undefined ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {row.products_used ?? 0}
                            <span className="font-normal text-gray-400">/{row.max_products}</span>
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="h-1 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.dot} opacity-80`}
                            style={{ width: `${Math.min(100, ((row.products_used ?? 0) / row.max_products) * 100)}%` }}
                          />
                        </div>
                      </>
                    ) : row.products_used !== undefined ? (
                      <span className="text-xs text-gray-500">{row.products_used} product(s)</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                    {row.product_names && row.product_names !== "—" && (
                      <span
                        className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[160px]"
                        title={row.product_names}
                      >
                        {row.product_names}
                      </span>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="px-4 py-4 flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
                      {formatDate(row.start_at)}
                    </span>
                  </div>

                  {/* Expiry Date */}
                  <div className="px-4 py-4 flex items-center">
                    <span className={`text-xs flex items-center gap-1.5 font-medium ${row.is_expired ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                      {row.is_expired
                        ? <XCircle className="w-3 h-3 flex-shrink-0" />
                        : <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-500" />
                      }
                      {formatDate(row.expire_at)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="px-4 py-4 flex items-center">
                    <StatusBadge status={row.is_expired ? "expired" : row.status || "active"} />
                  </div>
                  
                  {/* Action */}
                  <div className="px-4 py-4 flex items-center justify-center">
                    <button
                      onClick={() => setViewPlan(row)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-brand-600 bg-brand-50 hover:bg-brand-100 hover:text-brand-700 transition-all duration-300 group shadow-sm"
                      title="View Details"
                    >
                      <Eye className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {viewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plan Details</h3>
              <button 
                onClick={() => setViewPlan(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center gap-3">
                <SourceBadge source={viewPlan.plan_source} />
                <StatusBadge status={viewPlan.is_expired ? "expired" : viewPlan.status || "active"} />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Amount Paid</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">₹{Number(viewPlan.amount).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Products Used</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">
                      {viewPlan.max_products !== undefined ? `${viewPlan.products_used ?? 0}/${viewPlan.max_products}` : (viewPlan.products_used ?? "N/A")}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="flex justify-between p-3.5 bg-gray-50/50 dark:bg-gray-800/30">
                    <span className="text-sm text-gray-500">Plan Name</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{viewPlan.plan_name}</span>
                  </div>
                  <div className="flex justify-between p-3.5 bg-white dark:bg-gray-900">
                    <span className="text-sm text-gray-500">Start Date</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(viewPlan.start_at)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5 bg-gray-50/50 dark:bg-gray-800/30">
                    <span className="text-sm text-gray-500">Expiry Date</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {viewPlan.is_expired ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                      {formatDate(viewPlan.expire_at)}
                    </span>
                  </div>
                  {viewPlan.plan_type && (
                    <div className="flex justify-between p-3.5 bg-white dark:bg-gray-900">
                      <span className="text-sm text-gray-500">Plan Tier</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{viewPlan.plan_type}</span>
                    </div>
                  )}
                </div>

                {viewPlan.product_names && viewPlan.product_names !== "—" && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">Product Name(s)</p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{viewPlan.product_names}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
              <button 
                onClick={() => setViewPlan(null)}
                className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
