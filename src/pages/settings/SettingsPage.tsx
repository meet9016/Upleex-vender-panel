"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/button/Button";
import { Wallet, Package, Search, Check, Rocket, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useWallet } from "@/context/WalletContext";
import { useFilter } from "@/context/FilterContext";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import BoosterPlanView from "./BoosterPlanView";
import ListingPlanView from "./ListingPlanView";
import ServicePlanView from "./ServicePlanView";
import ServicePriorityPlanView from "./ServicePriorityPlanView";
import { Briefcase, Zap } from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelection, replaceSelections, clearSelections, setMultipleSelections } from "@/store/slices/selectionSlice";

interface PriorityPlan {
  id: string;
  _id?: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  product_slots: number;
  is_popular: boolean;
  free_listing?: boolean;
  is_unlimited?: boolean;
  is_extra_per_product?: boolean;
  is_monthly_extra?: boolean;
  is_monthly_unlimited?: boolean;
  is_yearly_extra?: boolean;
  is_yearly_unlimited?: boolean;
  addon_available_for_yearly?: boolean;
  addon_price_per_year?: number;
  addon_max_slots?: number;
  unlimited_amount_monthly?: number;
  extra_product_price_monthly?: number;
  unlimited_amount_yearly?: number;
  extra_product_price_yearly?: number;
  unlimited_price_monthly?: number;
  unlimited_price_yearly?: number;
  features?: string[];
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
  pricing_type?: 'free' | 'paid';
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
  const [priorityRentCount, setPriorityRentCount] = useState<number>(0);
  const [prioritySellCount, setPrioritySellCount] = useState<number>(0);
  const [listingPurchases, setListingPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PriorityPlan | null>(null);
  
  // Redux state for persistent selection across tabs
  const dispatch = useDispatch();
  const selectedIdsMap = useSelector((state: RootState) => state.selection.selectedIds);
  const selectedProductIds = useMemo(() => 
    Object.keys(selectedIdsMap).filter(id => selectedIdsMap[id]), 
    [selectedIdsMap]
  );

  const setSelectedProductIds = (ids: string[] | ((prev: string[]) => string[])) => {
    const newIds = typeof ids === 'function' ? ids(selectedProductIds) : ids;
    const newMap: Record<string, boolean> = {};
    // When called from outside (e.g. handleSelectionChange or clearing), 
    // it usually means we want to replace the current logical selection.
    // However, if we want to preserve other tabs, we should be careful.
    // For simplicity, if we pass a full array, we assume it's the global selection.
    newIds.forEach(id => newMap[id] = true);
    dispatch(replaceSelections(newMap));
  };
  
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [planPreferences, setPlanPreferences] = useState<Record<string, { monthly: 'extra' | 'unlimited', yearly: 'extra' | 'unlimited' }>>({});
  const [purchaseSummary, setPurchaseSummary] = useState<{ 
    count: number; 
    amount: number; 
    gstAmount: number;
    totalAmount: number;
    isRefill: boolean; 
    isUnlimited?: boolean; 
    extraCount?: number; 
    extraPrice?: number, 
    isFreeListing?: boolean 
  } | null>(null);
  const [priorityHistoryTab, setPriorityHistoryTab] = useState<"rent" | "sell">("rent");
  const [hasShownLimitToast, setHasShownLimitToast] = useState(false); // Track if limit toast was shown
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploadVideo, setUploadVideo] = useState<File | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [pendingVideos, setPendingVideos] = useState<File[]>([]); // Videos waiting to be uploaded when rendering starts
  const { balance, currency, refreshBalance } = useWallet();
  const { filters, isLoadingFilter } = useFilter();
  const historyCacheRef = useRef<Record<string, any[]>>({});
  const initialDataFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const showProduct = !isLoadingFilter && (filters.vendor || (!filters.vendor && !filters.service));
  const showService = !isLoadingFilter && (filters.service || (!filters.vendor && !filters.service));

  // Lazy load videos ONLY when needed (render hone vala h to hi)
  useEffect(() => {
    const hasYearlyPlan = vendorPurchases.some(p => 
      p.plan_duration === 'yearly' && 
      p.status === 'active' && 
      new Date(p.expire_at) > new Date()
    );

    if (hasYearlyPlan && currentTab === "priority" && initialDataFetchedRef.current) {
      const fetchVideos = async () => {
        try {
          const res = await api.get('vendor-store-video');
          setUploadedVideos(res.data?.videos || []);
        } catch (error) {
          console.error("Failed to fetch videos", error);
        }
      };
      fetchVideos();
    }
  }, [vendorPurchases, currentTab, initialDataFetchedRef.current]);

  const fetchData = async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const promises: any[] = [];
      
      // We always need rent/sell data for counts and history
      promises.push(api.get(endPointApi.getVendorPriorityPurchases, { params: { filter_rent_sell: '1' } }).catch(() => ({ data: { total: 0, data: [] } })));
      promises.push(api.get(endPointApi.getVendorPriorityPurchases, { params: { filter_rent_sell: '2' } }).catch(() => ({ data: { total: 0, data: [] } })));

      // Fetch shared data only if not already fetched OR if forcing refresh
      if (!initialDataFetchedRef.current || forceRefresh) {
        promises.push(api.get(endPointApi.getAllPriorityPlans));
        promises.push(api.get(endPointApi.postAllVendorProductList, { params: { limit: 1000 } }));
        promises.push(api.get(endPointApi.getPurchasedPlans));
      }

      const results = await Promise.all(promises);
      const rentRes = results[0];
      const sellRes = results[1];

      const rentData = rentRes.data.data || [];
      console.log("🚀 ~ file: SettingsPage.tsx:263 ~ fetchData ~ rentData:", rentData)
      const sellData = sellRes.data.data || [];
      // Calculate total slots sum for the counts
      const rentTotalSlots = rentData.reduce((acc: number, p: any) => acc + (p.product_ids?.length || 0), 0);
      const sellTotalSlots = sellData.reduce((acc: number, p: any) => acc + (p.product_ids?.length || 0), 0);

      setPriorityRentCount(rentTotalSlots);
      setPrioritySellCount(sellTotalSlots);

      // Cache the history data
      historyCacheRef.current['rent'] = rentData;
      historyCacheRef.current['sell'] = sellData;

      if (!initialDataFetchedRef.current || forceRefresh) {
        const [plansRes, productsRes, listingRes] = results.slice(2);

        const plansData = plansRes.data.data || [];
        const rawProducts = productsRes.data.data || [];
        setListingPurchases(listingRes.data.data || []);

        const normalizedProducts = rawProducts.map((p: any) => {
          let price = p.price;
          if (p.product_type_name?.toLowerCase() === 'rent' && p.product_listing_type_name?.toLowerCase() === 'monthly' && Array.isArray(p.month_arr) && p.month_arr.length) {
            price = p.month_arr[0]?.price ?? price;
          }
          const pid = p.id || p._id;
          // Use the fetched history to find priority status
          const allHistory = [...(historyCacheRef.current['rent']), ...(historyCacheRef.current['sell'])];
          const assocPurchase = allHistory.find(purchase => purchase.product_ids?.some((id: any) => String(id) === String(pid)));
          
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
        initialDataFetchedRef.current = true;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Always sync the state with whatever is in the cache for the current tab
    const cachedData = historyCacheRef.current[priorityHistoryTab];
    if (cachedData) {
      setVendorPurchases(cachedData);
    }
    
    // If not in cache, trigger a fetch
    if (!cachedData) {
      fetchData();
    }
  }, [priorityHistoryTab]);

  // Handle forcing updates to the state after a fetch finishes
  useEffect(() => {
    const cachedData = historyCacheRef.current[priorityHistoryTab];
    if (cachedData) {
      setVendorPurchases(cachedData);
    }
  }, [loading]); // When loading becomes false, sync from cache again

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
    setIsUnlimited(false);
    setIsModalOpen(true);
    if (rentProducts.length === 0 && sellProducts.length > 0) {
      setActiveTab("Sell");
    } else {
      setActiveTab("Rent");
    }
  };

