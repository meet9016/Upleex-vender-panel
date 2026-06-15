"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Package, Search, Check, ShoppingBag, Loader2, AlertCircle, History, Eye, Zap, Rocket } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import { useWallet } from "@/context/WalletContext";
import { useDemoAccount } from "@/hooks/useDemoAccount";
import { Modal } from "@/components/ui/modal";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setMultipleSelections, replaceSelections } from "@/store/slices/selectionSlice";

interface ListingPlan {
  key: string;
  name: string;
  price: number;
  duration_months: number;
  product_limit: number;
  unlimited_amount?: number;
  extra_product_price?: number;
  features?: string[];
  free_listing?: boolean;
}

interface Product {
  id: string;
  _id?: string;
  product_name: string;
  category_name?: string;
  sub_category_name?: string;
  product_type_name: string;
  price: number;
  product_main_image?: string;
  image?: string;
  expires_at?: string;
  status: string;
  pricing_type?: 'free' | 'paid';
  free_listing_expires_at?: string | null;
  free_listing_remaining_days?: number;
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const ListingPlanView: React.FC = () => {
  const { currency, balance, refreshBalance } = useWallet();
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasedPlans, setPurchasedPlans] = useState<any[]>([]);
  const [allPurchasedPlans, setAllPurchasedPlans] = useState<any[]>([]);
  const [listingRentCount, setListingRentCount] = useState<number>(0);
  const [listingSellCount, setListingSellCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  
  // Redux state for persistent selection
  const dispatch = useDispatch();
  const selectedIdsMap = useSelector((state: RootState) => state.selection.selectedIds);
  const selectedProductIds = useMemo(() => 
    Object.keys(selectedIdsMap).filter(id => selectedIdsMap[id]), 
    [selectedIdsMap]
  );

  const setSelectedProductIds = (ids: string[] | ((prev: string[]) => string[])) => {
    const newIds = typeof ids === 'function' ? ids(selectedProductIds) : ids;
    const newMap: Record<string, boolean> = {};
    newIds.forEach(id => newMap[id] = true);
    dispatch(replaceSelections(newMap));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [priorityAddons, setPriorityAddons] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { checkIsDemoAccount } = useDemoAccount();
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [planPreferences, setPlanPreferences] = useState<Record<string, 'extra' | 'unlimited'>>({});
  const [purchaseSummary, setPurchaseSummary] = useState<{ count: number; amount: number; gstAmount: number; totalAmount: number; isRefill: boolean; isUnlimited?: boolean; extraCount?: number; extraPrice?: number; isFreeListing?: boolean; remainingFreeDays?: number; freeProductsInfo?: Array<{ name: string, days: number, freeExpiry: string }> } | null>(null);

  const [historyTab, setHistoryTab] = useState<"rent" | "sell">("rent");
  const [hasShownLimitToast, setHasShownLimitToast] = useState(false); // Track if limit toast was shown
  const historyCacheRef = React.useRef<Record<string, any[]>>({});
  const initialDataFetchedRef = React.useRef(false);
  const isFetchingRef = React.useRef(false);

  const planAggregates = useMemo(() => {
    const aggregates: Record<string, { total: number; used: number; productIds: Set<string> }> = {};
    const now = new Date();

    const activePurchases = allPurchasedPlans.filter(p => {
      const isNotExpired = new Date(p.expire_at) > now;
      return isNotExpired;
    });

    activePurchases.forEach(p => {
      const type = p.plan_type;
      if (!aggregates[type]) {
        aggregates[type] = { total: 0, used: 0, productIds: new Set() };
      }
      aggregates[type].total += Number(p.max_products || 0);

      const pIds = p.product_ids || [];
      pIds.forEach((prod: any) => {
        const id = typeof prod === 'string' ? prod : (prod.id || prod._id || prod.product_id);
        if (id) {
          aggregates[type].productIds.add(String(id));
        }
      });
    });

    // Add Priority Addon slots
    priorityAddons.forEach(p => {
      const type = "Priority Addon";
      if (!aggregates[type]) {
        aggregates[type] = { total: 0, used: 0, productIds: new Set() };
      }
      aggregates[type].total += Number(p.addon_max_slots || 0);
      // Actually, we should use addon_product_ids for the "used" count
      const addonPIds = p.addon_product_ids || [];
      addonPIds.forEach((id: any) => {
        aggregates[type].productIds.add(String(id));
      });
    });

    Object.keys(aggregates).forEach(type => {
      aggregates[type].used = aggregates[type].productIds.size;
    });

    return aggregates;
  }, [allPurchasedPlans, priorityAddons]);

  const fetchData = async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const promises: any[] = [];
      
      // Always fetch rent/sell history for counts and cache
      promises.push(api.get(endPointApi.getVendorListingPurchases, { params: { filter_rent_sell: '1' } }).catch(() => ({ data: { total: 0, data: [] } })));
      promises.push(api.get(endPointApi.getVendorListingPurchases, { params: { filter_rent_sell: '2' } }).catch(() => ({ data: { total: 0, data: [] } })));

      if (!initialDataFetchedRef.current || forceRefresh) {
        promises.push(api.get(endPointApi.getPlanOptions));
        promises.push(api.get(endPointApi.postAllVendorProductList, { params: { limit: 1000 } }));
        promises.push(api.get(endPointApi.getVendorPriorityPurchases));
      }

      const results = await Promise.all(promises);
      const rentRes = results[0];
      const sellRes = results[1];

      // Update counts and cache
      setListingRentCount(rentRes.data.total || 0);
      setListingSellCount(sellRes.data.total || 0);
      historyCacheRef.current['rent'] = rentRes.data.data || [];
      historyCacheRef.current['sell'] = sellRes.data.data || [];
      setAllPurchasedPlans([...(rentRes.data.data || []), ...(sellRes.data.data || [])]);

      if (!initialDataFetchedRef.current || forceRefresh) {
        const [plansRes, productsRes, priorityRes] = results.slice(2);

      const rawPlans = plansRes.data.data || [];
        const normalizedPlans = rawPlans.map((p: any) => ({
          key: p.plan_type,
          name: p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1),
          price: p.amount,
          duration_months: p.months,
          product_limit: p.max_products,
          unlimited_amount: p.unlimited_amount || 0,
          extra_product_price: p.extra_product_price || 0,
          features: p.features || [],
          free_listing: p.free_listing !== undefined ? p.free_listing : true,
        }));

        const rawProducts = productsRes.data.data || [];
        const normalizedProducts = rawProducts.map((p: any) => {
          let price = p.price;
          if (p.product_type_name?.toLowerCase() === 'rent' && Array.isArray(p.month_arr) && p.month_arr.length) {
            price = p.month_arr[0]?.price ?? price;
          }
          return {
            ...p,
            id: p.id || p._id,
            price: Number(price) || 0,
            free_listing_expires_at: p.free_listing_expires_at || null,
            free_listing_remaining_days: p.free_listing_remaining_days || 0,
          };
        });

        setPlans(normalizedPlans);
        setProducts(normalizedProducts);
        setPriorityAddons((priorityRes.data.data || []).filter((p: any) => p.is_addon_purchased));
        initialDataFetchedRef.current = true;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load listing plan data");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Always sync state with whatever is in cache for the current tab
    const cachedData = historyCacheRef.current[historyTab];
    if (cachedData) {
      setPurchasedPlans(cachedData);
    }

    if (!cachedData) {
      fetchData();
    }
  }, [historyTab]);

