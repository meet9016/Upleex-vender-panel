"use client";

import React, { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/button/Button";
import { Wallet, Package, Search, Check, Rocket } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useWallet } from "@/context/WalletContext";
import { useFilter } from "@/context/FilterContext";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import BoosterPlanView from "./BoosterPlanView";
import ListingPlanView from "./ListingPlanView";
import ServicePlanView from "./ServicePlanView";
import ServicePriorityPlanView from "./ServicePriorityPlanView";
import { Briefcase, Zap } from "lucide-react";

interface PriorityPlan {
  id: string;
  _id?: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  product_slots: number;
  is_popular: boolean;
  addon_available_for_yearly?: boolean;
  addon_price_per_year?: number;
  addon_max_slots?: number;
}

interface Product {
  id: string;
  _id?: string;
  product_name: string;
  category_name?: string;
  product_type_name: string;
  product_listing_type_name?: string;
  price: number;
  product_main_image?: string;
  image?: string;
  is_priority?: boolean;
  priority_expiry?: string;
  active_plan_name?: string;
}

interface PriorityPurchase {
  id: string;
  plan_id: string;
  plan_name: string;
  product_ids: string[];
  expire_at: string;
  total_slots: number;
  plan_duration: "monthly" | "yearly";
  is_addon_purchased?: boolean;
  addon_max_slots?: number;
  addon_product_ids?: string[];
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const SettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<PriorityPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<PriorityPurchase[]>([]);
  const [listingPurchases, setListingPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PriorityPlan | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");
  const [currentTab, setCurrentTab] = useState<"priority" | "booster" | "listing">("priority");
  const [currentServiceTab, setCurrentServiceTab] = useState<"listing" | "priority">("listing");
  const [planScope, setPlanScope] = useState<"product" | "service">("product");
  const [planDurations, setPlanDurations] = useState<Record<string, "monthly" | "yearly">>({});
  const [includeAddon, setIncludeAddon] = useState(false);
  const [addonProductIds, setAddonProductIds] = useState<string[]>([]);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [purchaseSummary, setPurchaseSummary] = useState<{ count: number; amount: number; isRefill: boolean } | null>(null);
  const [priorityHistoryTab, setPriorityHistoryTab] = useState<"rent" | "sell">("rent");
  const { balance, currency, refreshBalance } = useWallet();
  const { filters, isLoadingFilter } = useFilter();

  const showProduct = !isLoadingFilter && (filters.vendor || (!filters.vendor && !filters.service));
  const showService = !isLoadingFilter && (filters.service || (!filters.vendor && !filters.service));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes, purchasesRes, listingRes] = await Promise.all([
        api.get(endPointApi.getAllPriorityPlans),
        api.get(endPointApi.postAllVendorProductList, { params: { limit: 1000 } }),
        api.get(endPointApi.getVendorPriorityPurchases),
        api.get(endPointApi.getPurchasedPlans)
      ]);

      const plansData = plansRes.data.data || [];
      const rawProducts = productsRes.data.data || [];
      const activePurchases: PriorityPurchase[] = purchasesRes.data.data || [];

      setVendorPurchases(activePurchases);

      const normalizedProducts = rawProducts.map((p: any) => {
        let price = p.price;
        if (
          p.product_type_name?.toLowerCase() === 'rent' &&
          p.product_listing_type_name?.toLowerCase() === 'monthly' &&
          Array.isArray(p.month_arr) &&
          p.month_arr.length
        ) {
          price = p.month_arr[0]?.price ?? price;
        }

        const pid = p.id || p._id;
        const assocPurchase = activePurchases.find(purchase =>
          purchase.product_ids.some(id => String(id) === String(pid))
        );

        return {
          ...p,
          price: Number(price) || 0,
          id: pid,
          is_priority: p.is_priority || false,
          priority_expiry: p.priority_expiry || null,
          active_plan_name: assocPurchase?.plan_name
        };
      });

