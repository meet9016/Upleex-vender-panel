"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Rocket, History, TrendingUp, Sparkles, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Zap, Package, Search } from "lucide-react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import { useWallet } from "@/context/WalletContext";
import { Modal } from "@/components/ui/modal";
import PageLoader from "@/components/common/PageLoader";

const BoosterPlanView: React.FC = () => {
  const { currency, refreshBalance, balance } = useWallet();
  const [plans, setPlans] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [boosterRentCount, setBoosterRentCount] = useState<number>(0);
  const [boosterSellCount, setBoosterSellCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlanForBoost, setSelectedPlanForBoost] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<"rent" | "sell">("rent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([""]);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("")
  const historyCacheRef = React.useRef<Record<string, any[]>>({});
  const initialDataFetchedRef = React.useRef(false);
  const isFetchingRef = React.useRef(false);

  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

  const fetchData = async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) return;
    isFetchingRef.current = true;
    try {
      setLoading(true);
      const userInfoStr = localStorage.getItem("user_info");
      const vendor = userInfoStr ? JSON.parse(userInfoStr) : null;
      const vendor_id = vendor?.id || vendor?._id;

      const promises: any[] = [];
      
      // Always fetch rent/sell booster history for counts and cache
      promises.push(api.get(endPointApi.getVendorRentalBoostPurchases, { params: { filter_rent_sell: '1' } }).catch(() => ({ data: { total: 0, data: [] } })));
      promises.push(api.get(endPointApi.getVendorRentalBoostPurchases, { params: { filter_rent_sell: '2' } }).catch(() => ({ data: { total: 0, data: [] } })));

      if (!initialDataFetchedRef.current || forceRefresh) {
        promises.push(api.get(endPointApi.getAllRentalBoostPlans, { params: { status: "active" } }));
        promises.push(api.get(endPointApi.postAllVendorProductList, {
          params: { vendor_id, approval_status: "approved", limit: 1000 }
        }));
      }

      const results = await Promise.all(promises);
      const rentRes = results[0];
      const sellRes = results[1];

      // Update counts and cache
      setBoosterRentCount(rentRes.data.total || 0);
      setBoosterSellCount(sellRes.data.total || 0);
      historyCacheRef.current['rent'] = rentRes.data.data || [];
      historyCacheRef.current['sell'] = sellRes.data.data || [];

      if (!initialDataFetchedRef.current || forceRefresh) {
        const [plansRes, productsRes] = results.slice(2);

        if (plansRes?.data?.success) setPlans(plansRes.data.data);

        const products = productsRes?.data?.data || [];
        const normalizedProducts = products.map((p: any) => ({
          ...p,
          id: p.id || p._id,
        }));
        setAllProducts(normalizedProducts);
        initialDataFetchedRef.current = true;
      }
    } catch (error) {
      toast.error("Failed to load booster data");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    const cachedData = historyCacheRef.current[historyTab];
    if (cachedData) {
      setPurchases(cachedData);
    }
    if (!cachedData) {
      fetchData();
    }
  }, [historyTab]);

  useEffect(() => {
    const cachedData = historyCacheRef.current[historyTab];
    if (cachedData) {
      setPurchases(cachedData);
    }
  }, [loading]);

  const rentProducts = useMemo(() => allProducts.filter(p => p.product_type_name?.toLowerCase() === "rent"), [allProducts]);
  const sellProducts = useMemo(() => allProducts.filter(p => p.product_type_name?.toLowerCase() === "sell"), [allProducts]);

  const handleOpenConfirm = (plan: any) => {
    setSelectedPlanForBoost(plan);
    setSelectedProductIds([]);
    setIsModalOpen(true);
  };

  const handleSelectProduct = () => {
    if (selectedProductIds.length === 0) {
      toast.warning("Please select at least one product to boost.");
      return;
    }
    setIsModalOpen(false);
    setShowConfirmModal(true);
  };

  const handleBulkBoost = async () => {
    if (!selectedPlanForBoost || selectedProductIds.length === 0) return;

    const totalPrice = selectedPlanForBoost.price * selectedProductIds.length;
    if (totalPrice > balance) {
      toast.error(`Insufficient wallet balance. Required: ${currency}${totalPrice}`);
      return;
    }

    try {
      setIsPurchasing(true);
      const res = await api.post(endPointApi.purchaseBulkRentalBoostPlan, {
        plan_id: selectedPlanForBoost.id || selectedPlanForBoost._id,
        product_ids: selectedProductIds,
      });

      if (res?.data?.success) {
        toast.success(res.data.message || `${selectedProductIds.length} product(s) boosted successfully!`);
        refreshBalance();
        // Clear cache and force refresh
        historyCacheRef.current = {};
        initialDataFetchedRef.current = false;
        fetchData(true);
        setShowConfirmModal(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to apply boost");
    } finally {
      setIsPurchasing(false);
    }
  };

  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  const filteredProducts = useMemo(() => {
    return currentTabProducts.filter(p =>
      p.product_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch]);

  const isProductBoosted = (product: any) => {
    return product.is_boosted && product.boost_expiry && new Date(product.boost_expiry) > new Date();
  };

  const productColumns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 160,
      flex: 2,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        const isBoosted = isProductBoosted(product);
        
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0 relative group">
              <img
                src={imageUrl}
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg object-cover border group-hover:scale-105 transition-transform ${isBoosted ? 'border-green-300 opacity-60' : 'border-gray-100'}`}
                onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`font-bold text-[11px] sm:text-[12px] md:text-[13px] truncate ${isBoosted ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
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
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => {
        const isBoosted = isProductBoosted(params.data);
        return (
          <span className={`font-medium text-xs sm:text-sm ${isBoosted ? 'text-gray-400' : 'text-gray-600'}`}>{params.value || "-"}</span>
        );
      }
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => {
        const isBoosted = isProductBoosted(params.data);
        return (
          <span className={`font-medium text-xs sm:text-sm ${isBoosted ? 'text-gray-400' : 'text-gray-500'}`}>{params.value || "-"}</span>
        );
      }
    },
    {
      headerName: "Pricing",
      field: "pricing_type",
      minWidth: 70,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={(params.value || 'paid').toLowerCase() === 'free' ? 'free' : 'paid'} />
        </div>
      )
    },
    {
      headerName: "Status",
      field: "status",
      minWidth: 80,
      flex: 1,
      cellRenderer: (params: any) => (
        <StatusBadge status={params.value} />
      )
    },
    {
      headerName: "Expiry",
      field: "boost_expiry",
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => {
        const expiryDate = params.value;
        if (!expiryDate) {
          return <span className="text-gray-400 text-xs sm:text-sm">Not boosted</span>;
        }
        const isExpired = new Date(expiryDate) < new Date();
        const dateStr = new Date(expiryDate).toLocaleDateString('en-GB');
        return (
          <div className="flex flex-col">
            <span className={`text-xs sm:text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
              {dateStr}
            </span>
            <span className={`text-[10px] sm:text-xs ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
              {isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
        );
      }
    },
  ];

  const flattenedBoosterHistory = useMemo(() => {

    const rows: any[] = [];
    purchases.forEach((purchase, index) => {
      console.log(`\nPurchase #${index + 1}:`, {
        _id: purchase._id,
        product_id: purchase.product_id,
        product_name: purchase.product_name,
        plan_name: purchase.plan_name,
      });
      
      // The backend now populates product_id with product details
      const populatedProduct = purchase.product_id;
      
      const rowData = {
        ...purchase,
        product_name: populatedProduct?.product_name || purchase.product_name || "Product",
        category_name: populatedProduct?.category_name || purchase.category_name || "-",
        sub_category_name: populatedProduct?.sub_category_name || purchase.sub_category_name || "-",
        product_type_name: populatedProduct?.product_type_name || purchase.product_type_name || "-",
      };

      rows.push(rowData);
    });

    const sorted = rows.sort((a, b) => new Date(b.expiry_date || b.createdAt).getTime() - new Date(a.expiry_date || a.createdAt).getTime());
    if (historyTab === "sell") return sorted.filter(r => r.product_type_name?.toLowerCase() === "sell");
    return sorted.filter(r => r.product_type_name?.toLowerCase() === "rent");
  }, [purchases, allProducts, historyTab]);

  const columns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 140,
      flex: 2,
      cellRenderer: (params: any) => (
        <span className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{params.value}</span>
      )
    },
    {
      headerName: "Category",
      field: "category_name",
      minWidth: 90,
      flex: 1,
    },
    {
      headerName: "Subcategory",
      field: "sub_category_name",
      minWidth: 90,
      flex: 1,
    },
    {
      headerName: "Plan",
      field: "plan_name",
      minWidth: 90,
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="text-xs sm:text-sm font-semibold">{params.value}</span>
      )
    },
    {
      headerName: "Expiry",
      field: "expiry_date",
      minWidth: 80,
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
      field: "expiry_date",
      minWidth: 70,
      flex: 1,
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* {activeBooster && (
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Zap size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full w-fit">
                <ShieldCheck size={14} className="text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Booster Subscription</span>
              </div>
              <h2 className="text-3xl font-black italic">BOOSTER IS ACTIVE!</h2>
              <p className="text-indigo-100 font-medium max-w-lg">
                Your current boost expires on <span className="text-white font-bold">{new Date(activeBooster.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
                You can sync any new Priority Products for **FREE** during this period.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <p className="text-indigo-200 text-xs font-bold uppercase mb-1">New Products to Sync</p>
              <p className="text-3xl font-black text-white leading-none">{priorityCount}</p>
            </div>
          </div>
        </div>
      )} */}

      {/* Plans Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id || plan._id}
            className={`relative p-8 rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white group dark:bg-black  ${plan.is_popular
              ? "border-indigo-500 shadow-2xl shadow-indigo-100 scale-[1.02] z-10"
              : "border-gray-200 hover:border-indigo-300 hover:shadow-xl shadow-sm"
              }`}
          >
            {plan.is_popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg">
                Recommended
              </span>
            )}

            <div className="mb-3 text-center">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:text-gray-200 dark:bg-black">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-200">{plan.name || `${plan.days}-Day Boost`}</h4>
              {/* <p className="text-gray-500 text-xs line-clamp-2 dark:text-gray-200">{plan.description || `Boost all priority products for ${plan.days} days`}</p> */}
            </div>

            {/* Price block */}
            <div className={`mb-8 p-5 rounded-2xl dark:bg-black bg-indigo-50`}>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-indigo-900">
                  {currency}{plan.price}
                </span>
                <span className="text-indigo-500 font-medium">/ product</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full dark:bg-indigo-900/40">
                  {plan.days} days duration
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full dark:bg-slate-800">
                  Per product pricing
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              {(plan.features || []).map((feature: string, fIdx: number) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{feature}</span>
                </div>
              ))}
              {/* {(!plan.features || plan.features.length === 0) && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">10x Visibility Boost</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Priority Search Ranking</span>
                  </div>
                </>
              )} */}
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => handleOpenConfirm(plan)}
                disabled={isPurchasing}
                className={`w-full !py-4 rounded-xl font-bold btn-primary dark:bg-[#1c2938] shadow-indigo-100`}
                variant="primary"
              >
                {isPurchasing ? "Processing..." : `Boost Selected Products - ${currency}${plan.price}/product`}
              </Button>
              <p className="text-center text-[10px] text-gray-400 font-medium px-4 leading-relaxed">
                Select multiple products to boost. Each product costs {currency}{plan.price}.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* {priorityCount === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Eligible Priority Products</h3>
          <p className="text-gray-500 text-center max-w-sm">
            You currently have <strong>0 products</strong> with an active Priority Plan. Booster Plans can only be applied to products that are already in a Priority Plan.
          </p>
          <Button variant="outline" className="mt-6 px-8 rounded-xl" onClick={() => fetchData()}>
            Refresh Account Status
          </Button>
        </div>
      )} */}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-6xl w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
          <div className="px-6 py-4 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Product for {selectedPlanForBoost?.name || 'Booster'} Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose one or more products to boost for {selectedPlanForBoost?.days} days
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
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Rent' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Rent ({rentProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('Sell')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Sell' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sell ({sellProducts.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 overflow-hidden">
            <AgGridTable
              columns={productColumns}
              rowData={filteredProducts}
              showCheckboxes={true}
              height={500}
              rowHeight={50}
              onSelectionChange={(rows) => {
                const ids = rows
                  .filter((row: any) => !isProductBoosted(row))
                  .map((row: any) => row.id || row._id)
                  .filter(Boolean);
                setSelectedProductIds(ids);
              }}
              isRowSelectable={(params) => {
                const product = params.data;
                const isBoosted = product.is_boosted && product.boost_expiry && new Date(product.boost_expiry) > new Date();
                return !isBoosted; // Disable selection for already boosted products
              }}
              getRowStyle={(params) => {
                const product = params.data;
                const isBoosted = product.is_boosted && product.boost_expiry && new Date(product.boost_expiry) > new Date();
                if (isBoosted) {
                  return {
                    opacity: 0.5,
                    background: 'rgba(0,0,0,0.02)',
                  };
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
              onClick={handleSelectProduct}
              disabled={selectedProductIds.length === 0}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100/50"
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="max-w-md w-full"
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center animate-bounce bg-indigo-100 text-indigo-600">
            <Rocket size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-200">
              Activate Booster Plan
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              {`Are you sure you want to boost ${selectedProductIds.length} product(s) for ${selectedPlanForBoost?.days} days?`}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner dark:bg-[#1c2938] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-200">Booster Plan</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{selectedPlanForBoost?.name || `${selectedPlanForBoost?.days}-Day Boost`}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-200">Price per Product</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{currency}{selectedPlanForBoost?.price}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-200">Products Selected</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{selectedProductIds.length} Item(s)</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black border-t pt-2 border-gray-200 dark:border-gray-700 dark:text-gray-200">
              <span className="text-gray-900 dark:text-gray-200 uppercase text-xs">Total Payable</span>
              <span className="text-lg text-indigo-600">
                {currency}{selectedPlanForBoost?.price * selectedProductIds.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              className="w-full !py-4 rounded-xl font-bold shadow-xl  btn-primary"
              onClick={handleBulkBoost}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Confirm & Pay"}
            </Button>
            <Button
              variant="outline"
              className="w-full py-3.5 rounded-xl text-gray-500 font-bold"
              onClick={() => setShowConfirmModal(false)}
              disabled={isPurchasing}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>

      {/* History Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Booster Purchase History</h2>
          </div>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1">
            {(["rent", "sell"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition capitalize ${historyTab === tab
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab === 'rent' ? 'Rent' : 'Sell'} ({tab === 'rent' ? boosterRentCount : boosterSellCount})
              </button>
            ))}
          </div>
        </div>

        {/* <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden"> */}
        <AgGridTable
          rowData={flattenedBoosterHistory}
          columns={columns}
          showCheckboxes={false}
          height={400}
          rowHeight={52}
          noRowsMessage="No booster purchases yet"
        />
        {/* </div> */}
      </div>
    </div>
  );
};

export default BoosterPlanView;