  // Sync when loading finishes to catch background updates
  useEffect(() => {
    const cachedData = historyCacheRef.current[historyTab];
    if (cachedData) {
      setPurchasedPlans(cachedData);
    }
  }, [loading]);

  const handleSelectPlan = (plan: ListingPlan) => {
    setSelectedPlan(plan);
    setSelectedProductIds([]);
    setIsUnlimited(false);
    setIsChoiceModalOpen(false);
    setIsModalOpen(true);
  };

  const handleAddonRefill = (addon: any) => {
    // Open modal with addon context
    setSelectedPlan({
      key: 'Priority Addon',
      name: addon.plan_name + ' Addon',
      price: 0,
      duration_months: 12,
      product_limit: addon.addon_max_slots,
      id: addon.id || addon._id, // Store purchase ID for refill
      plan_id: addon.plan_id, // Add this to satisfy Joi validation
    } as any);
    setSelectedProductIds([]);
    setIsChoiceModalOpen(false);
    setIsModalOpen(true);
  };
  const handlePurchase = async (isConfirmed = false, forcedUnlimited?: boolean) => {
    if (!selectedPlan) return;

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    // Strict limit check requested by user: block if exceeding slots
    const aggForLimit = planAggregates[selectedPlan.key] || { total: 0, used: 0, productIds: new Set() };
    const remainingSlotsForLimit = aggForLimit.total > 0 ? Math.max(0, aggForLimit.total - aggForLimit.used) : selectedPlan.product_limit;

    if (selectedPlan.free_listing === true && selectedProductIds.length > (remainingSlotsForLimit || 0) ) {
        toast.error(`You cannot select more than ${remainingSlotsForLimit} product(s) for this plan.`);
        return;
      
    }

    const currentUnlimited = forcedUnlimited !== undefined ? forcedUnlimited : isUnlimited;
    const agg = planAggregates[selectedPlan.key] || { total: 0, used: 0, productIds: new Set() };
    const remainingSlots = Math.max(0, agg.total - agg.used);
    const isRefillAvailable = remainingSlots > 0 && selectedProductIds.length <= remainingSlots;
    const isAddonRefill = (selectedPlan as any).key === 'Priority Addon' && remainingSlots > 0;

    // Skip Choice Modal and go straight to Confirmation Modal (which now contains both options)
    const isExceeding = 
      selectedPlan.free_listing === false || 
      (agg.total > 0 && selectedProductIds.length > remainingSlots) ||
      (!agg.total && selectedProductIds.length > (selectedPlan.product_limit || 0));

    let finalPrice = selectedPlan.price;
    let extraCount = 0;
    let extraProductCost = 0;
    let isExtraAddon = false;

    if (currentUnlimited && selectedPlan.unlimited_amount) {
      finalPrice = selectedPlan.unlimited_amount;
    } else if (selectedPlan.free_listing === false) {
      // Paid plan: ALWAYS calculate extra product cost, ignore isRefillAvailable
      extraCount = selectedProductIds.length;
      extraProductCost = extraCount * (selectedPlan.extra_product_price || 0);
      finalPrice = extraProductCost;
      isExtraAddon = true;
    } else if (isRefillAvailable || isAddonRefill) {
      // Free listing plan with remaining slots -> zero cost refill
      finalPrice = 0;
    } else if (selectedPlan.free_listing === true) {
      // Free listing plan, first purchase: charge base plan amount
      finalPrice = selectedPlan.price;
      isExtraAddon = false;
    } else if (isExceeding) {
      if (agg.total > 0) {
        const baseRemaining = remainingSlots;
        extraCount = Math.max(0, selectedProductIds.length - baseRemaining);
        extraProductCost = extraCount * (selectedPlan.extra_product_price || 0);
        finalPrice = extraProductCost;
        isExtraAddon = true;
      } else {
        extraCount = Math.max(0, selectedProductIds.length - (selectedPlan.product_limit || 0));
        extraProductCost = extraCount * (selectedPlan.extra_product_price || 0);
        finalPrice = (selectedPlan.price || 0) + extraProductCost;
      }
    }

    const gstAmount = finalPrice > 0 ? Number((finalPrice * 0.18).toFixed(2)) : 0;
    const totalAmountWithGst = Number((finalPrice + gstAmount).toFixed(2));

    if (!isConfirmed) {
      // Calculate potential remaining free days AFTER the paid plan expires
      const freeProductsInfo = selectedProductIds
        .map(id => {
          const product = products.find(p => p.id === id);
          if (product && product.pricing_type === 'free' && product.free_listing_expires_at) {
            const freeExpiry = new Date(product.free_listing_expires_at);
            const now = new Date();
            
            // Calculate when product was created (30 days before free_listing_expires_at)
            const productCreatedAt = new Date(freeExpiry);
            productCreatedAt.setDate(productCreatedAt.getDate() - 30);
            
            // Calculate how many free days were USED before plan starts
            const daysUsed = Math.ceil((now.getTime() - productCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
            const totalFreeDays = 30;
            const remainingFreeDays = Math.max(0, totalFreeDays - daysUsed);
            
            // Calculate when the paid plan will expire
            const planStartDate = now;
            const planEndDate = new Date(planStartDate);
            planEndDate.setMonth(planEndDate.getMonth() + (selectedPlan?.duration_months || 1));
            
            // Calculate new expiry after plan (plan expiry + remaining free days)
            const newExpiryAfterPlan = new Date(planEndDate);
            newExpiryAfterPlan.setDate(newExpiryAfterPlan.getDate() + remainingFreeDays);
            
            if (remainingFreeDays > 0) {
              return {
                name: product.product_name,
                days: remainingFreeDays,
                freeExpiry: newExpiryAfterPlan.toISOString()
              };
            }
          }
          return null;
        })
        .filter(Boolean) as Array<{ name: string, days: number, freeExpiry: string }>;

      const activePurchase = allPurchasedPlans.find(p => p.plan_type === selectedPlan.key && new Date(p.expire_at) > new Date());
      const savedPref = planPreferences[selectedPlan.key] || 
                       (activePurchase?.is_unlimited ? 'unlimited' : 
                        activePurchase?.is_extra_per_product ? 'extra' : null);

      // Auto-confirm: 
      // 1. Zero-cost refills on FREE LISTING plans
      // 2. Paid plans where the user ALREADY chose 'extra' or 'unlimited' previously
      let shouldAutoConfirm = false;
      let finalUnlimitedValue = currentUnlimited;

      if (selectedPlan.free_listing !== false && (isRefillAvailable || isAddonRefill) && finalPrice === 0) {
        shouldAutoConfirm = true;
      } else if (selectedPlan.free_listing === false && savedPref && !isChoiceModalOpen) {
        shouldAutoConfirm = true;
        finalUnlimitedValue = savedPref === 'unlimited';
      }

      if (!isConfirmed && shouldAutoConfirm) {
        handlePurchase(true, finalUnlimitedValue);
        return;
      }

      setPurchaseSummary({
        count: selectedProductIds.length,
        amount: finalPrice,
        gstAmount: gstAmount,
        totalAmount: totalAmountWithGst,
        isRefill: (isRefillAvailable || isAddonRefill) && !isExtraAddon && !currentUnlimited,
        isUnlimited: currentUnlimited,
        extraCount: extraCount,
        extraPrice: selectedPlan.extra_product_price,
        isFreeListing: selectedPlan.free_listing,
        freeProductsInfo: freeProductsInfo.length > 0 ? freeProductsInfo : undefined
      });
      setIsConfirmModalOpen(true);
      return;
    }

    if (totalAmountWithGst > balance) {
      const isDemoAccount = await checkIsDemoAccount();
      if (!isDemoAccount) {
        toast.error(`Insufficient wallet balance. Total required including 18% GST is ₹${totalAmountWithGst}.`);
        return;
      }
    }

    setIsPurchasing(true);
    try {
      if ((selectedPlan as any).key === 'Priority Addon') {
        const res = await api.post(endPointApi.purchasePriorityPlan, {
          plan_id: (selectedPlan as any).plan_id || (selectedPlan as any).id,
          product_ids: [],
          price: 0,
          plan_duration: 'yearly',
          is_addon_purchased: true,
          addon_product_ids: selectedProductIds,
          is_refill: true,
          purchase_id: (selectedPlan as any).id
        });

        if (res.data.success) {
          toast.success(res.data.message || "Products added to benefit slots!");
          setIsModalOpen(false);
          setIsConfirmModalOpen(false);
          fetchData();
        }
        return;
      }

      const res = await api.post(endPointApi.postCreateListingPlan, {
        plan_type: selectedPlan.key,
        product_ids: selectedProductIds,
        is_unlimited: currentUnlimited,
        is_extra_per_product: isExceeding && !currentUnlimited && selectedPlan.free_listing === false,
        price: finalPrice, // Passing calculated price just in case
      });

      if (res.data.success) {
        toast.success(res.data.message || "Listing plan activated successfully!");
        setIsModalOpen(false);
        setIsConfirmModalOpen(false);
        refreshBalance();
        
        // Save user's preference for this plan type to skip future popups
        // ONLY if it was an upgrade choice (exceeding limit)
        if (selectedPlan.key !== 'Priority Addon' && isExceeding && selectedPlan.free_listing === false) {
          setPlanPreferences(prev => ({
            ...prev,
            [selectedPlan.key]: currentUnlimited ? 'unlimited' : 'extra'
          }));
        }

        // Clear cache and force refresh to get latest status
        historyCacheRef.current = {};
        initialDataFetchedRef.current = false;
        fetchData(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
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
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-gray-600 font-medium">{params.value || "-"}</span>
      )
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-gray-500 font-medium">{params.value || "-"}</span>
      )
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

    {headerName: "Pricing",
      field: "pricing_type",
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={(params.value || 'paid').toLowerCase() === 'free' ? 'free' : 'paid'} />
        </div>
      )
    },
    {
      headerName: "Status",
      field: "status",
      width: 110,
      cellRenderer: (params: any) => (
        <StatusBadge status={params.value} />
      )
    },
    {
      headerName: "Price",
      field: "price",
      width: 100,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val === undefined || val === null) return <span className="text-gray-400">-</span>;
        return <span className="font-medium">{currency}{Number(val).toLocaleString()}</span>;
      }
    },
    {
      headerName: "Current Expiry",
      field: "expires_at",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString('en-GB');
      }
    },
    {
      headerName: "Free Days Remaining",
      field: "free_listing_remaining_days",
      width: 180,
      cellRenderer: (params: any) => {
        const product = params.data;
        const remainingDays = product.free_listing_remaining_days || 0;
        const freeExpiry = product.free_listing_expires_at;
        const currentExpiry = product.expires_at;
        
        // Only show for free products
        if (product.pricing_type !== 'free') {
          return <span className="text-gray-400">-</span>;
        }
        
        const now = new Date();
        const freeExpiryDate = freeExpiry ? new Date(freeExpiry) : null;
        const currentExpiryDate = currentExpiry ? new Date(currentExpiry) : null;
        
        // If product is currently on a paid plan and has remaining free days after plan
        if (currentExpiryDate && currentExpiryDate > now && remainingDays > 0) {
          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg dark:bg-emerald-900/20">
                {remainingDays} days after plan
              </span>
              <span className="text-[10px] text-gray-500">
                Until: {freeExpiryDate?.toLocaleDateString('en-GB')}
              </span>
            </div>
          );
        }
        
        // If free listing is currently active (no paid plan yet)
        if (freeExpiryDate && freeExpiryDate > now && (!currentExpiryDate || currentExpiryDate.getTime() === freeExpiryDate.getTime())) {
          const productCreatedAt = new Date(freeExpiryDate);
          productCreatedAt.setDate(productCreatedAt.getDate() - 30);
          const daysUsed = Math.ceil((now.getTime() - productCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
          const daysLeft = Math.max(0, 30 - daysUsed);
          
          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg dark:bg-amber-900/20">
                {daysLeft} days left (active)
              </span>
              <span className="text-[10px] text-gray-500">
                Used: {daysUsed}/30 days
              </span>
            </div>
          );
        }
        
        // If free listing has expired
        if (freeExpiryDate && freeExpiryDate < now) {
          return <span className="text-gray-400 text-xs">Expired</span>;
        }
        
        return <span className="text-gray-400">-</span>;
      }
    },
    {
      headerName: "Active Plan",
      field: "assigned_plan",
      width: 120,
      valueGetter: (p) => {
        for (const [type, agg] of Object.entries(planAggregates)) {
          if (agg.productIds.has(String(p.data.id))) {
            return type;
          }
        }
        return "";
      },
      cellRenderer: (p: any) => p.value ? <StatusBadge status={p.value} /> : <span className="text-gray-400">-</span>
    }
  ], [currency, planAggregates]);

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "sell"), [products]);

  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  const filteredProducts = useMemo(() => {
    return currentTabProducts.filter(p =>
      p.product_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch]);

  const handleSelectionChange = (rows: Product[]) => {
    // Filter out products that are already in ANY active listing plan
    const selectableRows = rows.filter((row) => {
      for (const agg of Object.values(planAggregates)) {
        if (agg.productIds.has(String(row.id))) return false;
      }
      return true;
    });
    
    // Check plan limit
    if (selectedPlan) {
      const agg = planAggregates[selectedPlan.key] || { total: 0, used: 0, productIds: new Set() };
      const remainingSlots = agg.total > 0 ? Math.max(0, agg.total - agg.used) : selectedPlan.product_limit;
      
      // If exceeding limit
      if (selectedPlan.free_listing === true && selectableRows.length > (remainingSlots || 0)) {
        const limitedRows = selectableRows.slice(0, remainingSlots);
        const ids = limitedRows.map((p) => p.id);
        
        const updateMap: Record<string, boolean> = {};
        filteredProducts.forEach(p => {
          updateMap[String(p.id || p._id)] = false;
        });
        ids.forEach(id => {
          updateMap[String(id)] = true;
        });
        dispatch(setMultipleSelections(updateMap));
        
        toast.warning(`Limit exceeded! This plan allows only ${remainingSlots} product(s).`);
        return;
      }
    }
    
    const ids = selectableRows.map((p) => p.id);
    
    // Sync with Redux (only for products in current view)
    const updateMap: Record<string, boolean> = {};
    filteredProducts.forEach(p => {
      updateMap[String(p.id || p._id)] = false;
    });
    ids.forEach(id => {
      updateMap[String(id)] = true;
    });
    dispatch(setMultipleSelections(updateMap));
    
    // Reset toast flag when valid selection is made
    setHasShownLimitToast(false);
  };

  const flattenedPurchaseHistory = useMemo(() => {
    const rows: any[] = [];
    purchasedPlans.forEach(purchase => {
      const productList = purchase.product_ids || [];
      if (productList.length === 0) {
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
      productList.forEach((prod: any, index: number) => {
        // Try to find full product from local products list for type info
        const prodId = typeof prod === 'string' ? prod : (prod.id || prod._id || prod.product_id);
        const fullProduct = products.find(p => String(p.id) === String(prodId));
        
        let isExtraSlot = false;
        if (purchase.is_extra_per_product) {
          // Products beyond the max_products base limit are the extra ones
          isExtraSlot = index >= (purchase.max_products || 0);
        }

        rows.push({
          ...purchase,
          product_name: prod.product_name || fullProduct?.product_name || "-",
          category_name: prod.category_name || fullProduct?.category_name || "-",
          sub_category_name: prod.sub_category_name || fullProduct?.sub_category_name || "-",
          product_type_name: fullProduct?.product_type_name || prod.product_type_name || "-",
          is_extra_slot: isExtraSlot
        });
      });
    });

    const sorted = rows.sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());

    if (historyTab === "sell") return sorted.filter(r => r.product_type_name?.toLowerCase() === "sell");
    return sorted.filter(r => r.product_type_name?.toLowerCase() === "rent");
  }, [purchasedPlans, products, historyTab]);

  const purchaseHistoryColumns: ColDef[] = [
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
      width: 140,
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      width: 140,
    },
    {
      headerName: "Plan Name",
      field: "plan_type",
      width: 120,
      cellRenderer: (params: any) => (
        <span className="capitalize">{params.value}</span>
      )
    },
    {
      headerName: "Usage Type",
      field: "is_unlimited",
      width: 140,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (data.is_unlimited) return <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-semibold">Unlimited</span>;
        if (data.is_extra_slot) return <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-semibold">Extra (Paid)</span>;
        return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-semibold">Base Slot</span>;
      }
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
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader fullScreen={false} />
      </div>
    );
  }


  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative p-8 rounded-3xl border border-gray-200 transition-all duration-500 flex flex-col h-full bg-white group dark:bg-[#0d111c] hover:border-emerald-300 hover:shadow-xl shadow-sm`}
          >
            <div className="mb-3 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-100">{plan.name}</h4>
              </div>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-8 p-4 bg-emerald-50 rounded-2xl dark:bg-[#1c2938]">
              <span className="text-4xl font-extrabold text-emerald-700">
                {currency}{plan.price}
              </span>
              <span className="text-emerald-500 font-medium">/ {plan.duration_months} months</span>
            </div>

            <div className="space-y-2 mb-8 flex-grow">
              {(() => {
                const myActive = allPurchasedPlans.find(p => p.plan_type === plan.key && new Date(p.expire_at) > new Date());
                if (myActive) {
                  const used = myActive.product_ids?.length || 0;
                  const total = myActive.max_products || plan.product_limit;
                  const remaining = Math.max(0, total - used);
                  return (
                    <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl dark:bg-[#1c2938]">
                      {/* <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Active Subscription</p> */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-600 font-medium">Remaining Slots</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-200">
                          {remaining} / {total}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Up to {plan.product_limit} Products</span>
              </div>

              {(plan.features || []).map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{feature}</span>
                </div>
              ))}
              
              {plan.extra_product_price && plan.extra_product_price > 0 ? (
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-emerald-50 dark:border-[#1c2938]">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    Extra Product: {currency}{plan.extra_product_price} / each
                  </span>
                </div>
              ) : null}

              {plan.unlimited_amount && plan.unlimited_amount > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-amber-600">
                    Unlimited Option: {currency}{plan.unlimited_amount}
                  </span>
                </div>
              ) : null}
            </div>

            <Button
              onClick={() => handleSelectPlan(plan)}
              className="w-full !py-4 rounded-xl font-bold shadow-lg shadow-emerald-50 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              variant={planAggregates[plan.key] ? "outline" : "primary"}
              disabled={
                (() => {
                  const agg = planAggregates[plan.key];
                  if (!agg) return false;
                  const remaining = Math.max(0, agg.total - agg.used);
                  return remaining === 0 && !plan.extra_product_price && !plan.unlimited_amount;
                })()
              }
            >
              {planAggregates[plan.key] ? 'Add More Products' : 'Select Plan'}
            </Button>
          </div>
        ))}
        {priorityAddons.map((addon) => (
          <div
            key={addon._id}
            className={`relative p-8 rounded-3xl border-2 border-indigo-100 transition-all duration-500 flex flex-col h-full bg-gradient-to-br from-indigo-50/30 to-white group dark:bg-[#0d111c] hover:border-indigo-300 hover:shadow-xl shadow-sm`}
          >
            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">Add-on Active</div>
            <div className="mb-3 text-center">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-100">{addon.plan_name} Addon</h4>
              <p className="text-gray-500 text-xs line-clamp-2 dark:text-gray-400">Exclusive Annual Benefit Listing Slots</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl dark:bg-[#1c2938]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-indigo-600 font-medium">Add-on Slots Remaining</span>
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-200">
                    {Math.max(0, (addon.addon_max_slots || 0) - (addon.addon_product_ids?.length || 0))} / {addon.addon_max_slots || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Extended listing for 1 year</span>
              </div>
            </div>

            <Button
              className={`w-full !py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 btn-primary bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100`}
              onClick={() => handleAddonRefill(addon)}
              variant="primary"
              disabled={isPurchasing}
            >
              {(addon.addon_max_slots || 0) <= (addon.addon_product_ids?.length || 0) ? 'Renew Benefit' : 'Add More Products'}
            </Button>
          </div>
        ))}
      </div>

      {/* History Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Listing Plan History</h2>
          </div>
          {/* Rent / Sell tabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1">
            {(["rent", "sell"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition capitalize ${historyTab === tab
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'rent' ? 'Rent' : 'Sell'} ({tab === 'rent' ? listingRentCount : listingSellCount})
              </button>
            ))}
          </div>
        </div>

        <AgGridTable
          rowData={flattenedPurchaseHistory}
          columns={purchaseHistoryColumns}
          showCheckboxes={false}
          height={400}
          rowHeight={52}
          noRowsMessage="No purchase history found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-6xl w-full"
      >
        <div className="flex flex-col h-[85vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-6 pr-14 py-4 border-b bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Products for {selectedPlan?.name} Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Available Slots: <span className="font-semibold text-emerald-600">
                    {(() => {
                      const agg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                      if (!agg || agg.total === 0) return selectedPlan?.product_limit || 0;
                      const remaining = Math.max(0, agg.total - agg.used);
                      return remaining > 0 ? remaining : selectedPlan?.product_limit;
                    })()}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none"
                  />
                </div>

                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700 gap-1.5 ">
                  <button
                    onClick={() => setActiveTab('Rent')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Rent' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Rent ({rentProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('Sell')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Sell' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sell ({sellProducts.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 overflow-hidden">
            <AgGridTable
              columns={columns}
              rowData={filteredProducts}
              onSelectionChange={handleSelectionChange}
              selectedIds={selectedIdsMap}
              getRowId={(params) => String(params.data.id || params.data._id)}
              showCheckboxes={true}
              height={500}
              rowHeight={65}
              isRowSelectable={(params) => {
                // Allow free products to be selected for listing plans
                // Disable if product is already in ANY active listing plan
                for (const agg of Object.values(planAggregates)) {
                  if (agg.productIds.has(String(params.data.id))) return false;
                }
                return true;
              }}
              getRowStyle={(params) => {
                // Visual feedback for products already in a plan
                let hasPlan = false;
                for (const agg of Object.values(planAggregates)) {
                  if (agg.productIds.has(String(params.data.id))) {
                    hasPlan = true;
                    break;
                  }
                }

                if (hasPlan) {
                  return { opacity: 0.4, pointerEvents: 'none', background: 'rgba(0,0,0,0.03)' };
                }
                return undefined;
              }}
              noRowsMessage="No products found"  
            />
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePurchase()}
              disabled={isPurchasing || selectedProductIds.length === 0 || hasShownLimitToast}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-100/50"
            >
              {isPurchasing ? 'Processing...' : (
                (() => {
                  const agg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                  const remaining = agg ? Math.max(0, agg.total - agg.used) : 0;
                  return (remaining > 0 && selectedProductIds.length <= remaining) ? 'Add to Plan (Free)' : 'Activate Plan';
                })()
              )}
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
        {/* ── FREE LISTING plan (free_listing: true) → Clean GST Confirm Popup ── */}
        {purchaseSummary?.isFreeListing === true ? (
          <div className="p-8 text-center space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-3xl flex items-center justify-center dark:bg-indigo-900/20">
              <Rocket className="text-indigo-500" size={36} />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Confirm Purchase
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed px-4 dark:text-gray-400 font-medium">
                You are about to activate the <strong>{selectedPlan?.name}</strong> plan for <strong>{selectedProductIds.length}</strong> product(s).
              </p>
              {purchaseSummary?.amount > 0 && (
                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  Do you want to purchase this plan?
                </p>
              )}
            </div>

            {/* GST Breakdown */}
            {purchaseSummary && (
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner dark:bg-gray-800/50 dark:border-gray-700 space-y-3 text-left">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Plan Amount</span>
                  <span className="font-bold text-gray-900 dark:text-gray-200">{currency}{purchaseSummary.amount}</span>
                </div>
                {purchaseSummary.amount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">GST (18%)</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">+{currency}{purchaseSummary.gstAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white uppercase text-[10px] tracking-widest font-black">Total Payable</span>
                  <span className="text-xl text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                    {currency}{purchaseSummary.totalAmount}
                  </span>
                </div>
                <p className="text-[10px] text-center text-gray-400 font-medium ">
                  Amount will be deducted from your wallet balance
                </p>
              </div>
            )}

            {/* Free Days Info */}
            {purchaseSummary?.freeProductsInfo && purchaseSummary.freeProductsInfo.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl dark:bg-blue-900/10 dark:border-blue-800 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Free Days Protection</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {purchaseSummary.freeProductsInfo.map((fp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] text-blue-600">
                      <span className="truncate max-w-[180px]">{fp.name}</span>
                      <span className="font-bold">+{fp.days} days later</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full !py-4 rounded-xl font-bold shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all transform active:scale-95"
                onClick={() => handlePurchase(true)}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Processing..." : "Confirm & Activate"}
              </Button>
              <Button
                variant="outline"
                className="w-full py-3.5 rounded-xl text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isPurchasing}
              >
                Back
              </Button>
            </div>
          </div>
        ) : (
          /* ── PAID plan (free_listing: false) → Old Extra Product / Unlimited Choice Popup ── */
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center dark:bg-emerald-900/30">
                <Package className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-bold dark:text-white">Confirm Listing Plan</h3>
            </div>

            <div className="space-y-4 mb-6">
              {/* Header Info */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Active Plan</p>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{selectedPlan?.name} Plan</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Products</p>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedProductIds.length} Selected</h4>
                </div>
              </div>

              {/* Selection Options */}
              <div className="grid grid-cols-1 gap-3">
                {/* Option: Pay per Extra Product */}
                <div
                  onClick={() => {
                    let total = 0;
                    let extra = 0;
                    if (selectedPlan?.free_listing === false) {
                      // Paid plan: charge per product selected
                      extra = selectedProductIds.length;
                      total = extra * (selectedPlan?.extra_product_price || 0);
                    } else {
                      const currentAgg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                      const isFull = !!currentAgg && (currentAgg.total > 0);
                      extra = isFull ? selectedProductIds.length : Math.max(0, selectedProductIds.length - (selectedPlan?.product_limit || 0));
                      const basePrice = isFull ? 0 : (selectedPlan?.price || 0);
                      total = basePrice + (extra * (selectedPlan?.extra_product_price || 0));
                    }
                    const gst = Number((total * 0.18).toFixed(2));
                    setIsUnlimited(false);
                    setPurchaseSummary(prev => prev ? ({ ...prev, isUnlimited: false, amount: total, gstAmount: gst, totalAmount: Number((total + gst).toFixed(2)), extraCount: extra }) : null);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${!isUnlimited ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-emerald-200'}`}
                >
                  {!isUnlimited && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">Selected</div>}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!isUnlimited ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                        {!isUnlimited && <Check size={14} className="text-white" />}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">Pay per Extra Product</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 font-black text-lg">
                        {(() => {
                          const agg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                          const isFull = !!agg && (agg.total > 0 || selectedPlan?.free_listing === false);
                          const extra = isFull ? selectedProductIds.length : Math.max(0, selectedProductIds.length - (selectedPlan?.product_limit || 0));
                          const basePrice = (isFull && selectedPlan?.free_listing === false) ? 0 : (selectedPlan?.price || 0);
                          const extraCost = (selectedPlan?.free_listing === true) ? 0 : (extra * (selectedPlan?.extra_product_price || 0));
                          return currency + (basePrice + extraCost);
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="pl-9 space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Charge: <span className="font-bold text-emerald-600">{currency}{selectedPlan?.extra_product_price}</span> per extra product
                    </p>
                  </div>
                </div>

                {/* Option: Unlimited */}
                {selectedPlan?.unlimited_amount ? (
                  <div
                    onClick={() => {
                      const total = selectedPlan.unlimited_amount!;
                      const gst = Number((total * 0.18).toFixed(2));
                      setIsUnlimited(true);
                      setPurchaseSummary(prev => prev ? ({ ...prev, isUnlimited: true, amount: total, gstAmount: gst, totalAmount: Number((total + gst).toFixed(2)) }) : null);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${isUnlimited ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-amber-200'}`}
                  >
                    {isUnlimited && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">Selected</div>}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isUnlimited ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                          {isUnlimited && <Check size={14} className="text-white" />}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Upgrade to Unlimited</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-600 font-black text-lg">{currency}{selectedPlan.unlimited_amount}</span>
                      </div>
                    </div>
                    <div className="pl-9">
                      <p className="text-xs text-gray-600 dark:text-gray-400">List as many products as you want for {selectedPlan.duration_months} months.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Free Days Info */}
              {purchaseSummary?.freeProductsInfo && purchaseSummary.freeProductsInfo.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl dark:bg-blue-900/10 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Free Days Protection</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {purchaseSummary.freeProductsInfo.map((fp, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] text-blue-600">
                        <span className="truncate max-w-[180px]">{fp.name}</span>
                        <span className="font-bold">+{fp.days} days later</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GST Summary Breakdown */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner dark:bg-gray-800/50 dark:border-gray-700 space-y-3 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Plan Amount</span>
                  <span className="font-bold text-gray-900 dark:text-gray-200">{currency}{purchaseSummary?.amount}</span>
                </div>
                {purchaseSummary && purchaseSummary.amount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">GST (18%)</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">+{currency}{purchaseSummary.gstAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-black border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white uppercase text-[10px] tracking-widest font-black">Total Payable</span>
                  <span className="text-xl text-emerald-600 drop-shadow-sm">
                    {currency}{purchaseSummary?.totalAmount}
                  </span>
                </div>
                <p className="text-[10px] text-center text-gray-400 font-medium  mt-2">
                  Amount will be deducted from your wallet balance
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant="primary"
                className="w-full !py-4 rounded-xl font-bold shadow-xl btn-primary bg-emerald-600 hover:bg-emerald-700 text-white transition-all transform active:scale-95"
                onClick={() => handlePurchase(true)}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Processing..." : "Confirm & Activate"}
              </Button>
              <Button
                variant="outline"
                className="w-full py-3.5 rounded-xl text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isPurchasing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListingPlanView;