      setPlans(plansData);
      setProducts(normalizedProducts);
      setListingPurchases(listingRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoadingFilter) {
      if (!showProduct && showService) setPlanScope("service");
      else if (showProduct && !showService) setPlanScope("product");
    }
  }, [isLoadingFilter, showProduct, showService]);

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "sell"), [products]);

  const handleSelectPlan = (plan: PriorityPlan) => {
    setSelectedPlan(plan);
    setSelectedProductIds([]);
    setAddonProductIds([]);
    setIncludeAddon(false);
    setIsModalOpen(true);
    if (rentProducts.length === 0 && sellProducts.length > 0) {
      setActiveTab("Sell");
    } else {
      setActiveTab("Rent");
    }
  };

  const handlePurchase = async (isConfirmed = false) => {
    const targetPlanId = selectedPlan?.id || selectedPlan?._id;
    if (!targetPlanId) return;

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    const currentDuration = planDurations[targetPlanId] || "monthly";
    // CRITICAL FIX: Filter by BOTH plan_id AND duration
    const activePurchases = vendorPurchases.filter(p =>
      String(p.plan_id) === String(targetPlanId) &&
      p.plan_duration === currentDuration
    );

    // Total capacity across matching active plans
    const totalSlots = activePurchases.length > 0
      ? activePurchases.reduce((acc, p) => acc + Number(p.total_slots), 0)
      : Number(selectedPlan.product_slots || 0);

    // Collect all unique products currently assigned across these matching plans
    const currentProductIds = new Set(activePurchases.flatMap(p => p.product_ids.map(id => String(id))));
    const trulyNewIds = selectedProductIds.filter(id => !currentProductIds.has(String(id)));

    const usedSlots = currentProductIds.size;
    const remainingSlotsCalculated = Math.max(0, totalSlots - usedSlots);

    let finalPrice = currentDuration === "monthly" ? selectedPlan.monthly_price : selectedPlan.yearly_price;
    let isRefill = false;
    let purchaseIdToRefill = "";

    if (currentDuration === "yearly" && includeAddon) {
      finalPrice += Number(selectedPlan.addon_price_per_year || 0);
    }

    // Refill Logic: If we have room in an active plan and it's not a new addon purchase
    if (activePurchases.length > 0 && trulyNewIds.length <= remainingSlotsCalculated) {
      // Check if we are trying to add a new addon to an existing yearly plan that didn't have it
      const yearlyWithoutAddon = activePurchases.find(p => p.plan_duration === 'yearly' && !p.is_addon_purchased);

      if (includeAddon && yearlyWithoutAddon) {
        // This is an upgrade (Addon added to existing Yearly plan)
        isRefill = true;
        purchaseIdToRefill = yearlyWithoutAddon.id || (yearlyWithoutAddon as any)._id;
      } else if (!includeAddon) {
        finalPrice = 0;
        isRefill = true;
        purchaseIdToRefill = activePurchases[0].id || (activePurchases[0] as any)._id;
      }
    }

    // Show Confirmation Modal first
    if (!isConfirmed) {
      setPurchaseSummary({
        count: isAddonModalOpen ? addonProductIds.length : selectedProductIds.length,
        amount: finalPrice,
        isRefill
      });
      setIsConfirmModalOpen(true);
      return;
    }

    if (finalPrice > balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await api.post(endPointApi.purchasePriorityPlan, {
        plan_id: targetPlanId,
        product_ids: selectedProductIds,
        price: finalPrice,
        plan_duration: currentDuration,
        is_addon_purchased: includeAddon,
        addon_product_ids: addonProductIds,
        is_refill: isRefill,
        purchase_id: purchaseIdToRefill
      });

      if (res.data.success) {
        toast.success(res.data.message || "Priority plan updated successfully!");
        setIsModalOpen(false);
        setIsAddonModalOpen(false);
        setIsConfirmModalOpen(false);
        refreshBalance();
        fetchData();
        setSelectedProductIds([]);
        setAddonProductIds([]);
        setIncludeAddon(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Action failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const columns = useMemo((): ColDef[] => [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 240,
      flex: 1,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0 relative group">
              <img
                src={imageUrl}
                className="w-9 h-9 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[13px] text-gray-800 dark:text-gray-100 truncate">
                {product.product_name}
              </span>
            </div>
          </div>
        );
      }
    },

    {
      headerName: "Category",
      field: "category_name",
      width: 150,
      cellRenderer: (params: any) => (
        <span className="text-gray-600 font-medium">{params.value || "-"}</span>
      )
    },
    {
      headerName: "Pricing",
      field: "pricing_type",
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={(params.value || 'paid').toLowerCase() === 'free' ? 'free' : 'paid'} />
        </div>
      )
    },
    {
      headerName: "Plan",
      field: "active_plan_name",
      width: 120,
      cellRenderer: (params: any) => (
        params.value ? (
          <StatusBadge status={params.value} />
        ) : <span className="text-gray-400 font-medium">-</span>
      )
    },

    {
      headerName: "Price",
      field: "price",
      width: 100,
      valueFormatter: (params) => `${currency}${params.value?.toLocaleString()}`
    },
    {
      headerName: "Stock",
      field: "available_quantity",
      width: 100,
      cellRenderer: (params: any) => {
        const qty = params.value || 0;
        return (
          <div className="flex items-center h-full">
            <span className={`text-xs font-bold ${qty <= 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
              {qty} {qty <= 0 && "(OOS)"}
            </span>
          </div>
        );
      }
    },

    {
      headerName: "Expiry Date",
      field: "priority_expiry",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString('en-GB');
      }
    },
  ], [currency]);

  const listingColumns = useMemo((): ColDef[] => [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3 h-full">
            <img
              src={imageUrl}
              className="w-8 h-8 rounded object-cover border"
              onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
            />
            <span className="font-bold text-[13px] truncate">{product.product_name}</span>
          </div>
        );
      }
    },
    {
      headerName: "Stock",
      field: "available_quantity",
      width: 90,
    },
    {
      headerName: "Expiry",
      field: "expires_at",
      width: 110,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB') : "-"
    },
    {
      headerName: "Active Plan",
      field: "id",
      width: 120,
      cellRenderer: (p: any) => {
        const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(p.value)));
        return hasListing ? <StatusBadge status="Listing Active" /> : <span className="text-gray-400">-</span>;
      }
    }
  ], [listingPurchases]);

  const flattenedPriorityHistory = useMemo(() => {
    const rows: any[] = [];
    vendorPurchases.forEach(purchase => {
      if (!purchase.product_ids || purchase.product_ids.length === 0) {
        rows.push({
          ...purchase,
          product_name: "-",
          category_name: "-",
          sub_category_name: "-",
          product_type_name: "-",
          is_placeholder: true
        });
        return;
      }

      purchase.product_ids.forEach(pId => {
        const product = products.find(p => String(p.id) === String(pId));
        rows.push({
          ...purchase,
          product_name: product?.product_name || `Product ID: ${pId}`,
          category_name: product?.category_name || "-",
          sub_category_name: (product as any)?.sub_category_name || "-",
          product_type_name: product?.product_type_name || "-",
        });
      });
    });
    const sorted = rows.sort((a, b) => new Date(b.expire_at).getTime() - new Date(a.expire_at).getTime());
    if (priorityHistoryTab === "sell") return sorted.filter(r => r.product_type_name?.toLowerCase() === "sell");
    return sorted.filter(r => r.product_type_name?.toLowerCase() === "rent");
  }, [vendorPurchases, products, priorityHistoryTab]);

  const priorityHistoryColumns = useMemo((): ColDef[] => [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="font-bold text-gray-900 dark:text-gray-100">{params.value}</span>
      )
    },
    {
      headerName: "Category",
      field: "category_name",
      width: 150,
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      width: 150,
    },
    {
      headerName: "Plan Name",
      field: "plan_name",
      width: 150,
    },
    {
      headerName: "Expiry Date",
      field: "expire_at",
      width: 130,
      cellRenderer: (params: any) => {
        if (!params.value) return "-";
        const date = new Date(params.value);
        return (
          <span>{date.toLocaleDateString('en-GB')}</span>
        );
      }
    },
    {
      headerName: "Status",
      field: "expire_at",
      width: 120,
      cellRenderer: (params: any) => {
        const isExpired = new Date(params.value) < new Date();
        return <StatusBadge status={isExpired ? "expired" : "active"} />;
      }
    }
  ], []);

  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  const filteredProducts = useMemo(() => {
    return currentTabProducts.filter(p =>
      p.product_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch]);

  const handleSelectionChange = (rows: Product[]) => {
    // Filter out disabled rows (already assigned to a plan) so "Select All"
    const selectableRows = rows.filter((p) => !p.active_plan_name);
    const ids = selectableRows.map((p) => p.id || (p as any)._id);
    setSelectedProductIds(ids);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader fullScreen={false} />
      </div>
    );
  }


  const selectedPlanKey = selectedPlan ? (selectedPlan.id || selectedPlan._id) : undefined;

  const activePurchasesForPlan = selectedPlanKey
    ? vendorPurchases.filter(p =>
      String(p.plan_id) === String(selectedPlanKey) &&
      p.plan_duration === (planDurations[selectedPlanKey] || "monthly")
    )
    : [];

  const currentTotal = activePurchasesForPlan.length > 0
    ? activePurchasesForPlan.reduce((acc, p) => acc + Number(p.total_slots), 0)
    : Number(selectedPlan?.product_slots || 0);

  const currentUsed = activePurchasesForPlan.reduce((acc, p) => acc + p.product_ids.length, 0);
  const remainingSlots = Math.max(0, currentTotal - currentUsed);

  const totalAddonSlots = activePurchasesForPlan.reduce((acc, p) => acc + Number(p.addon_max_slots || 0), 0);
  const usedAddonSlots = activePurchasesForPlan.reduce((acc, p) => acc + (p.addon_product_ids?.length || 0), 0);
  const remainingAddonSlots = Math.max(0, totalAddonSlots - usedAddonSlots);

  // Show banner if: NO active purchase OR previous purchase(s) are completely full (Priority and Addon)
  const isRefillScenario = activePurchasesForPlan.length > 0 && remainingSlots > 0;
  const showAddonBanner = activePurchasesForPlan.length === 0 || (remainingSlots === 0 && (totalAddonSlots === 0 || remainingAddonSlots === 0));


  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Top Scope + Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm mb-4 sm:mb-6 dark:bg-black">
        {/* Left: Scope switcher - only show if both types active */}
        {(showProduct || showService) && (
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-fit dark:bg-[#1c2938]">
            {showProduct && (
              <button
                onClick={() => setPlanScope("product")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${planScope === "product"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Package size={15} />
                <span>Product Plans</span>
              </button>
            )}
            {showService && (
              <button
                onClick={() => setPlanScope("service")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${planScope === "service"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Briefcase size={15} />
                <span>Service Plans</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Sub-tab switcher */}
        {planScope === "product" && (
          <div className="flex p-1 sm:p-1.5 bg-gray-100/80 rounded-xl sm:rounded-2xl w-full sm:w-auto dark:bg-[#1c2938] gap-1 sm:gap-1.5">
            <Button
              variant={currentTab === "priority" ? "secondary" : "ghost"}
              onClick={() => setCurrentTab("priority")}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 cursor-pointer rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "priority"
                ? "bg-white text-brand-600 shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Package size={15} className={currentTab === "priority" ? "text-brand-500" : "text-gray-400"} />
              <span>Priority</span>
            </Button>
            <Button
              variant={currentTab === "booster" ? "secondary" : "ghost"}
              onClick={() => setCurrentTab("booster")}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 cursor-pointer rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "booster"
                ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Rocket size={15} className={currentTab === "booster" ? "text-indigo-500" : "text-gray-400"} />
              <span>Booster</span>
            </Button>
            <Button
              variant={currentTab === "listing" ? "secondary" : "ghost"}
              onClick={() => setCurrentTab("listing")}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "listing"
                ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Package size={15} className={currentTab === "listing" ? "text-emerald-500" : "text-gray-400"} />
              <span>Listing</span>
            </Button>
          </div>
        )}

        {planScope === "service" && (
          <div className="flex p-1 bg-gray-100/80 rounded-2xl w-fit dark:bg-[#1c2938] gap-2">

            <Button
              variant={currentServiceTab === "listing" ? "secondary" : "ghost"}
              onClick={() => setCurrentServiceTab("listing")}
              className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] h-auto ${currentServiceTab === "listing"
                ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Briefcase size={15} className={currentServiceTab === "listing" ? "text-emerald-500" : "text-gray-400"} />
              <span>Listing Plan</span>
            </Button>
            <Button
              variant={currentServiceTab === "priority" ? "secondary" : "ghost"}
              onClick={() => setCurrentServiceTab("priority")}
              className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] h-auto ${currentServiceTab === "priority"
                ? "bg-white text-brand-600 shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Zap
                size={16}
                className={
                  currentServiceTab === "priority"
                    ? "text-brand-500"
                    : "text-gray-400"
                }
              />
              <span>Priority Plan</span>
            </Button>

          </div>
        )}
      </div>

      {/* Shared Modals - rendered once outside all conditional branches */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-6xl w-full mx-2 sm:mx-auto"
      >
        <div className="flex flex-col h-[85vh] sm:h-[70vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-4 sm:px-6 pr-10 sm:pr-14 py-3 sm:py-4 border-b bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                    {isAddonModalOpen ? "Select Add-on Products" : `${selectedPlan?.name} Products (${planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly"})`}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {isAddonModalOpen ? (
                      <>Available Add-on Slots: <span className="ml-1 font-semibold text-brand-600">{Number(selectedPlan?.addon_max_slots || 0) - addonProductIds.length} left</span></>
                    ) : (
                      <>Remaining Priority Slots: <span className="ml-1 font-semibold text-brand-600">{remainingSlots} left</span></>
                    )}
                  </p>
                </div>
              </div>

              {(planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly") === "yearly" &&
                selectedPlan?.addon_available_for_yearly &&
                !isAddonModalOpen &&
                !isRefillScenario &&
                !activePurchasesForPlan.some(p => p.is_addon_purchased) && (
                  <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl mb-2 flex items-center justify-between animate-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <Zap className="text-brand-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-900">Exclusive Priority Annual Benefit</p>
                        <p className="text-[11px] text-brand-600 font-medium">Add {selectedPlan.addon_max_slots} Listing Slots for just ₹{selectedPlan.addon_price_per_year}/yr</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeAddon(!includeAddon)}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${includeAddon ? 'bg-brand-600 text-white shadow-lg' : 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50'}`}
                    >
                      {includeAddon ? '✓ Selected' : '+ Add Benefit'}
                    </button>
                  </div>
                )}
              {/* Search + Tab row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('Rent')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'Rent' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Rent ({rentProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('Sell')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'Sell' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Sell ({sellProducts.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Table */}
          <div className="flex-1 px-2 sm:px-6 overflow-hidden">
            <AgGridTable
              key={isAddonModalOpen ? "addon" : "priority"}
              columns={isAddonModalOpen ? listingColumns : columns}
              rowData={filteredProducts}
              onSelectionChange={(rows) => {
                if (isAddonModalOpen) {
                  const ids = rows.map(p => p.id || (p as any)._id);
                  setAddonProductIds(ids);
                } else {
                  const ids = rows.filter(p => !p.active_plan_name).map(p => p.id || (p as any)._id);
                  setSelectedProductIds(ids);
                }
              }}
              showCheckboxes={true}
              height={320}
              rowHeight={45}
              isRowSelectable={(params) => {
                if (isAddonModalOpen) {
                  const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(params.data.id || params.data._id)));
                  return !hasListing;
                }
                // Disable free products — they don't need a Priority plan
                if ((params.data.pricing_type || 'paid').toLowerCase() === 'free') return false;
                return !params.data.active_plan_name;
              }}
              getRowStyle={(params) => {
                const hasCurrentPlan = params.data.active_plan_name;
                const isFree = (params.data.pricing_type || 'paid').toLowerCase() === 'free';
                const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(params.data.id || params.data._id)));
                if ((!isAddonModalOpen && (hasCurrentPlan || isFree)) || (isAddonModalOpen && hasListing)) {
                  return { opacity: 0.4, pointerEvents: 'none', background: 'rgba(0,0,0,0.03)' };
                }
                return undefined;
              }}
            />
          </div>
          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (isAddonModalOpen) {
                  setIsAddonModalOpen(false);
                } else {
                  setIsModalOpen(false);
                }
              }}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm"
            >
              {isAddonModalOpen ? "Back" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (includeAddon && !isAddonModalOpen) {
                  setIsAddonModalOpen(true);
                  return;
                }
                handlePurchase();
              }}
              disabled={
                isPurchasing ||
                (isAddonModalOpen ? addonProductIds.length === 0 : selectedProductIds.length === 0) ||
                (!isAddonModalOpen && selectedProductIds.length > remainingSlots && activePurchasesForPlan.length === 0 && selectedProductIds.length > (selectedPlan?.product_slots || 0)) ||
                (isAddonModalOpen && addonProductIds.length > (selectedPlan?.addon_max_slots || 0))
              }
              className={`px-5 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${includeAddon && !isAddonModalOpen ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
            >
              {isPurchasing ? 'Processing...' : (includeAddon && !isAddonModalOpen ? 'Next: Select Add-on Items' : 'Confirm & Activate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        className="max-w-md w-full"
      >
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center dark:bg-blue-900/30">
              <Search className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Confirm Plan</h3>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl dark:bg-gray-800">
              <span className="text-gray-500 font-medium">Plan Name</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl dark:bg-gray-800">
              <span className="text-gray-500 font-medium">Duration</span>
              <span className="font-bold text-gray-900 dark:text-white capitalize">{planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly"}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl dark:bg-gray-800">
              <span className="text-gray-500 font-medium">{isAddonModalOpen ? "Add-on Products" : "Priority Products"}</span>
              <span className="font-bold text-gray-900 dark:text-white">{purchaseSummary?.count} Items</span>
            </div>
            {includeAddon && !isAddonModalOpen && (
              <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 dark:bg-indigo-900/10">
                <span className="text-indigo-600 font-medium italic text-xs">Included Benefit</span>
                <span className="font-bold text-indigo-700 text-xs text-right">Enabled (Selection Next Step)</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-brand-50 rounded-xl border border-brand-100 dark:bg-brand-900/10">
              <span className="text-brand-600 font-bold uppercase text-xs tracking-wider">Total Amount</span>
              <span className="text-2xl font-black text-brand-600">{currency}{purchaseSummary?.amount?.toLocaleString()}</span>
            </div>
            {purchaseSummary?.amount === 0 && purchaseSummary?.isRefill && (
              <p className="text-xs text-green-600 font-bold text-center px-4">
                ✓ Using remaining slots from your active subscription. No additional charge.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 rounded-xl btn-primary" onClick={() => handlePurchase(true)} disabled={isPurchasing}>
              {isPurchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </div>
        </div>
      </Modal>

      {isLoadingFilter ? null : showProduct && !showService ? (
        // Only product vendor
        currentTab === "priority" ? (
          <>
            {/* Priority Plan Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-3">
                {/* <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
                    Priority Visibility Plans
                  </h3>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                  {plans.map((plan) => {
                    const planId = plan.id || (plan as any)._id;
                    const durationToggle = planDurations[planId] || "monthly";

                    const monthlyPurchases = vendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "monthly");
                    const yearlyPurchases = vendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "yearly");

                    const mTotal = monthlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                    const mUsed = monthlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);
                    const yTotal = yearlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                    const yUsed = yearlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);

                    const currentRemaining = durationToggle === "monthly"
                      ? Math.max(0, mTotal - mUsed)
                      : Math.max(0, yTotal - yUsed);

                    const isDurationActive = durationToggle === "monthly" ? mTotal > 0 : yTotal > 0;

                    return (
                      <div
                        key={plan.id}
                        className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white dark:bg-[#0d111c] group ${plan.is_popular
                          ? 'border-brand-500 shadow-2xl shadow-brand-100 sm:scale-[1.02] z-10'
                          : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'
                          }`}
                      >
                        {plan.is_popular && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg">
                            Recommended
                          </span>
                        )}

                        <div className="mb-3 flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                            <Package className="w-5 h-5 text-brand-600" />
                          </div>
                          <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-300">{plan.name}</h4>
                        </div>

                        <div className="flex gap-3 mb-8">
                          {(["monthly", "yearly"] as const).map((dur) => {
                            const isSelected = (planDurations[planId] || "monthly") === dur;
                            const price = dur === "monthly" ? plan.monthly_price : plan.yearly_price;
                            return (
                              <button
                                key={dur}
                                onClick={() => setPlanDurations(prev => ({ ...prev, [planId]: dur }))}
                                className={`flex-1 flex flex-col gap-1 p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                                  ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-[#0d111c] shadow-md"
                                  : "border-gray-200 bg-gray-50 dark:bg-[#0d111c] dark:border-gray-700 hover:border-brand-200"
                                  }`}
                              >
                                <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? "text-brand-500" : "text-gray-400"
                                  }`}>
                                  {dur === "monthly" ? "Monthly" : "Yearly"}
                                </span>
                                <div className="flex items-baseline gap-0.5">
                                  <span className={`text-2xl font-black ${isSelected ? "text-brand-600" : "text-gray-400"
                                    }`}>
                                    {currency}{price}
                                  </span>
                                  <span className={`text-xs font-bold ${isSelected ? "text-gray-500" : "text-gray-400"
                                    }`}>
                                    /{dur === "monthly" ? "mo" : "yr"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isDurationActive && (
                          <div className="mb-4 sm:mb-6 p-4 bg-green-50 border border-green-100 rounded-xl dark:bg-[#1c2938]">
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <span className="text-green-600 font-bold text-xs uppercase tracking-tight">Active {durationToggle} Slots</span>
                                <p className="text-[10px] text-green-500">Remaining for current period</p>
                              </div>
                              <span className="font-black text-green-800 dark:text-green-200 text-2xl">
                                {currentRemaining}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8 flex-grow">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="mt-1 bg-green-100 p-1.5 rounded-full flex-shrink-0"><Check className="text-green-600" size={14} /></div>
                            <div>
                              <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{plan.product_slots} Product Slots</p>
                              <p className="text-xs text-gray-500">Add up to {plan.product_slots} items</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="mt-1 bg-green-100 p-1.5 rounded-full flex-shrink-0"><Check className="text-green-600" size={14} /></div>
                            <div>
                              <p className="text-gray-900 font-bold text-sm dark:text-gray-300">Top Feed Priority</p>
                              <p className="text-xs text-gray-500">Show above standard listings</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          variant={plan.is_popular ? 'primary' : 'outline'}
                          className="w-full !py-3.5 rounded-xl font-bold btn-primary"
                        >
                          {isDurationActive ? 'Add More Products' : 'Select Plan'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Purchase History */}
              <div className="space-y-2 md:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-brand-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Plan History</h2>
                  </div>
                  <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1">
                    {(["rent", "sell"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setPriorityHistoryTab(tab)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition capitalize ${
                          priorityHistoryTab === tab
                            ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'rent' ? 'Rent' : 'Sell'}
                      </button>
                    ))}
                  </div>
                </div>

                <AgGridTable
                  rowData={flattenedPriorityHistory}
                  columns={priorityHistoryColumns}
                  showCheckboxes={false}
                  height={400}
                  rowHeight={52}
                />
              </div>

            </div>
          </>
        ) : currentTab === "booster" ? (
          <BoosterPlanView />
        ) : (
          <ListingPlanView />
        )
      ) : showService && !showProduct ? (
        // Only service vendor
        currentServiceTab === "listing" ? (
          <ServicePlanView />
        ) : (
          <ServicePriorityPlanView />
        )
      ) : showProduct && showService ? (
        // Both - use planScope switcher
        planScope === "product" ? (
          currentTab === "priority" ? (
            <>
              {/* Priority Plan Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                    {plans.map((plan) => {
                      const planId = plan.id || (plan as any)._id;
                      const durationToggle = planDurations[planId] || "monthly";
                      const monthlyPurchases = vendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "monthly");
                      const yearlyPurchases = vendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "yearly");
                      const mTotal = monthlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                      const mUsed = monthlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);
                      const yTotal = yearlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                      const yUsed = yearlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);
                      const currentRemaining = durationToggle === "monthly" ? Math.max(0, mTotal - mUsed) : Math.max(0, yTotal - yUsed);
                      const isDurationActive = durationToggle === "monthly" ? mTotal > 0 : yTotal > 0;
                      return (
                        <div key={plan.id} className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white dark:bg-[#0d111c] group ${plan.is_popular ? 'border-brand-500 shadow-2xl shadow-brand-100 sm:scale-[1.02] z-10' : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'}`}>
                          {plan.is_popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg">Recommended</span>}
                          <div className="mb-3 flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]"><Package className="w-5 h-5 text-brand-600" /></div>
                            <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-300">{plan.name}</h4>
                          </div>
                          <div className="flex gap-3 mb-8">
                            {(["monthly", "yearly"] as const).map((dur) => {
                              const isSelected = (planDurations[planId] || "monthly") === dur;
                              const price = dur === "monthly" ? plan.monthly_price : plan.yearly_price;
                              return (
                                <button key={dur} onClick={() => setPlanDurations(prev => ({ ...prev, [planId]: dur }))} className={`flex-1 flex flex-col gap-1 p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-[#0d111c] shadow-md" : "border-gray-200 bg-gray-50 dark:bg-[#0d111c] dark:border-gray-700 hover:border-brand-200"}`}>
                                  <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? "text-brand-500" : "text-gray-400"}`}>{dur === "monthly" ? "Monthly" : "Yearly"}</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className={`text-2xl font-black ${isSelected ? "text-brand-600" : "text-gray-400"}`}>{currency}{price}</span>
                                    <span className={`text-xs font-bold ${isSelected ? "text-gray-500" : "text-gray-400"}`}>/{dur === "monthly" ? "mo" : "yr"}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {isDurationActive && (
                            <div className="mb-4 sm:mb-6 p-4 bg-green-50 border border-green-100 rounded-xl dark:bg-[#1c2938]">
                              <div className="flex justify-between items-center text-sm">
                                <div><span className="text-green-600 font-bold text-xs uppercase tracking-tight">Active {durationToggle} Slots</span><p className="text-[10px] text-green-500">Remaining for current period</p></div>
                                <span className="font-black text-green-800 dark:text-green-200 text-2xl">{currentRemaining}</span>
                              </div>
                            </div>
                          )}
                          <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8 flex-grow">
                            <div className="flex items-start gap-3"><div className="mt-1 bg-green-100 p-1.5 rounded-full flex-shrink-0"><Check className="text-green-600" size={14} /></div><div><p className="text-gray-900 font-bold text-sm dark:text-gray-300">{plan.product_slots} Product Slots</p><p className="text-xs text-gray-500">Add up to {plan.product_slots} items</p></div></div>
                            <div className="flex items-start gap-3"><div className="mt-1 bg-green-100 p-1.5 rounded-full flex-shrink-0"><Check className="text-green-600" size={14} /></div><div><p className="text-gray-900 font-bold text-sm dark:text-gray-300">Top Feed Priority</p><p className="text-xs text-gray-500">Show above standard listings</p></div></div>
                          </div>
                          <Button onClick={() => handleSelectPlan(plan)} variant={plan.is_popular ? 'primary' : 'outline'} className="w-full !py-3.5 rounded-xl font-bold btn-primary">{isDurationActive ? 'Add More Products' : 'Select Plan'}</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Package className="w-6 h-6 text-brand-600" /><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Plan History</h2></div>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1">
                      {(["rent", "sell"] as const).map((tab) => (
                        <button key={tab} onClick={() => setPriorityHistoryTab(tab)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition capitalize ${
                            priorityHistoryTab === tab ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}>
                          {tab === 'rent' ? 'Rent' : 'Sell'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AgGridTable rowData={flattenedPriorityHistory} columns={priorityHistoryColumns} showCheckboxes={false} height={400} rowHeight={52} />
                </div>
              </div>
            </>
          ) : currentTab === "booster" ? (
            <BoosterPlanView />
          ) : (
            <ListingPlanView />
          )
        ) : (
          currentServiceTab === "listing" ? <ServicePlanView /> : <ServicePriorityPlanView />
        )
      ) : null}
    </div>
  )
};

export default SettingsPage;