  const allVendorPurchases = useMemo(() => {
    return [
      ...(historyCacheRef.current['rent'] || []),
      ...(historyCacheRef.current['sell'] || [])
    ];
  }, [vendorPurchases, initialDataFetchedRef.current]);

  // Collect ALL product IDs that already have priority plans (from all purchases)
  const priorityProductIds = useMemo(() => {
    const ids = new Set<string>();
    allVendorPurchases.forEach(purchase => {
      purchase.product_ids?.forEach((id: any) => {
        const pid = typeof id === 'object' && id !== null ? (id._id || id.id) : id;
        ids.add(String(pid));
      });
      purchase.addon_product_ids?.forEach((id: any) => {
        const pid = typeof id === 'object' && id !== null ? (id._id || id.id) : id;
        ids.add(String(pid));
      });
    });
    return ids;
  }, [allVendorPurchases]);

  const handlePurchase = async (isConfirmed = false, forcedUnlimited?: boolean, forcedDuration?: 'monthly' | 'yearly') => {
    const targetPlanId = selectedPlan?.id || selectedPlan?._id;
    if (!targetPlanId) return;

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    // Strict limit check requested by user: block if exceeding slots
    const currentDurationForLimit = forcedDuration || planDurations[targetPlanId] || "monthly";
    const activePurchasesForLimit = allVendorPurchases.filter(p =>
      String(p.plan_id) === String(targetPlanId) &&
      p.plan_duration === currentDurationForLimit &&
      new Date(p.expire_at) > new Date()
    );
    const totalSlotsForLimit = activePurchasesForLimit.length > 0
      ? activePurchasesForLimit.reduce((acc, p) => acc + Number(p.total_slots), 0)
      : Number(selectedPlan.product_slots || 0);
    const currentProductIdsForLimit = new Set(activePurchasesForLimit.flatMap(p => p.product_ids.map(id => String(id))));
    const remainingSlotsForLimit = Math.max(0, totalSlotsForLimit - currentProductIdsForLimit.size);

    const isBasicOrStandard = selectedPlan?.name?.toLowerCase() === 'basic' || selectedPlan?.name?.toLowerCase() === 'standard';

    if (!isBasicOrStandard && selectedPlan.free_listing === true && selectedProductIds.length > remainingSlotsForLimit) {
      toast.error(`You cannot select more than ${remainingSlotsForLimit} product(s) for this plan.`);
      return;
    }

    const currentDuration = forcedDuration || planDurations[targetPlanId] || "monthly";
    const currentUnlimited = forcedUnlimited !== undefined ? forcedUnlimited : isUnlimited;
    
    const activePurchases = allVendorPurchases.filter(p =>
      String(p.plan_id) === String(targetPlanId) &&
      p.plan_duration === currentDuration &&
      new Date(p.expire_at) > new Date()
    );

    const totalSlots = activePurchases.length > 0
      ? activePurchases.reduce((acc, p) => acc + Number(p.total_slots), 0)
      : Number(selectedPlan.product_slots || 0);

    const currentProductIds = new Set(activePurchases.flatMap(p => p.product_ids.map(id => String(id))));
    const usedSlots = currentProductIds.size;
    const remainingSlotsCalculated = Math.max(0, totalSlots - usedSlots);
    const isRefillAvailable = activePurchases.length > 0 && remainingSlotsCalculated > 0 && selectedProductIds.length <= remainingSlotsCalculated;

    const isExceeding = 
      selectedPlan.free_listing === false || 
      (activePurchases.length > 0 && selectedProductIds.length > remainingSlotsCalculated) ||
      (!activePurchases.length && selectedProductIds.length > (selectedPlan.product_slots || 0));

    let finalPrice = currentDuration === "monthly" ? selectedPlan.monthly_price : selectedPlan.yearly_price;
    let extraCount = 0;
    let extraProductCost = 0;
    let isExtraAddon = false;
    const extraPrice = currentDuration === "monthly" ? selectedPlan.extra_product_price_monthly : selectedPlan.extra_product_price_yearly;
    const unlimitedAmt = currentDuration === "monthly" ? selectedPlan.unlimited_amount_monthly : selectedPlan.unlimited_amount_yearly;

    if (isBasicOrStandard && activePurchases.length > 0) {
      finalPrice = 0;
      isExtraAddon = false;
    } else if (currentUnlimited && unlimitedAmt) {
      // If user chose unlimited, charge the unlimited amount only once
      // For subsequent purchases, if they already have unlimited active, charge nothing
      const hasActiveUnlimited = activePurchases.some(p => 
        (currentDuration === "monthly" && p.is_monthly_unlimited) ||
        (currentDuration === "yearly" && p.is_yearly_unlimited)
      );
      
      if (hasActiveUnlimited) {
        finalPrice = 0; // No additional charge for unlimited users
      } else {
        finalPrice = unlimitedAmt; // First time unlimited purchase
      }
    } else if (isRefillAvailable) {
      finalPrice = 0;
    } else if (selectedPlan.free_listing === true) {
      finalPrice = finalPrice;
      isExtraAddon = false;
    } else if (isExceeding) {
      // Check if user already has unlimited for this duration
      const hasActiveUnlimited = activePurchases.some(p => 
        (currentDuration === "monthly" && p.is_monthly_unlimited) ||
        (currentDuration === "yearly" && p.is_yearly_unlimited)
      );
      
      if (hasActiveUnlimited) {
        finalPrice = 0; // No charge for unlimited users
      } else if (activePurchases.length > 0 || selectedPlan.free_listing === false) {
        const baseRemaining = selectedPlan.free_listing === false ? 0 : remainingSlotsCalculated;
        extraCount = Math.max(0, selectedProductIds.length - baseRemaining);
        extraProductCost = extraCount * (extraPrice || 0);
        finalPrice = extraProductCost;
        isExtraAddon = true;
      } else {
        extraCount = Math.max(0, selectedProductIds.length - (selectedPlan.product_slots || 0));
        extraProductCost = extraCount * (extraPrice || 0);
        finalPrice = (finalPrice || 0) + extraProductCost;
      }
    }

    if (!isConfirmed) {
      // Auto-confirm logic: skip popup if price is 0 (for refills) 
      const activePurchase = allVendorPurchases.find(p => String(p.plan_id) === String(targetPlanId) && p.plan_duration === currentDuration && new Date(p.expire_at) > new Date());
      const savedPref = planPreferences[targetPlanId]?.[currentDuration];
      
      // Check if user has already made a choice for this plan and duration from the plan itself
      const hasSavedChoice = selectedPlan && (
        (currentDuration === "monthly" && (selectedPlan.is_monthly_extra || selectedPlan.is_monthly_unlimited)) ||
        (currentDuration === "yearly" && (selectedPlan.is_yearly_extra || selectedPlan.is_yearly_unlimited))
      );

      // If user has already made a choice and free_listing is false, use that choice directly
      if (hasSavedChoice && selectedPlan.free_listing === false) {
        let finalUnlimitedValue = false;
        
        // Determine the user's previous choice based on the current duration
        if (currentDuration === "monthly") {
          finalUnlimitedValue = selectedPlan.is_monthly_unlimited || false;
        } else {
          finalUnlimitedValue = selectedPlan.is_yearly_unlimited || false;
        }
        
        setIsModalOpen(false);
        setTimeout(() => handlePurchase(true, finalUnlimitedValue, currentDuration), 10);
        return;
      }

      if (isBasicOrStandard && activePurchases.length > 0) {
        setIsModalOpen(false);
        setTimeout(() => handlePurchase(true, false, currentDuration), 10);
        return;
      }

      let shouldAutoConfirm = false;
      let finalUnlimitedValue = currentUnlimited;

      if (!currentUnlimited && selectedPlan.free_listing === true) {
        shouldAutoConfirm = true;
      } else if (savedPref && !currentUnlimited && !isChoiceModalOpen && selectedPlan.free_listing === true) {
        shouldAutoConfirm = true;
        finalUnlimitedValue = savedPref === 'unlimited';
      }

      if (!isConfirmed && shouldAutoConfirm) {
        // Still calculate summary even for auto-confirm to show the final modal
        const gstAmount = finalPrice > 0 ? Number((finalPrice * 0.18).toFixed(2)) : 0;
        const totalAmountWithGst = Number((finalPrice + gstAmount).toFixed(2));

        setPurchaseSummary({
          count: selectedProductIds.length,
          amount: finalPrice,
          gstAmount: gstAmount,
          totalAmount: totalAmountWithGst,
          isRefill: isRefillAvailable && !isExtraAddon && !finalUnlimitedValue,
          isUnlimited: finalUnlimitedValue,
          extraCount: extraCount,
          extraPrice: extraPrice,
          isFreeListing: selectedPlan.free_listing
        });
        setIsModalOpen(false);
        setIsSummaryModalOpen(true);
        return;
      }

      const gstAmount = finalPrice > 0 ? Number((finalPrice * 0.18).toFixed(2)) : 0;
      const totalAmountWithGst = Number((finalPrice + gstAmount).toFixed(2));

      setPurchaseSummary({
        count: selectedProductIds.length,
        amount: finalPrice,
        gstAmount: gstAmount,
        totalAmount: totalAmountWithGst,
        isRefill: isRefillAvailable && !isExtraAddon && !currentUnlimited,
        isUnlimited: currentUnlimited,
        extraCount: extraCount,
        extraPrice: extraPrice,
        isFreeListing: selectedPlan.free_listing
      });
      setIsModalOpen(false);
      setIsConfirmModalOpen(true);
      return;
    }

    const gstAmount = finalPrice > 0 ? Number((finalPrice * 0.18).toFixed(2)) : 0;
    const totalAmountWithGst = Number((finalPrice + gstAmount).toFixed(2));

    if (totalAmountWithGst > balance) {
      toast.error(`Insufficient wallet balance. Total required including 18% GST is ₹${totalAmountWithGst}.`);
      return;
    }

    setIsPurchasing(true);
    try {
      const apiPayload = {
        plan_id: targetPlanId,
        product_ids: selectedProductIds,
        plan_duration: currentDuration,
        is_addon_purchased: includeAddon,
        addon_product_ids: addonProductIds,
        is_unlimited: currentUnlimited,
        is_extra_per_product: isExceeding && !currentUnlimited && selectedPlan.free_listing === false,
        // Save user's choice flags based on duration
        is_monthly_extra: currentDuration === "monthly" && !currentUnlimited && selectedPlan.free_listing === false,
        is_monthly_unlimited: currentDuration === "monthly" && currentUnlimited,
        is_yearly_extra: currentDuration === "yearly" && !currentUnlimited && selectedPlan.free_listing === false,
        is_yearly_unlimited: currentDuration === "yearly" && currentUnlimited
      };
      
      
      const res = await api.post(endPointApi.purchasePriorityPlan, apiPayload);

      if (res.data.success) {
        toast.success(res.data.message || "Priority plan updated successfully!");
        setIsModalOpen(false);
        setIsAddonModalOpen(false);
        setIsConfirmModalOpen(false);
        refreshBalance();
        
        if (isExceeding && selectedPlan.free_listing === false) {
          setPlanPreferences(prev => ({
            ...prev,
            [targetPlanId]: {
              ...prev[targetPlanId],
              [currentDuration]: currentUnlimited ? 'unlimited' : 'extra'
            }
          }));
        }

        historyCacheRef.current = {};
        initialDataFetchedRef.current = false;
        fetchData(true);
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

  const handleVideoUpload = async () => {
    if (!uploadVideo) return;

    if (uploadedVideos.length >= 4) {
      toast.error("You can upload a maximum of 4 promotional videos.");
      return;
    }

    // Upload immediately
    setIsVideoUploading(true);
    const toastId = toast.loading("Uploading store video...");
    try {
      const formData = new FormData();
      formData.append('video', uploadVideo);
      const res = await api.post('vendor-store-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success("Store promotional video uploaded successfully!");
        setUploadVideo(null);

        // Reset file input visually
        const fileInput = document.getElementById('promotional-video-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        if (res.data.video_url) {
          setUploadedVideos(prev => [...prev, res.data.video_url]);
        }
      } else {
        toast.error("Failed to upload video");
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error?.response?.data?.message || "Failed to upload video");
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleDeleteVideoClick = (videoUrl: string) => {
    setVideoToDelete(videoUrl);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    const toastId = toast.loading("Deleting video...");
    try {
      const res = await api.delete('vendor-store-video', { data: { video_url: videoToDelete } });
      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success("Video deleted successfully!");
        setUploadedVideos(prev => prev.filter(url => url !== videoToDelete));
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error?.response?.data?.message || "Failed to delete video");
    } finally {
      setVideoToDelete(null);
    }
  };

  const getPricingForOption = (duration: "monthly" | "yearly", unlimited: boolean) => {
    if (!selectedPlan) return { finalPrice: 0, gstAmount: 0, totalAmount: 0, extraCount: 0, extraPrice: 0 };
    const targetPlanId = selectedPlan.id || selectedPlan._id;
    const activePurchases = allVendorPurchases.filter(p =>
      String(p.plan_id) === String(targetPlanId) &&
      p.plan_duration === duration &&
      new Date(p.expire_at) > new Date()
    );

    const totalSlots = activePurchases.length > 0
      ? activePurchases.reduce((acc, p) => acc + Number(p.total_slots), 0)
      : Number(selectedPlan.product_slots || 0);

    const currentProductIds = new Set(activePurchases.flatMap(p => p.product_ids.map(id => String(id))));
    const usedSlots = currentProductIds.size;
    const remainingSlotsCalculated = Math.max(0, totalSlots - usedSlots);
    const isRefillAvailable = activePurchases.length > 0 && remainingSlotsCalculated > 0 && selectedProductIds.length <= remainingSlotsCalculated;

    const isExceeding = 
      selectedPlan.free_listing === false || 
      (activePurchases.length > 0 && selectedProductIds.length > remainingSlotsCalculated) ||
      (!activePurchases.length && selectedProductIds.length > (selectedPlan.product_slots || 0));

    let finalPrice = duration === "monthly" ? selectedPlan.monthly_price : selectedPlan.yearly_price;
    let extraCount = 0;
    const extraPrice = duration === "monthly" ? selectedPlan.extra_product_price_monthly : selectedPlan.extra_product_price_yearly;
    const unlimitedAmt = duration === "monthly" ? selectedPlan.unlimited_amount_monthly : selectedPlan.unlimited_amount_yearly;

    const isBasicOrStandard = selectedPlan?.name?.toLowerCase() === 'basic' || selectedPlan?.name?.toLowerCase() === 'standard';

    if (isBasicOrStandard && activePurchases.length > 0) {
      finalPrice = 0;
    } else if (unlimited && unlimitedAmt) {
      finalPrice = unlimitedAmt;
    } else if (isRefillAvailable) {
      finalPrice = 0;
    } else if (selectedPlan.free_listing === true) {
      finalPrice = finalPrice;
    } else if (isExceeding) {
      if (activePurchases.length > 0 || selectedPlan.free_listing === false) {
        const baseRemaining = selectedPlan.free_listing === false ? 0 : remainingSlotsCalculated;
        extraCount = Math.max(0, selectedProductIds.length - baseRemaining);
        finalPrice = extraCount * (extraPrice || 0);
      } else {
        extraCount = Math.max(0, selectedProductIds.length - (selectedPlan.product_slots || 0));
        finalPrice = (finalPrice || 0) + extraCount * (extraPrice || 0);
      }
    }

    const gstAmount = finalPrice > 0 ? Number((finalPrice * 0.18).toFixed(2)) : 0;
    const totalAmount = Number((finalPrice + gstAmount).toFixed(2));

    return { finalPrice, gstAmount, totalAmount, extraCount, extraPrice };
  };

  const columns = useMemo((): ColDef[] => [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 180,
      flex: 2,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0 relative group">
              <img
                src={imageUrl}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[12px] sm:text-[13px] text-gray-800 dark:text-gray-100 truncate">
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
      minWidth: 100,
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="text-gray-600 font-medium text-xs sm:text-sm">{params.value || "-"}</span>
      )
    },
    {
      headerName: "Pricing",
      field: "pricing_type",
      minWidth: 80,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={(params.value || 'paid').toLowerCase() === 'free' ? 'free' : 'paid'} />
        </div>
      )
    },
    {
      headerName: "Plan",
      field: "active_plan_name",
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => (
        params.value ? (
          <StatusBadge status={params.value} />
        ) : <span className="text-gray-400 font-medium">-</span>
      )
    },

    {
      headerName: "Price",
      field: "price",
      minWidth: 80,
      flex: 1,
      valueFormatter: (params) => `${currency}${params.value?.toLocaleString()}`
    },
    {
      headerName: "Stock",
      field: "available_quantity",
      minWidth: 70,
      flex: 1,
      cellRenderer: (params: any) => {
        const qty = params.value || 0;
        return (
          <div className="flex items-center h-full">
            <span className={`text-xs sm:text-sm font-bold ${qty <= 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
              {qty} {qty <= 0 && "(OOS)"}
            </span>
          </div>
        );
      }
    },

    {
      headerName: "Expiry",
      field: "priority_expiry",
      minWidth: 90,
      flex: 1,
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
      minWidth: 160,
      flex: 2,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3 h-full">
            <img
              src={imageUrl}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover border"
              onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
            />
            <span className="font-bold text-[12px] sm:text-[13px] truncate">{product.product_name}</span>
          </div>
        );
      }
    },
    {
      headerName: "Stock",
      field: "available_quantity",
      minWidth: 70,
      flex: 1,
    },
    {
      headerName: "Expiry",
      field: "expires_at",
      minWidth: 80,
      flex: 1,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB') : "-"
    },
    {
      headerName: "Plan",
      field: "id",
      minWidth: 90,
      flex: 1,
      cellRenderer: (p: any) => {
        const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(p.value)));
        return hasListing ? <StatusBadge status="Listing Active" /> : <span className="text-gray-400">-</span>;
      }
    }
  ], [listingPurchases]);

  const flattenedPriorityHistory = useMemo(() => {
    const rows: any[] = [];
    vendorPurchases.forEach(purchase => {
      const allProductRefs = [
        ...(purchase.product_ids || []).map(p => ({ p, type: 'Priority' })),
        ...(purchase.addon_product_ids || []).map(p => ({ p, type: 'Add-on' }))
      ];

      if (allProductRefs.length === 0) {
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

      allProductRefs.forEach(({ p: pRef, type: slotType }, index) => {
        // Handle both populated objects and ID strings
        const isPopulated = typeof pRef === 'object' && pRef !== null;
        const pId = isPopulated ? (pRef._id || pRef.id) : pRef;
        const product = products.find(p => String(p.id) === String(pId)) || (isPopulated ? pRef : null);

        let isExtraSlot = false;
        if (slotType === 'Priority' && purchase.is_extra_per_product) {
          isExtraSlot = index >= (purchase.total_slots || 0);
        }

        rows.push({
          ...purchase,
          plan_name: slotType === 'Add-on' ? `${purchase.plan_name} (Benefit)` : purchase.plan_name,
          product_name: product?.product_name || `Product: ${pId}`,
          category_name: product?.category_name || "-",
          sub_category_name: (product as any)?.sub_category_name || "-",
          product_type_name: product?.product_type_name || "-",
          is_addon_slot: slotType === 'Add-on',
          is_extra_slot: isExtraSlot
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
      minWidth: 150,
      flex: 2,
      cellRenderer: (params: any) => (
        <span className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{params.value}</span>
      )
    },
    {
      headerName: "Category",
      field: "category_name",
      minWidth: 100,
      flex: 1,
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      minWidth: 100,
      flex: 1,
    },
    {
      headerName: "Plan",
      field: "plan_name",
      minWidth: 100,
      flex: 1,
    },
    {
      headerName: "Usage Type",
      field: "is_unlimited",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (data.is_addon_slot) return <span className="text-teal-600 bg-teal-50 px-2 py-1 rounded-md text-xs font-semibold">Add-on Benefit</span>;
        if (data.is_unlimited) return <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-semibold">Unlimited</span>;
        if (data.is_extra_slot) return <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-semibold">Extra (Paid)</span>;
        return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-semibold">Base Slot</span>;
      }
    },
    {
      headerName: "Duration",
      field: "plan_duration",
      minWidth: 100,
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="capitalize">{params.value || "Monthly"}</span>
      )
    },
    {
      headerName: "Expiry",
      field: "expire_at",
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => {
        if (!params.value) return "-";
        const date = new Date(params.value);
        return (
          <span className="text-xs sm:text-sm">{date.toLocaleDateString('en-GB')}</span>
        );
      }
    },
    {
      headerName: "Status",
      field: "expire_at",
      minWidth: 80,
      flex: 1,
      cellRenderer: (params: any) => {
        const isExpired = new Date(params.value) < new Date();
        return <StatusBadge status={isExpired ? "expired" : "active"} />;
      }
    }
  ], []);

  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  const filteredProducts = useMemo(() => {
    return currentTabProducts.map(p => ({
      ...p,
      isPriorityProduct: priorityProductIds.has(String(p.id || p._id))
    })).filter(p =>
      p.product_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch, priorityProductIds]);

  const handleSelectionChange = (rows: Product[]) => {
    // Filter out products that already have priority plans
    const selectableRows = rows.filter((p) => {
      const pid = p.id || (p as any)._id;
      const hasPriorityPlan = allVendorPurchases.some(vp => 
        vp.product_ids?.some((id: any) => String(id) === String(pid))
      );
      return !hasPriorityPlan;
    });

    // Limit check for Priority Plan only if no extra/unlimited options
    if (selectedPlan) {
      const targetPlanId = selectedPlan.id || selectedPlan._id;
      const currentDuration = planDurations[targetPlanId] || "monthly";
      const extraPrice = currentDuration === "monthly" ? selectedPlan.extra_product_price_monthly : selectedPlan.extra_product_price_yearly;
      const unlimitedPrice = currentDuration === "monthly" ? selectedPlan.unlimited_amount_monthly : selectedPlan.unlimited_amount_yearly;

      const activePurchases = allVendorPurchases.filter(p =>
        String(p.plan_id) === String(targetPlanId) &&
        p.plan_duration === currentDuration
      );
      const totalSlots = activePurchases.length > 0
        ? activePurchases.reduce((acc, p) => acc + Number(p.total_slots), 0)
        : Number(selectedPlan.product_slots || 0);

      const currentProductIds = new Set(activePurchases.flatMap(p => p.product_ids.map(id => String(id))));
      const usedSlots = currentProductIds.size;
      const remainingSlots = Math.max(0, totalSlots - usedSlots);

      // Only limit if no extra/unlimited options, UNLESS it's a refill for Basic/Standard
      const isBasicOrStandard = selectedPlan?.name?.toLowerCase() === 'basic' || selectedPlan?.name?.toLowerCase() === 'standard';
      const hasActivePurchase = activePurchases.length > 0;
      const shouldBypassLimit = isBasicOrStandard && hasActivePurchase;

      if (!shouldBypassLimit && selectableRows.length > remainingSlots) {
        const limitedRows = selectableRows.slice(0, remainingSlots);
        const ids = limitedRows.map((p) => p.id || (p as any)._id);
        setSelectedProductIds(ids);

        if (!hasShownLimitToast) {
          toast.warning(`You can only select up to ${remainingSlots} product(s) for this plan.`);
          setHasShownLimitToast(true);
        }
        return;
      }
    }

    const ids = selectableRows.map((p) => p.id || (p as any)._id);
    setSelectedProductIds(ids);
    setHasShownLimitToast(false);
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
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit dark:bg-[#1c2938]">
            {showProduct && (
              <button
                onClick={() => setPlanScope("product")}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${planScope === "product"
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
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${planScope === "service"
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
          <div className="flex p-1 sm:p-1.5 bg-gray-100/80 rounded-xl sm:rounded-2xl w-fit sm:w-auto dark:bg-[#1c2938] gap-1 sm:gap-1.5">
            <Button
              variant={currentTab === "priority" ? "secondary" : "ghost"}
              onClick={() => setCurrentTab("priority")}
              className={`px-3 py-2.5 cursor-pointer rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "priority"
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
              className={`px-3 py-2.5 cursor-pointer rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "booster"
                ? "bg-white  shadow-md ring-1 ring-black/[0.04]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <Rocket size={15} className={currentTab === "booster" ? "text-indigo-500" : "text-gray-400"} />
              <span>Booster</span>
            </Button>
            <Button
              variant={currentTab === "listing" ? "secondary" : "ghost"}
              onClick={() => setCurrentTab("listing")}
              className={`px-3 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 h-auto ${currentTab === "listing"
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
              className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap h-auto ${currentServiceTab === "listing"
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
              className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap h-auto ${currentServiceTab === "priority"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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

              {/* {selectedPlan && (
                (() => {
                  const currentDuration = planDurations[selectedPlan.id || selectedPlan._id || ''] || "monthly";
                  const extraPrice = currentDuration === "monthly" ? selectedPlan.extra_product_price_monthly : selectedPlan.extra_product_price_yearly;
                  const unlimitedAmt = currentDuration === "monthly" ? selectedPlan.unlimited_amount_monthly : selectedPlan.unlimited_amount_yearly;
                  
                  if (!extraPrice && !unlimitedAmt) return null;

                  return (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-900/10 dark:border-amber-900/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center dark:bg-amber-900/30">
                          <Rocket className="text-amber-600" size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-100">Need more slots?</p>
                          <p className="text-[10px] text-amber-600 font-medium italic">
                            Pay {currency}{extraPrice} per extra product or upgrade to Unlimited
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm dark:bg-gray-800 dark:border-amber-900/50">
                          <input 
                            type="checkbox" 
                            id="unlimited-toggle"
                            checked={isUnlimited}
                            onChange={(e) => setIsUnlimited(e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                          />
                          <label htmlFor="unlimited-toggle" className="text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                            Upgrade to Unlimited ({currency}{unlimitedAmt})
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )} */}
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
                  // For Addon: Filter out products that already have listing plans
                  const selectableRows = rows.filter((p) => {
                    const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(p.id || (p as any)._id)));
                    return !hasListing;
                  });
                  const ids = selectableRows.map(p => p.id || (p as any)._id);
                  setAddonProductIds(ids);
                } else {
                  // For Priority Plan: Filter out products that already have priority plans
                  const selectableRows = rows.filter((p) => {
                    const pid = p.id || (p as any)._id;
                    const hasPriorityPlan = allVendorPurchases.some(vp => 
                      vp.product_ids?.some((id: any) => String(id) === String(pid))
                    );
                    return !hasPriorityPlan;
                  });
                  
                  // Check priority plan slot limit
                  if (selectedPlan) {
                    const totalSlots = selectedPlan.product_slots || 0;
                    const currentRemaining = remainingSlots || totalSlots;
                    const hasExtraOption = selectedPlan.extra_product_price_monthly || selectedPlan.extra_product_price_yearly;
                    const hasUnlimitedOption = selectedPlan.unlimited_amount_monthly || selectedPlan.unlimited_amount_yearly;
                    
                    // If exceeding limit
                    const isBasicOrStandard = selectedPlan?.name?.toLowerCase() === 'basic' || selectedPlan?.name?.toLowerCase() === 'standard';
                    const hasActivePurchase = activePurchasesForPlan.length > 0;
                    
                    if (selectedPlan.free_listing === true && selectableRows.length > currentRemaining) {
                      // Bypass limit for Basic/Standard if active purchase exists
                      if (isBasicOrStandard && hasActivePurchase) {
                        // Let them select unlimited products
                      } else {
                        // For ALL plans (including Premium): auto-unchecked extra checkboxes
                        const limitedRows = selectableRows.slice(0, currentRemaining);
                        const ids = limitedRows.map(p => p.id || (p as any)._id);
                        
                        const updateMap: Record<string, boolean> = {};
                        filteredProducts.forEach(p => {
                          updateMap[String(p.id || p._id)] = false;
                        });
                        ids.forEach(id => {
                          updateMap[String(id)] = true;
                        });
                        dispatch(setMultipleSelections(updateMap));

                        if (!hasShownLimitToast) {
                          toast.warning(`Limit exceeded! This plan allows only ${currentRemaining} product(s).`);
                          setHasShownLimitToast(true);
                        }
                        return;
                      }
                    }
                  }
                  
                  const ids = selectableRows.map(p => p.id || (p as any)._id);
                  
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
                }
              }}
              selectedIds={selectedIdsMap}
              getRowId={(params) => String(params.data.id || params.data._id)}
              showCheckboxes={true}
              height={420}
              rowHeight={45}
              isRowSelectable={(params) => {
                if (isAddonModalOpen) {
                  // For Addon: Block if already has listing plan
                  const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(params.data.id || params.data._id)));
                  return !hasListing;
                }
                // For Priority Plan: Block if already has priority plan
                // Allow free products (same as Booster and Listing plans)
                return !params.data.isPriorityProduct;
              }}
              getRowStyle={(params) => {
                if (isAddonModalOpen) {
                  // For Addon: Disable if already has listing plan
                  const hasListing = listingPurchases.some(lp => lp.product_ids?.some((pr: any) => String(pr.id || pr._id || pr) === String(params.data.id || params.data._id)));
                  if (hasListing) {
                    return { opacity: 0.4, pointerEvents: 'none', background: 'rgba(0,0,0,0.03)' };
                  }
                } else {
                  // For Priority Plan: Disable if already has priority plan
                  if (params.data.isPriorityProduct) {
                    return { opacity: 0.4, pointerEvents: 'none', background: 'rgba(0,0,0,0.03)' };
                  }
                }
                return undefined;
              }}
              noRowsMessage="No priority purchases yet"
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
        className="max-w-4xl w-full"
      >
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center dark:bg-blue-900/30">
              <Zap className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">Choose Your Plan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select which option works best for you</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {/* Monthly Options */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Monthly Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsUnlimited(false);
                    setPlanDurations(prev => ({ ...prev, [selectedPlan?.id || '']: "monthly" }));
                    setIsConfirmModalOpen(false);
                    setTimeout(() => handlePurchase(true, false, "monthly"), 100);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${!isUnlimited && (planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly") === "monthly" ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'}`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="font-bold text-gray-900 dark:text-white mt-1">Extra Product</span>
                    {(() => {
                      const amount = selectedPlan?.extra_product_price_monthly || 0;
                      const gst = Number((amount * 0.18).toFixed(2));
                      const total = Number((amount + gst).toFixed(2));
                      return (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 whitespace-nowrap">Amount: {currency}{amount}</div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">+ GST (18%): {currency}{gst}</div>
                          <div className="text-base font-black text-blue-600 whitespace-nowrap">Total: {currency}{total}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pay per additional product. Click to purchase directly.</p>
                </button>

                <button
                  onClick={() => {
                    setIsUnlimited(true);
                    setPlanDurations(prev => ({ ...prev, [selectedPlan?.id || '']: "monthly" }));
                    setIsConfirmModalOpen(false);
                    setTimeout(() => handlePurchase(true, true, "monthly"), 100);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${isUnlimited && (planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly") === "monthly" ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="font-bold text-gray-900 dark:text-white mt-1">Unlimited</span>
                    {(() => {
                      const amount = selectedPlan?.unlimited_amount_monthly || 0;
                      const gst = Number((amount * 0.18).toFixed(2));
                      const total = Number((amount + gst).toFixed(2));
                      return (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 whitespace-nowrap">Amount: {currency}{amount}</div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">+ GST (18%): {currency}{gst}</div>
                          <div className="text-base font-black text-indigo-600 whitespace-nowrap">Total: {currency}{total}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlimited products for a fixed price. Click to purchase.</p>
                </button>
              </div>
            </div>

            {/* Yearly Options */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Yearly Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsUnlimited(false);
                    setPlanDurations(prev => ({ ...prev, [selectedPlan?.id || '']: "yearly" }));
                    setIsConfirmModalOpen(false);
                    setTimeout(() => handlePurchase(true, false, "yearly"), 100);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${!isUnlimited && (planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly") === "yearly" ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'}`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="font-bold text-gray-900 dark:text-white mt-1">Extra Product</span>
                    {(() => {
                      const amount = selectedPlan?.extra_product_price_yearly || 0;
                      const gst = Number((amount * 0.18).toFixed(2));
                      const total = Number((amount + gst).toFixed(2));
                      return (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 whitespace-nowrap">Amount: {currency}{amount}</div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">+ GST (18%): {currency}{gst}</div>
                          <div className="text-base font-black text-blue-600 whitespace-nowrap">Total: {currency}{total}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pay per additional product. Click to purchase directly.</p>
                </button>

                <button
                  onClick={() => {
                    setIsUnlimited(true);
                    setPlanDurations(prev => ({ ...prev, [selectedPlan?.id || '']: "yearly" }));
                    setIsConfirmModalOpen(false);
                    setTimeout(() => handlePurchase(true, true, "yearly"), 100);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${isUnlimited && (planDurations[selectedPlan?.id || selectedPlan?._id || ''] || "monthly") === "yearly" ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="font-bold text-gray-900 dark:text-white mt-1">Unlimited</span>
                    {(() => {
                      const amount = selectedPlan?.unlimited_amount_yearly || 0;
                      const gst = Number((amount * 0.18).toFixed(2));
                      const total = Number((amount + gst).toFixed(2));
                      return (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 whitespace-nowrap">Amount: {currency}{amount}</div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">+ GST (18%): {currency}{gst}</div>
                          <div className="text-base font-black text-indigo-600 whitespace-nowrap">Total: {currency}{total}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlimited products for a fixed price. Click to purchase.</p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="px-6 py-2 rounded-xl"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Final Summary Modal */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        className="max-w-md w-full"
      >
        <div className="p-8 text-center space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto bg-brand-50 rounded-3xl flex items-center justify-center animate-bounce dark:bg-brand-900/20">
            <Rocket className="text-brand-600" size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Confirm Purchase
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed px-4 dark:text-gray-400 font-medium">
              You are about to purchase priority status for <strong>{purchaseSummary?.count}</strong> product(s).
              {purchaseSummary?.isFreeListing && purchaseSummary?.amount > 0 && (
                <span className="block mt-2 text-brand-600 font-bold">
                  Do you want to purchase this plan? (Kya aap plan lena chahte ho?)
                </span>
              )}
            </p>
          </div>

          {purchaseSummary && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner dark:bg-gray-800/50 dark:border-gray-700 space-y-3">
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
              <div className="flex justify-between items-center text-base font-black border-t pt-3 border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-gray-900 dark:text-white uppercase text-[10px] tracking-widest font-black">Total Payable</span>
                <span className="text-2xl text-brand-600 drop-shadow-sm">
                  {currency}{purchaseSummary.totalAmount}
                </span>
              </div>
              <p className="text-[10px] text-center text-gray-400 font-medium mt-2">
                Amount will be deducted from your wallet balance
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              className="w-full !py-4 rounded-xl font-bold shadow-xl btn-primary transform active:scale-95 transition-all"
              onClick={() => {
                setIsSummaryModalOpen(false);
                handlePurchase(true);
              }}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Confirm & Activate"}
            </Button>
            <Button
              variant="outline"
              className="w-full py-3.5 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsSummaryModalOpen(false)}
              disabled={isPurchasing}
            >
              Back
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

                {/* Video Upload Section (Outside Modal) */}
                {/* Video Upload Section - Only for Yearly Priority Plan */}
                {vendorPurchases.some(p =>
                  p.plan_duration === 'yearly' &&
                  p.status === 'active' &&
                  new Date(p.expire_at) > new Date()
                ) ? (
                <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4 dark:bg-[#0d111c] dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Store Promotional Video</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Upload up to 4 videos to showcase on your public store profile. Attract more customers!
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                        <input 
                          id="promotional-video-upload"
                          type="file" 
                          accept="video/*" 
                          disabled={isVideoUploading || uploadedVideos.length >= 4}
                          onChange={(e) => setUploadVideo(e.target.files?.[0] || null)}
                          className="flex-1 text-sm text-gray-500 file:cursor-pointer file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50 dark:file:bg-brand-900/30 dark:file:text-brand-400"
                        />
                        <Button
                          variant="primary"
                          onClick={handleVideoUpload}
                          disabled={isVideoUploading || !uploadVideo || uploadedVideos.length >= 4}
                          className="px-6 py-2.5 rounded-xl whitespace-nowrap btn-primary font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                          {isVideoUploading ? "Uploading..." : (uploadedVideos.length >= 4 ? "Limit Reached" : "Upload Video")}
                        </Button>
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-400">
                        {uploadedVideos.length}/4 videos uploaded
                      </span>
                    </div>
                  </div>

                 {uploadedVideos.length > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
    <div className="flex gap-4 sm:gap-6 pb-2 min-w-max">
      {uploadedVideos.map((video, idx) => (
        <div
          key={idx}
          className="relative w-64 sm:w-80 aspect-video bg-gray-100 rounded-2xl overflow-hidden group border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
        >
          <video src={video} controls className="w-full h-full object-cover" />

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => handleDeleteVideoClick(video)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
              title="Delete Video"
            >
              <MdDelete size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
                </div>
                ) : (
                  <div className="mb-6 bg-white border border-dashed border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 dark:bg-[#0d111c] dark:border-amber-700">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0 dark:bg-amber-900/30 mt-1 sm:mt-0">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Store Promotional Video</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This feature is available exclusively for vendors with an active <strong>Yearly Priority Plan</strong>.</p>
                      </div>
                    </div>
                    <div className="ml-[52px] sm:ml-0 self-start sm:self-auto">
                      <span className="text-[10px] sm:text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap">Yearly Plan Required</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                  {plans.map((plan) => {
                    const planId = plan.id || (plan as any)._id;
                    const durationToggle = planDurations[planId] || "monthly";

                    const monthlyPurchases = allVendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "monthly");
                    const yearlyPurchases = allVendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "yearly");

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
  className={`
    relative p-4 sm:p-5 md:p-6 lg:p-8 
    rounded-xl sm:rounded-2xl md:rounded-3xl 
    border transition-all duration-500 
    flex flex-col h-full 
    bg-white dark:bg-[#0d111c] group
    ${plan.is_popular
      ? 'border-brand-500 shadow-2xl shadow-brand-100 md:scale-[1.02] z-10'
      : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'
    }
  `}
>
  {plan.is_popular && (
    <span className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest shadow-lg whitespace-nowrap">
      Recommended
    </span>
  )}

  <div className="mb-3 sm:mb-4 flex flex-col items-center text-center">
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
    </div>
    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 dark:text-gray-300 line-clamp-1">
      {plan.name}
    </h4>
  </div>

  {/* Duration Buttons - Responsive Grid */}
  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
    {(["monthly", "yearly"] as const).map((dur) => {
      const isSelected = (planDurations[planId] || "monthly") === dur;
      const price = dur === "monthly" ? plan.monthly_price : plan.yearly_price;
      return (
        <button
          key={dur}
          onClick={() => setPlanDurations(prev => ({ ...prev, [planId]: dur }))}
          className={`
            flex flex-col gap-0.5 sm:gap-1 
            p-3 sm:p-4 
            rounded-xl sm:rounded-2xl 
            border-2 transition-all 
            ${isSelected
              ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-[#0d111c] shadow-md"
              : "border-gray-200 bg-gray-50 dark:bg-[#0d111c] dark:border-gray-700 hover:border-brand-200"
            }
          `}
        >
          <span className={`
            text-[10px] sm:text-xs font-bold uppercase tracking-wide 
            ${isSelected ? "text-brand-500" : "text-gray-400"}
          `}>
            {dur === "monthly" ? "Monthly" : "Yearly"}
          </span>
          <div className="flex items-baseline gap-0.5 flex-wrap">
            <span className={`
              text-lg sm:text-2xl font-black 
              ${isSelected ? "text-brand-600" : "text-gray-400"}
            `}>
              {currency}{price}
            </span>
            <span className={`
              text-[10px] sm:text-xs font-bold 
              ${isSelected ? "text-gray-500" : "text-gray-400"}
            `}>
              /{dur === "monthly" ? "mo" : "yr"}
            </span>
          </div>
        </button>
      );
    })}
  </div>

  {/* Active Slots Section - Responsive */}
  {isDurationActive && (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-100 rounded-lg sm:rounded-xl dark:bg-[#1c2938]">
      <div className="flex justify-between items-center text-sm">
        <div>
          <span className="text-green-600 font-bold text-[10px] sm:text-xs uppercase tracking-tight">
            Active {durationToggle} Slots
          </span>
          <p className="text-[9px] sm:text-[10px] text-green-500">
            Remaining for current period
          </p>
        </div>
        <span className="font-black text-green-800 dark:text-green-200 text-xl sm:text-2xl">
          {currentRemaining}
        </span>
      </div>
    </div>
  )}

  {/* Features List - Responsive */}
  <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-8 flex-grow">
    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
      <div className="mt-0.5 sm:mt-1 bg-green-100 p-1 sm:p-1.5 rounded-full flex-shrink-0">
        <Check className="text-green-600" size={10} />
      </div>
      <div>
        <p className="text-gray-900 font-bold text-xs sm:text-sm dark:text-gray-300">
          {plan.product_slots} Product Slots
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">
          Add up to {plan.product_slots} items
        </p>
      </div>
    </div>
    
    {/* Other Dynamic Features from Backend */}
  {(plan.features || []).map((feature, fIdx) => (
  <div key={fIdx} className="flex items-center gap-2 sm:gap-3 md:gap-4">
    <div className="bg-green-100 p-1 sm:p-1.5 rounded-full flex-shrink-0 flex items-center justify-center">
      <Check className="text-green-600" size={10} />
    </div>
    <p className="text-gray-900 text-xs sm:text-sm dark:text-gray-300 leading-tight">
      {feature}
    </p>
  </div>
))}

    {/* Premium Extras (Extra Product / Unlimited) */}
    {((durationToggle === "monthly" && (plan.extra_product_price_monthly || plan.unlimited_amount_monthly || plan.unlimited_price_monthly)) || 
      (durationToggle === "yearly" && (plan.extra_product_price_yearly || plan.unlimited_amount_yearly || plan.unlimited_price_yearly))) && (
      <div className=" border-t border-gray-100 dark:border-gray-800 space-y-2 text-left w-full">
        {/* Monthly Extras Section */}
        {durationToggle === "monthly" && (plan.extra_product_price_monthly > 0 || plan.unlimited_amount_monthly > 0 || plan.unlimited_price_monthly > 0) && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Monthly Extras
            </p>
            {plan.extra_product_price_monthly > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  Extra Product: {currency}{plan.extra_product_price_monthly} / mo
                </span>
              </div>
            )}
            {(plan.unlimited_amount_monthly > 0 || plan.unlimited_price_monthly > 0) && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-amber-600">
                  Unlimited Option: {currency}{plan.unlimited_amount_monthly || plan.unlimited_price_monthly}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Yearly Extras Section */}
        {durationToggle === "yearly" && (plan.extra_product_price_yearly > 0 || plan.unlimited_amount_yearly > 0 || plan.unlimited_price_yearly > 0) && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Yearly Extras
            </p>
            {plan.extra_product_price_yearly > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  Extra Product: {currency}{plan.extra_product_price_yearly} / yr
                </span>
              </div>
            )}
            {(plan.unlimited_amount_yearly > 0 || plan.unlimited_price_yearly > 0) && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-amber-600">
                  Unlimited Option: {currency}{plan.unlimited_amount_yearly || plan.unlimited_price_yearly}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
    
  {/* Button - Responsive */}
  <Button
    onClick={() => handleSelectPlan(plan)}
    variant={plan.is_popular ? 'primary' : 'outline'}
    disabled={
      isDurationActive &&
      currentRemaining === 0 &&
      !((durationToggle === "monthly" && (plan.extra_product_price_monthly || plan.unlimited_amount_monthly)) ||
        (durationToggle === "yearly" && (plan.extra_product_price_yearly || plan.unlimited_amount_yearly)))
    }
    className="w-full !py-2.5 sm:!py-3 md:!py-3.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isDurationActive ? 'Add More Products' : 'Select Plan'}
  </Button>
</div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Purchase History */}
              <div className="space-y-3 md:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-brand-600" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Plan History</h2>
                  </div>
                  <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1 w-full sm:w-auto">
                    {(["rent", "sell"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setPriorityHistoryTab(tab)}
                        className={`flex-1 px-4 py-2 text-xs font-bold rounded-md transition capitalize whitespace-nowrap flex items-center justify-center gap-1 ${priorityHistoryTab === tab
                            ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        <span>{tab === 'rent' ? 'Rent' : 'Sell'}</span>
                        <span className="opacity-70 text-[10px]">({tab === 'rent' ? priorityRentCount : prioritySellCount})</span>
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
                  noRowsMessage="No priority purchases yet"
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
                      const monthlyPurchases = allVendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "monthly");
                      const yearlyPurchases = allVendorPurchases.filter(p => String(p.plan_id) === String(planId) && p.plan_duration === "yearly");
                      const mTotal = monthlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                      const mUsed = monthlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);
                      const yTotal = yearlyPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                      const yUsed = yearlyPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);
                      const currentRemaining = durationToggle === "monthly" ? Math.max(0, mTotal - mUsed) : Math.max(0, yTotal - yUsed);
                      const isDurationActive = durationToggle === "monthly" ? mTotal > 0 : yTotal > 0;
                      return (
                        <div key={plan.id} className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white dark:bg-[#0d111c] group ${plan.is_popular ? 'border-brand-500 shadow-2xl shadow-brand-100 sm:scale-[1.02] z-10' : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'}`}>
                          {plan.is_popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-lg">Recommended</span>}
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
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 bg-green-100 p-1.5 rounded-full flex-shrink-0">
                                <Check className="text-green-600" size={14} />
                              </div>
                              <div>
                                <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{plan.product_slots} Product Slots</p>
                                <p className="text-xs text-gray-500">Add up to {plan.product_slots} items</p>
                              </div>
                            </div>
                            
                            {(plan.features || []).map((feature, fIdx) => (
                              <div key={fIdx} className="flex items-start gap-3">
                                <div className="mt-0.5 bg-green-100 p-1.5 rounded-full flex-shrink-0">
                                  <Check className="text-green-600" size={14} />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{feature}</p>
                                </div>
                              </div>
                            ))}
                            {/* Premium Extras (Extra Product / Unlimited) */}
                            {((durationToggle === "monthly" && (plan.extra_product_price_monthly || plan.unlimited_amount_monthly || plan.unlimited_price_monthly)) || 
                              (durationToggle === "yearly" && (plan.extra_product_price_yearly || plan.unlimited_amount_yearly || plan.unlimited_price_yearly))) && (
                              <div className=" border-t border-gray-100 dark:border-gray-800 space-y-2 text-left w-full mb-6">
                                {/* Monthly Extras Section */}
                                {durationToggle === "monthly" && (plan.extra_product_price_monthly > 0 || plan.unlimited_amount_monthly > 0 || plan.unlimited_price_monthly > 0) && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Monthly Extras
                                    </p>
                                    {plan.extra_product_price_monthly > 0 && (
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                          <Zap className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600">
                                          Extra Product: {currency}{plan.extra_product_price_monthly} / mo
                                        </span>
                                      </div>
                                    )}
                                    {(plan.unlimited_amount_monthly > 0 || plan.unlimited_price_monthly > 0) && (
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                          <Zap className="w-3 h-3 text-amber-600" />
                                        </div>
                                        <span className="text-sm font-bold text-amber-600">
                                          Unlimited Option: {currency}{plan.unlimited_amount_monthly || plan.unlimited_price_monthly}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Yearly Extras Section */}
                                {durationToggle === "yearly" && (plan.extra_product_price_yearly > 0 || plan.unlimited_amount_yearly > 0 || plan.unlimited_price_yearly > 0) && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Yearly Extras
                                    </p>
                                    {plan.extra_product_price_yearly > 0 && (
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                          <Zap className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600">
                                          Extra Product: {currency}{plan.extra_product_price_yearly} / yr
                                        </span>
                                      </div>
                                    )}
                                    {(plan.unlimited_amount_yearly > 0 || plan.unlimited_price_yearly > 0) && (
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                          <Zap className="w-3 h-3 text-amber-600" />
                                        </div>
                                        <span className="text-sm font-bold text-amber-600">
                                          Unlimited Option: {currency}{plan.unlimited_amount_yearly || plan.unlimited_price_yearly}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Button onClick={() => handleSelectPlan(plan)} variant={plan.is_popular ? 'primary' : 'outline'} className="w-full !py-3.5 rounded-xl font-bold btn-primary">{isDurationActive ? 'Add More Products' : 'Select Plan'}</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3 md:col-span-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><Package className="w-6 h-6 text-brand-600" /><h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Plan History</h2></div>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1 w-full sm:w-auto">
                      {(["rent", "sell"] as const).map((tab) => (
                        <button key={tab} onClick={() => setPriorityHistoryTab(tab)}
                          className={`flex-1 px-4 py-2 text-xs font-bold rounded-md transition capitalize whitespace-nowrap flex items-center justify-center gap-1 ${priorityHistoryTab === tab ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}>
                          <span>{tab === 'rent' ? 'Rent' : 'Sell'}</span>
                          <span className="opacity-70 text-[10px]">({tab === 'rent' ? priorityRentCount : prioritySellCount})</span>
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
                    noRowsMessage="No priority purchases yet"
                    />
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
      {/* Video Delete Confirm Modal */}
      <ConfirmDeleteModal
        open={!!videoToDelete}
        onCancel={() => setVideoToDelete(null)}
        onConfirm={confirmDeleteVideo}
        title="Delete Promotional Video"
        message="Are you sure you want to delete this video from your store profile? This action cannot be undone."
      />
    </div>
  )
};

export default SettingsPage;
