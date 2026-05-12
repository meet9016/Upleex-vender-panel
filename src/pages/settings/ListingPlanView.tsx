"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Package, Search, Check, ShoppingBag, Loader2, AlertCircle, History, Eye, Zap } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import { useWallet } from "@/context/WalletContext";
import { Modal } from "@/components/ui/modal";

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
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [priorityAddons, setPriorityAddons] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [planPreferences, setPlanPreferences] = useState<Record<string, 'extra' | 'unlimited'>>({});
  const [purchaseSummary, setPurchaseSummary] = useState<{ count: number; amount: number; isRefill: boolean; isUnlimited?: boolean; extraCount?: number; extraPrice?: number; isFreeListing?: boolean; remainingFreeDays?: number; freeProductsInfo?: Array<{ name: string, days: number, freeExpiry: string }> } | null>(null);

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
    } else if (isRefillAvailable || isAddonRefill) {
      finalPrice = 0;
    } else if (selectedPlan.free_listing === true) {
      // For free_listing plans, we always charge the base plan amount (amount: 39)
      finalPrice = selectedPlan.price;
      isExtraAddon = false; // It's treated as a bundle purchase
    } else if (isExceeding) {
      if (agg.total > 0 || selectedPlan.free_listing === false) {
        // Case A: Adding to an active plan OR a plan that's already full
        const baseRemaining = selectedPlan.free_listing === false ? 0 : remainingSlots;
        extraCount = Math.max(0, selectedProductIds.length - baseRemaining);
        extraProductCost = extraCount * (selectedPlan.extra_product_price || 0);
        finalPrice = extraProductCost;
        isExtraAddon = true;
      } else {
        // Case B: New plan but exceeding its base limit
        extraCount = Math.max(0, selectedProductIds.length - (selectedPlan.product_limit || 0));
        extraProductCost = extraCount * (selectedPlan.extra_product_price || 0);
        finalPrice = (selectedPlan.price || 0) + extraProductCost;
      }
    }

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

      // Auto-confirm logic: skip popup if price is 0 (for refills) 
      // OR if the plan is a free listing plan (always costs amount: 39 but skip popup as requested)
      // OR if the user has already saved a preference for this plan
      const activePurchase = allPurchasedPlans.find(p => p.plan_type === selectedPlan.key && new Date(p.expire_at) > new Date());
      const savedPref = planPreferences[selectedPlan.key] || 
                       (activePurchase?.is_unlimited ? 'unlimited' : 
                        activePurchase?.is_extra_per_product ? 'extra' : null);
      
      let shouldAutoConfirm = false;
      let finalUnlimitedValue = currentUnlimited;

      if (!isUnlimited && selectedPlan.free_listing === true) {
        shouldAutoConfirm = true;
      } else if (savedPref && !isUnlimited && !isChoiceModalOpen) {
        // If user already chose a method and isn't currently in the "choice" flow
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
        isRefill: (isRefillAvailable || isAddonRefill) && !isExtraAddon && !currentUnlimited,
        isUnlimited: currentUnlimited,
        extraCount: extraCount,
        extraPrice: selectedPlan.extra_product_price,
        freeProductsInfo: freeProductsInfo.length > 0 ? freeProductsInfo : undefined
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
        
        // If selecting more than available slots, check if extra product add-on is available
        if (selectableRows.length > remainingSlots && !selectedPlan.extra_product_price) {
          const limitedRows = selectableRows.slice(0, remainingSlots);
          const ids = limitedRows.map((p) => p.id);
          setSelectedProductIds(ids);
          
          // Show toast only once
          if (!hasShownLimitToast) {
            toast.warning(`You can only select up to ${remainingSlots} product(s) for this plan.`);
            setHasShownLimitToast(true);
          }
          return;
        }
      }
    
    const ids = selectableRows.map((p) => p.id);
    setSelectedProductIds(ids);
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
      productList.forEach((prod: any) => {
        // Try to find full product from local products list for type info
        const prodId = typeof prod === 'string' ? prod : (prod.id || prod._id || prod.product_id);
        const fullProduct = products.find(p => String(p.id) === String(prodId));
        rows.push({
          ...purchase,
          product_name: prod.product_name || fullProduct?.product_name || "-",
          category_name: prod.category_name || fullProduct?.category_name || "-",
          sub_category_name: prod.sub_category_name || fullProduct?.sub_category_name || "-",
          product_type_name: fullProduct?.product_type_name || prod.product_type_name || "-",
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
        <span className=" text-xs font-semibold">{params.value} Plan</span>
      )
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

            {/* Selection Options (Comparison) */}
            <div className="grid grid-cols-1 gap-3">
              {/* Option: Pay per Product */}
              <div 
                onClick={() => {
                  const currentAgg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                  const isFull = !!currentAgg && (currentAgg.total > 0 || selectedPlan?.free_listing === false);
                  const extra = isFull ? selectedProductIds.length : Math.max(0, selectedProductIds.length - (selectedPlan?.product_limit || 0));
                  const basePrice = (isFull && selectedPlan?.free_listing === false) ? 0 : (selectedPlan?.price || 0);
                  const extraPrice = (selectedPlan?.free_listing === true) ? 0 : (extra * (selectedPlan?.extra_product_price || 0));
                  const total = basePrice + extraPrice;
                  
                  setIsUnlimited(false);
                  setPurchaseSummary(prev => prev ? ({ ...prev, isUnlimited: false, amount: total, extraCount: extra }) : null);
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
                    {/* Calculate preview price for this option */}
                    <span className="text-emerald-600 font-black text-lg">
                      {(() => {
                         const agg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                         const isFull = !!agg && (agg.total > 0 || selectedPlan?.free_listing === false);
                         const extra = isFull ? selectedProductIds.length : Math.max(0, selectedProductIds.length - (selectedPlan?.product_limit || 0));
                         const basePrice = (isFull && selectedPlan?.free_listing === false) ? 0 : (selectedPlan?.price || 0);
                         const extraPrice = (selectedPlan?.free_listing === true) ? 0 : (extra * (selectedPlan?.extra_product_price || 0));
                         return currency + (basePrice + extraPrice);
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
                    setIsUnlimited(true);
                    setPurchaseSummary(prev => prev ? ({ ...prev, isUnlimited: true, amount: selectedPlan.unlimited_amount! }) : null);
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

            {/* Free Products Information */}
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
            
            {/* Grand Total Bar */}
            <div className="flex justify-between items-center p-5 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none mt-2">
              <span className="text-white font-bold uppercase text-xs tracking-widest">Grand Total</span>
              <span className="text-3xl font-black text-white">
                {(() => {
                  if (isUnlimited) return currency + (selectedPlan?.unlimited_amount || 0).toLocaleString();
                  const currentAgg = selectedPlan ? planAggregates[selectedPlan.key] : null;
                  const isFull = !!currentAgg && (currentAgg.total > 0 || selectedPlan?.free_listing === false);
                  const extra = isFull ? selectedProductIds.length : Math.max(0, selectedProductIds.length - (selectedPlan?.product_limit || 0));
                  const basePrice = isFull ? 0 : (selectedPlan?.price || 0);
                  const total = basePrice + (extra * (selectedPlan?.extra_product_price || 0));
                  return currency + total.toLocaleString();
                })()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 rounded-xl btn-primary bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handlePurchase(true)}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Confirm Activation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListingPlanView;
