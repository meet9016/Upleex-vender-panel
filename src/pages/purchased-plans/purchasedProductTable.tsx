"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Package,
  Layers,
  Zap,
  Rocket,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  ImageOff,
  Tag,
  Calendar,
  IndianRupee,
  FileText,
  Printer
} from "lucide-react";
import AgGridTable from "@/components/tables/AgGridTable";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PlanSource = "Base Listing" | "Priority" | "Rental Boost" | "General Plan";

type ProductItem = {
  _id?: string;
  id?: string;
  product_name?: string;
  name?: string;
  slug?: string;
  product_main_image?: string;
  category_name?: string;
  sub_category_name?: string;
  price?: number | string;
  approval_status?: string;
};

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
  raw_products?: ProductItem[];
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
  {
    icon: React.ReactNode;
    bg: string;
    text: string;
    dot: string;
    tabColor: string;
    gradient: string;
  }
> = {
  "Base Listing": {
    icon: <Layers className="w-3.5 h-3.5" />,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    tabColor: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  Priority: {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    tabColor: "text-amber-600",
    gradient: "from-amber-500 to-orange-500",
  },
  "Rental Boost": {
    icon: <Zap className="w-3.5 h-3.5" />,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    tabColor: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-500",
  },
  "General Plan": {
    icon: <Rocket className="w-3.5 h-3.5" />,
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    tabColor: "text-purple-600",
    gradient: "from-purple-500 to-indigo-600",
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
  <div
    className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm ${accent}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl text-gray-900 dark:text-gray-100 leading-none">
          {value}
        </p>
        {sub && (
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            {sub}
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
    </div>
    <div
      className={`absolute bottom-0 left-0 right-0 h-0.5 ${
        accent.includes("blue")
          ? "bg-blue-400"
          : accent.includes("green")
          ? "bg-green-400"
          : accent.includes("amber")
          ? "bg-amber-400"
          : "bg-gray-300"
      }`}
    />
  </div>
);

// ─────────────────────────────────────────────
// Source Badge
// ─────────────────────────────────────────────
const SourceBadge = ({ source }: { source: PlanSource }) => {
  const cfg = PLAN_CONFIG[source];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      {source}
    </span>
  );
};

// ─────────────────────────────────────────────
// Product Card (inside modal)
// ─────────────────────────────────────────────
const ProductCard = ({ product }: { product: ProductItem }) => {
  console.log("ProductCard rendering product:", product);
  const name =
    product.product_name ||
    product.name ||
    formatSlug(product.slug || "") ||
    "Unknown Product";
  const image = product.product_main_image || product.image;
  const category = product.category_name;
  const subCategory = product.sub_category_name;
  const price = product.price;
  const productType = (product as any).product_type_name;
  const status = product.approval_status;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm text-gray-900 dark:text-gray-100 truncate"
          title={name}
        >
          {name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {category && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {category}
              {subCategory ? ` / ${subCategory}` : ""}
            </span>
          )}
          {productType && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                productType.toLowerCase() === "sell"
                  ? "text-blue-600 bg-blue-50"
                  : "text-green-600 bg-green-50"
              }`}
            >
              {productType}
            </span>
          )}
          {price !== undefined && price !== null && Number(price) > 0 && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
              <IndianRupee className="w-2.5 h-2.5" />
              {Number(price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="flex-shrink-0">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// View Modal
// ─────────────────────────────────────────────
const PlanViewModal = ({
  plan,
  onClose,
}: {
  plan: PlanRow & Record<string, any>;
  onClose: () => void;
}) => {
  const cfg = PLAN_CONFIG[plan.plan_source];

  // Determine products to display
  let productsToDisplay: ProductItem[] = [];

  if (Array.isArray(plan.raw_products) && plan.raw_products.length > 0) {
    productsToDisplay = plan.raw_products;
  } else if (Array.isArray(plan.product_ids) && plan.product_ids.length > 0) {
    // If raw_products is empty but product_ids has items, use them directly
    productsToDisplay = plan.product_ids.filter(
      (p) => typeof p === "object" && p !== null
    ) as ProductItem[];
  }

  const hasProducts = productsToDisplay.length > 0;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200">
        {/* ── Header ── */}
        <div className={`px-6 py-5 flex items-center justify-between flex-shrink-0 bg-gradient-to-r ${cfg.gradient} border-b border-transparent`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30`}
            >
              <span className="text-white scale-150 drop-shadow-sm">{cfg.icon}</span>
            </div>
            <div>
              <p className="text-white/80 text-xs uppercase tracking-wider font-medium">
                {plan.plan_source}
              </p>
              <h3 className="text-white text-xl font-bold leading-tight capitalize drop-shadow-sm">
                {plan.plan_name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <StatusBadge
              status={plan.is_expired ? "expired" : plan.status || "active"}
            />
            {(() => {
              const displayValue = plan.plan_source === "Priority" ? plan.plan_name : plan.plan_type;
              if (!displayValue) return null;
              return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text} capitalize border border-current shadow-sm`}>
                  {plan.plan_source === "Priority" ? displayValue : formatSlug(displayValue)}
                </span>
              );
            })()}
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Amount Paid
              </p>
              <p className="text-2xl text-gray-900 dark:text-white">
                ₹
                {Number(
                  plan.total_amount !== undefined && plan.total_amount !== null
                    ? plan.total_amount
                    : plan.amount
                ).toLocaleString("en-IN")}
              </p>
            </div>
            {plan.max_products !== undefined && (
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Products
                </p>
                <p className="text-base text-gray-900 dark:text-white">
                  {plan.products_used ?? 0}
                  <span className="text-base text-gray-400">
                    /{plan.max_products}
                  </span>
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cfg.dot} opacity-90`}
                    style={{
                      width: `${Math.min(
                        100,
                        ((plan.products_used ?? 0) / plan.max_products) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Duration
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span className="text-gray-800 dark:text-gray-200">
                    Start: {formatDate(plan.start_at)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    plan.is_expired ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {plan.is_expired ? (
                    <XCircle className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-500" />
                  )}
                  <span
                    className={
                      plan.is_expired ? "" : "text-gray-800 dark:text-gray-200"
                    }
                  >
                    Expiry: {formatDate(plan.expire_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GST and Total Amount */}
          {(plan.gst_amount !== undefined && plan.gst_amount !== null) ||
          (plan.total_amount !== undefined && plan.total_amount !== null) ? (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Amount Breakdown
              </p>
              <div className="space-y-2">
                {plan.amount !== undefined &&
                (plan.amount !== null || plan.amount !== 0) ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Plan Amount
                    </span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      ₹{plan.amount}
                    </span>
                  </div>
                ) : null}

                {plan.gst_amount !== undefined && plan.gst_amount !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      GST Amount
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      ₹{Number(plan.gst_amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {/* Also show Amount Paid for clarity */}
                {plan.total_amount !== undefined &&
                plan.total_amount !== null && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      Total Amount
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      ₹{Number(plan.total_amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Products section */}
          {hasProducts ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Linked Products
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">
                    {productsToDisplay.length}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productsToDisplay.map((p, i) => (
                  <ProductCard key={p._id || p.id || i} product={p} />
                ))}
              </div>
            </div>
          ) : plan.product_names && plan.product_names !== "—" ? (
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-4">
              <p className="text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3 h-3" /> Products
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                {plan.product_names}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-5 flex flex-col items-center gap-2 text-gray-400">
              <Package className="w-8 h-8 opacity-40" />
              <p className="text-sm">No products linked to this plan</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Invoice Modal
// ─────────────────────────────────────────────
const InvoiceModal = ({ data, vendorKyc, onClose }: { data: PlanRow[]; vendorKyc: any; onClose: () => void }) => {
  const [downloading, setDownloading] = useState(false);

  if (!data || data.length === 0) return null;

  const handlePrint = async () => {
    try {
      setDownloading(true);
      const payload = {
        data: data.map((item, index) => ({
          id: index === 0 ? (item.id || item._id) : undefined,
          items: [{
            productName: `${item.plan_name} Plan`,
            productTypeName: item.plan_source,
            price: Number(item.amount) || 0,
            quantity: 1,
            totalPrice: Number(item.total_amount) || Number(item.amount) || 0,
            gstAmount: Number(item.gst_amount) || 0
          }],
          totalAmount: data.reduce((sum, i) => sum + (Number(i.total_amount) || Number(i.amount) || 0), 0)
        }))[0],
        vendorProfile: {
          businessName: vendorKyc?.Identity?.business_name,
          email: vendorKyc?.ContactDetails?.email,
          mobile: vendorKyc?.ContactDetails?.mobile,
          address: vendorKyc?.ContactDetails?.address,
          city: vendorKyc?.ContactDetails?.city_name,
          state: vendorKyc?.ContactDetails?.state_name,
          pincode: vendorKyc?.ContactDetails?.pincode,
          gstNumber: vendorKyc?.Identity?.gst_number,
          businessLogo: vendorKyc?.Documents?.business_logo_image,
        },
        type: 'plan' // Important flag to branch in backend!
      };

      // Since we want multiple plans in one invoice, adjust payload
      payload.data.items = data.map(item => ({
        productName: `${item.plan_name} Plan`,
        productTypeName: item.plan_source,
        price: Number(item.amount) || 0,
        quantity: 1,
        totalPrice: Number(item.total_amount) || Number(item.amount) || 0,
        gstAmount: Number(item.gst_amount) || 0
      }));

      const response = await api.post('/invoice/pdf', payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const billNo = parseInt(String(data[0].id || data[0]._id).slice(-6), 16) || Math.floor(Math.random() * 1000000);
      link.setAttribute('download', `Invoice-${billNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const totalAmount = data.reduce((sum, item) => sum + (Number(item.total_amount) || Number(item.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:p-0">
      <div className="bg-white text-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible shadow-2xl rounded-2xl print:rounded-none relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full hover:text-slate-800 transition-all print:hidden">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 print:p-4 relative flex-1 bg-white">
          {vendorKyc?.Documents?.business_logo_image && (
            <div className="absolute top-8 left-8 print:top-4 print:left-4">
              <img src={vendorKyc.Documents.business_logo_image} alt="Business Logo" className="h-16 object-contain" />
            </div>
          )}
          
          <div className="absolute top-10 right-16 print:top-4 print:right-4">
            <img src="/images/logo/logo.webp" alt="Upleex Logo" className="h-14 object-contain" />
          </div>

          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 print:text-black">|| Shree Ganeshay Namah ||</p>
            <h1 className="text-4xl font-black uppercase mt-2 tracking-tight text-slate-800 print:text-black">INVOICE</h1>
            <div className="text-sm mt-3 uppercase text-center max-w-2xl mx-auto text-slate-600 print:text-black leading-relaxed">
              {vendorKyc?.ContactDetails?.address && (
                <>{vendorKyc.ContactDetails.address}, <br /></>
              )}
              {vendorKyc?.ContactDetails?.city_name || 'SURAT'}-{vendorKyc?.ContactDetails?.pincode || '395010'}, {vendorKyc?.ContactDetails?.state_name || 'GUJARAT'} 
            </div>
          </div>

          <div className="flex justify-between border-y border-slate-200 print:border-black py-4 mb-8 text-sm bg-slate-50 print:bg-transparent px-6 rounded-xl print:rounded-none">
            <div className="space-y-1">
              <p><span className="text-slate-500 print:text-black font-medium">Customer :</span> <span className="font-bold text-slate-800 print:text-black uppercase">{vendorKyc?.Identity?.business_name || 'VENDOR'}</span></p>
              <p><span className="text-slate-500 print:text-black font-medium">Mob.No. :</span> <span className="text-slate-700 print:text-black font-medium">{vendorKyc?.ContactDetails?.mobile || 'N/A'}</span></p>
            </div>
            <div className="text-right space-y-1">
              <p><span className="text-slate-500 print:text-black font-medium">Bill No:</span> <span className="font-bold text-slate-800 print:text-black">{parseInt(String(data[0].id || data[0]._id).slice(-6), 16) || Math.floor(Math.random() * 1000000)}</span></p>
              <p><span className="text-slate-500 print:text-black font-medium">Date :</span> <span className="text-slate-700 print:text-black font-medium">{new Date().toLocaleDateString("en-GB")}</span></p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 print:border-black print:rounded-none">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100 print:bg-transparent">
                <tr className="border-b border-slate-200 print:border-black text-slate-600 print:text-black uppercase text-xs font-bold tracking-wider">
                  <th className="border-r border-slate-200 print:border-black p-3 text-left w-12">No.</th>
                  <th className="border-r border-slate-200 print:border-black p-3 text-left">Description</th>
                  <th className="border-r border-slate-200 print:border-black p-3 text-center w-24">Type</th>
                  <th className="border-r border-slate-200 print:border-black p-3 text-right w-24">Rate</th>
                  <th className="border-r border-slate-200 print:border-black p-3 text-right w-24">Tax GST</th>
                  <th className="p-3 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 print:text-black bg-white">
                {data.map((item, index) => {
                  const total = Number(item.total_amount) || Number(item.amount) || 0;
                  const gst = Number(item.gst_amount) || 0;
                  const rate = total - gst;
                  return (
                    <tr key={index} className="border-b border-slate-200 print:border-black hover:bg-slate-50 print:hover:bg-transparent transition-colors">
                      <td className="border-r border-slate-200 print:border-black p-3">{index + 1}</td>
                      <td className="border-r border-slate-200 print:border-black p-3 font-medium text-slate-900 print:text-black">{item.plan_name} Plan</td>
                      <td className="border-r border-slate-200 print:border-black p-3 text-center text-slate-500 print:text-black">{item.plan_source}</td>
                      <td className="border-r border-slate-200 print:border-black p-3 text-right">{rate.toFixed(2)}</td>
                      <td className="border-r border-slate-200 print:border-black p-3 text-right">{gst.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-slate-900 print:text-black">{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 print:bg-transparent">
                  <td colSpan={5} className="border-r border-t border-slate-200 print:border-black p-4 text-right font-bold text-slate-600 print:text-black uppercase text-xs tracking-wider">Bill Total Amount :</td>
                  <td className="border-t border-slate-200 print:border-black p-4 text-right font-black text-indigo-600 print:text-black text-base">{totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between text-xs mt-10 text-slate-500 print:text-black">
            <div className="space-y-1">
              <p className="flex items-center gap-2"><span className="text-slate-400">•</span> Goods Once Sold will not be Refunded.</p>
              <p className="flex items-center gap-2"><span className="text-slate-400">•</span> No Guarantee for Cloth, Colour & Work.</p>
              <p className="font-semibold text-slate-700 print:text-black mt-2">SUBJECT TO SURAT JURISDICTION</p>
            </div>
            <div className="text-right pt-6 border-t-2 border-slate-200 print:border-black w-48 mt-4">
              <p className="font-bold text-slate-800 print:text-black uppercase tracking-wider">For, UPLEEX</p>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md p-5 border-t border-slate-100 print:hidden flex justify-end z-10 rounded-b-2xl">
          <button onClick={handlePrint} disabled={downloading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all font-semibold active:scale-95">
            <Printer className="w-4 h-4" /> {downloading ? "Downloading PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
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
  const [selectedRows, setSelectedRows] = useState<PlanRow[]>([]);
  const [invoiceData, setInvoiceData] = useState<PlanRow[] | null>(null);
  const [vendorKyc, setVendorKyc] = useState<any>(null);
  const { setBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([{ label: "Purchased Plans" }]);
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [listingRes, priorityRes, boostRes, generalRes, kycRes] =
          await Promise.allSettled([
            api.get(endPointApi.getVendorListingPurchases),
            api.get(endPointApi.getVendorPriorityPurchases),
            api.get(endPointApi.getVendorRentalBoostPurchases),
            api.get(endPointApi.getVendorGeneralPurchases),
            api.post(endPointApi.postFetchVendorKYCFormData as string),
          ]);

        if (kycRes.status === "fulfilled") {
          setVendorKyc(kycRes.value?.data?.data || kycRes.value?.data || null);
        }

        const allRows: PlanRow[] = [];

        const pushRows = (
          res: PromiseSettledResult<any>,
          source: PlanSource,
          nameBuilder: (item: any) => string
        ) => {
          if (res.status !== "fulfilled") return;
          const data: any[] =
            res.value?.data?.data || res.value?.data || [];
          data.forEach((item: any) => {
            console.log(`pushRows: Processing ${source} item`, item);
            const expireAt =
              item.expire_at || item.expiry_date || item.expires_at || "";
            const isExpired = expireAt
              ? new Date(expireAt) < new Date()
              : false;

            // Collect raw product objects if available
            const rawProducts: ProductItem[] = [];
            if (Array.isArray(item.product_ids)) {
              console.log(
                `pushRows: item.product_ids exists`,
                item.product_ids
              );
              item.product_ids.forEach((p: any) => {
                if (typeof p === "object" && p !== null) {
                  rawProducts.push(p as ProductItem);
                }
              });
            }
            // Also check if there are nested product objects under other keys
            if (Array.isArray(item.products)) {
              console.log(
                `pushRows: item.products exists`,
                item.products
              );
              item.products.forEach((p: any) => {
                if (typeof p === "object" && p !== null) {
                  rawProducts.push(p as ProductItem);
                }
              });
            }

            console.log(`pushRows: rawProducts collected`, rawProducts);

            allRows.push({
              ...item, // Spread all API data
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
                : Array.isArray(item.products)
                ? item.products.length
                : undefined,
              product_names: extractProductNames(
                item.product_ids || item.products || []
              ),
              raw_products: rawProducts,
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
              ? `${formatSlug(i.plan_type || i.plan_name)}`
              : "Priority Plan"
        );
        pushRows(
          boostRes,
          "Rental Boost",
          (i) =>
            i.plan_name || i.plan_type
              ? `${formatSlug(i.plan_type || i.plan_name)}`
              : "Rental Boost"
        );
        pushRows(
          generalRes,
          "General Plan",
          (i) =>
            i.plan_type
              ? `${formatSlug(i.plan_type)}`
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
    const base = {
      "Base Listing": 0,
      Priority: 0,
      "Rental Boost": 0,
      "General Plan": 0,
    } as Record<PlanSource, number>;
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
    {
      key: "Base Listing" as const,
      label: "Base Listing",
      count: counts["Base Listing"],
    },
    { key: "Priority" as const, label: "Priority", count: counts["Priority"] },
    {
      key: "Rental Boost" as const,
      label: "Rental Boost",
      count: counts["Rental Boost"],
    },
    {
      key: "General Plan" as const,
      label: "General Plan",
      count: counts["General Plan"],
    },
  ];

  const columns = useMemo(() => [
    {
      field: "plan_source",
      headerName: "Plan Type",
      width: 160,
      cellRenderer: (params: any) => <SourceBadge source={params.value} />
    },
    {
      field: "plan_name",
      headerName: "Plan Name",
      width: 180,
      cellRenderer: (params: any) => <span className="capitalize">{params.value}</span>
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      cellRenderer: (params: any) => `₹${Number(params.value).toLocaleString("en-IN")}`
    },
    {
      headerName: "Products",
      width: 150,
      cellRenderer: (params: any) => {
        const row = params.data;
        const cfg = PLAN_CONFIG[row.plan_source];
        if (row.max_products !== undefined) {
          return (
            <div className="flex flex-col justify-center gap-0.5 w-full pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {row.products_used ?? 0}
                  <span className="text-gray-400">/{row.max_products}</span>
                </span>
              </div>
              <div className="h-1 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.dot} opacity-80`}
                  style={{
                    width: `${Math.min(100, ((row.products_used ?? 0) / row.max_products) * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        } else if (row.products_used !== undefined) {
          return <span className="text-xs text-gray-500 pt-3 inline-block">{row.products_used} products</span>;
        }
        return <span className="text-xs text-gray-400 pt-3 inline-block">—</span>;
      }
    },
    {
      field: "start_at",
      headerName: "Start Date",
      width: 160,
      cellRenderer: (params: any) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
          {formatDate(params.value)}
        </span>
      )
    },
    {
      field: "expire_at",
      headerName: "Expiry",
      width: 160,
      cellRenderer: (params: any) => {
        const row = params.data;
        return (
          <span className={`text-xs flex items-center gap-1.5 ${row.is_expired ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
            {row.is_expired ? <XCircle className="w-3 h-3 flex-shrink-0" /> : <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-500" />}
            {formatDate(params.value)}
          </span>
        );
      }
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (params: any) => (
        <StatusBadge status={params.data.is_expired ? "expired" : params.value || "active"} />
      )
    },
    {
      headerName: "Action",
      width: 140,
      pinned: "right",
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-2 h-full">
          <button
            onClick={() => setViewPlan(params.data)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-brand-600 bg-brand-50 hover:bg-brand-100 hover:text-brand-700 transition-all duration-300 shadow-sm"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setInvoiceData([params.data])}
            className="w-8 h-8 flex items-center justify-center rounded-md text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-300 shadow-sm"
            title="View Bill"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-7 px-0">
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
            <span>
              <span className="text-gray-900 dark:text-gray-100">
                {activePlans}
              </span>{" "}
              active plans
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>
              <span className="text-gray-900 dark:text-gray-100">
                {rows.length - activePlans}
              </span>{" "}
              expired
            </span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Total Spent:{" "}
            <span className="text-brand-600 dark:text-brand-400">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const cfg =
            tab.key !== "all" ? PLAN_CONFIG[tab.key as PlanSource] : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border transition-all duration-200 ${
                isActive
                  ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-md"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              {cfg && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-white" : cfg.dot
                  }`}
                />
              )}
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
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
          <p className="text-sm text-gray-400">Loading plans...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm">No plans found</p>
          <p className="text-xs opacity-60">Purchase a plan to see it here</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900 p-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setInvoiceData(selectedRows)}
              disabled={selectedRows.length === 0}
              className={`px-4 py-2 flex items-center rounded-md text-sm font-medium transition-all ${
                selectedRows.length > 0
                  ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Report ({selectedRows.length})
            </button>
          </div>
          <AgGridTable
            rowData={filtered}
            columns={columns}
            loading={loading}
            showCheckboxes={true}
            onSelectionChange={(rows) => setSelectedRows(rows)}
            autoHeight={true}
          />
        </div>
      )}

      {/* ── View Modal ── */}
      {viewPlan && (
        <PlanViewModal
          plan={viewPlan}
          onClose={() => setViewPlan(null)}
        />
      )}

      {/* ── Invoice Modal ── */}
      {invoiceData && (
        <InvoiceModal
          data={invoiceData}
          vendorKyc={vendorKyc}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </div>
  );
}
