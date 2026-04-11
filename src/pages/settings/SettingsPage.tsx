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
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import BoosterPlanView from "./BoosterPlanView";
import ListingPlanView from "./ListingPlanView";

interface PriorityPlan {
  id: string;
  _id?: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  product_slots: number;
  description: string;
  is_popular: boolean;
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
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const SettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<PriorityPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<PriorityPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PriorityPlan | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");
  const [currentTab, setCurrentTab] = useState<"priority" | "booster" | "listing">("priority");
  const { balance, currency, refreshBalance } = useWallet();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes, purchasesRes] = await Promise.all([
        api.get(endPointApi.getAllPriorityPlans),
        api.get(endPointApi.postAllVendorProductList, { params: { limit: 1000 } }),
        api.get(endPointApi.getVendorPriorityPurchases)
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "sell"), [products]);

  const handleSelectPlan = (plan: PriorityPlan) => {
    setSelectedPlan(plan);
    setSelectedProductIds([]);
    setIsModalOpen(true);
    if (rentProducts.length === 0 && sellProducts.length > 0) {
      setActiveTab("Sell");
    } else {
      setActiveTab("Rent");
    }
  };

  const handlePurchase = async () => {
    const targetPlanId = selectedPlan?.id || selectedPlan?._id;
    if (!targetPlanId) return;

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    const activePurchases = vendorPurchases.filter(p => String(p.plan_id) === String(targetPlanId));

    // Total capacity across all active plans of this type
    const totalSlots = activePurchases.length > 0
      ? activePurchases.reduce((acc, p) => acc + Number(p.total_slots), 0)
      : Number(selectedPlan.product_slots || 0);

    // Collect all unique products currently assigned across these plans
    const currentProductIds = new Set(activePurchases.flatMap(p => p.product_ids.map(id => String(id))));
    const trulyNewIds = selectedProductIds.filter(id => !currentProductIds.has(String(id)));

    const usedSlots = currentProductIds.size;
    const remainingSlotsCalculated = Math.max(0, totalSlots - usedSlots);

    // If the new products fit into the total REMAINING space across active plans, price is 0
    let finalPrice = selectedPlan.monthly_price;

    if (activePurchases.length > 0 && trulyNewIds.length <= remainingSlotsCalculated) {
      finalPrice = 0;
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
      });

      if (res.data.success) {
        toast.success(res.data.message || "Priority plan updated successfully!");
        setIsModalOpen(false);
        refreshBalance();
        fetchData();
        setSelectedProductIds([]);
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

  const flattenedPriorityHistory = useMemo(() => {
    const rows: any[] = [];
    vendorPurchases.forEach(purchase => {
      // If no product_ids, show the purchase itself as one row (optional, but per user request we focus on products)
      if (!purchase.product_ids || purchase.product_ids.length === 0) {
        rows.push({
          ...purchase,
          product_name: "-",
          category_name: "-",
          sub_category_name: "-",
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
        });
      });
    });
    // Sort by expiry date (latest first)
    return rows.sort((a, b) => new Date(b.expire_at).getTime() - new Date(a.expire_at).getTime());
  }, [vendorPurchases, products]);

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
    const ids = rows.map((p) => p.id || (p as any)._id);
    setSelectedProductIds(ids);
  };

  if (loading) {
    return <PageLoader />;
  }


  const activePurchasesForPlan = selectedPlan
    ? vendorPurchases.filter(p => String(p.plan_id) === String(selectedPlan.id || selectedPlan._id))
    : [];

  const currentTotal = activePurchasesForPlan.length > 0
    ? activePurchasesForPlan.reduce((acc, p) => acc + Number(p.total_slots), 0)
    : Number(selectedPlan?.product_slots || 0);

  const currentUsed = activePurchasesForPlan.reduce((acc, p) => acc + p.product_ids.length, 0);
  const remainingSlots = Math.max(0, currentTotal - currentUsed);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6 dark:bg-black">
        <div className="flex p-1.5 bg-gray-100/80 rounded-2xl w-full sm:w-auto dark:bg-[#1c2938] gap-1.5">
          <Button
            variant={currentTab === "priority" ? "secondary" : "ghost"}
            onClick={() => setCurrentTab("priority")}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 h-auto ${currentTab === "priority"
              ? "bg-white text-brand-600 shadow-md ring-1 ring-black/[0.04]"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Package size={18} className={currentTab === "priority" ? "text-brand-500" : "text-gray-400"} />
            Priority Plan
          </Button>
          <Button
            variant={currentTab === "booster" ? "secondary" : "ghost"}
            onClick={() => setCurrentTab("booster")}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 h-auto ${currentTab === "booster"
              ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/[0.04]"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Rocket size={18} className={currentTab === "booster" ? "text-indigo-500" : "text-gray-400"} />
            Booster Plan
          </Button>
          <Button
            variant={currentTab === "listing" ? "secondary" : "ghost"}
            onClick={() => setCurrentTab("listing")}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 h-auto ${currentTab === "listing"
              ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/[0.04]"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Package size={18} className={currentTab === "listing" ? "text-emerald-500" : "text-gray-400"} />
            Listing Plan
          </Button>
        </div>

        {/* <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-50 rounded-2xl border border-brand-100">
          <Wallet className="text-brand-600" size={20} />
          <div>
            <p className="text-[10px] text-brand-500 uppercase font-black tracking-widest leading-none">Wallet Balance</p>
            <p className="text-lg font-black text-brand-900 leading-tight">{currency}{balance.toLocaleString()}</p>
          </div>
        </div> */}
      </div>
      {currentTab === "priority" ? (
        <>
          {/* Priority Plan Content (Original code remains here) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-3">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
                  Priority Visibility Plans
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                  const planId = plan.id || (plan as any)._id;
                  const matchPurchases = vendorPurchases.filter(p => String(p.plan_id) === String(planId));
                  const isSubscribed = matchPurchases.length > 0;
                  const totalCapacity = matchPurchases.reduce((acc, p) => acc + Number(p.total_slots), 0);
                  const totalUsedCount = matchPurchases.reduce((acc, p) => acc + p.product_ids.length, 0);

                  return (
                    <div
                      key={plan.id}
                      className={`relative p-8 rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white dark:bg-[#0d111c] group ${plan.is_popular
                        ? 'border-brand-500 shadow-2xl shadow-brand-100 scale-[1.02] z-10'
                        : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'
                        }`}
                    >
                      {plan.is_popular && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                          Recommended
                        </span>
                      )}

                      <div className="mb-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-1 dark:text-gray-300">{plan.name}</h4>
                        <p className="text-gray-500 text-sm dark:text-gray-300">{plan.description}</p>
                      </div>

                      <div className="flex items-baseline gap-1 mb-8 p-4 bg-gray-50 rounded-2xl dark:bg-[#0d111c]">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-300">{currency}{plan.monthly_price}</span>
                        <span className="text-gray-500 font-medium dark:text-gray-300">/ month</span>
                      </div>

                      {isSubscribed && plan.product_slots > 1 && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-xl dark:bg-[#0d111c]">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-600 font-medium">Remaining Slots</span>
                            <span className="font-bold text-green-800 dark:text-green-200 text-lg">
                              {Math.max(0, totalCapacity - totalUsedCount)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 mb-8 flex-grow">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-green-100 p-1.5 rounded-full"><Check className="text-green-600" size={14} /></div>
                          <div>
                            <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{plan.product_slots} Product Slots</p>
                            <p className="text-xs text-gray-500">Add up to {plan.product_slots} items</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-green-100 p-1.5 rounded-full"><Check className="text-green-600" size={14} /></div>
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
                        {isSubscribed ? 'Add More Products' : 'Select Plan'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-50 rounded-2xl border border-brand-100">
            <Wallet className="text-brand-600" size={20} />
            <div>
              <p className="text-[10px] text-brand-500 uppercase font-black tracking-widest leading-none">Wallet Balance</p>
              <p className="text-lg font-black text-brand-900 leading-tight">{currency}{balance.toLocaleString()}</p>
            </div>

          {/* Priority Purchase History */}
            <div className="mt-12 space-y-6 md:col-span-3">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-brand-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Plan History</h2>
              </div>

              <AgGridTable
                rowData={flattenedPriorityHistory}
                columns={priorityHistoryColumns}
                showCheckboxes={false}
                height={400}
                rowHeight={52}
              />
            </div>


            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              className="max-w-6xl w-full"
            >
              <div className="flex flex-col h-[70vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">

                {/* 🔹 HEADER */}
                {/* pr-14 IMPORTANT: close icon overlap fix */}
                <div className="px-6 pr-14 py-4 border-b bg-white dark:bg-gray-900">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Left */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedPlan?.name} Products
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Remaining Slots:
                        <span className="ml-1 font-semibold text-brand-600">
                          {remainingSlots} left
                        </span>
                      </p>
                    </div>

                    {/* Right */}
                    <div className="flex flex-wrap items-center gap-3">

                      {/* 🔍 Search */}
                      <div className="relative w-full sm:w-64">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={gridSearch}
                          onChange={(e) => setGridSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                      </div>

                      {/* 🔘 Tabs */}
                      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">

                        <button
                          onClick={() => setActiveTab('Rent')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'Rent'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                          RENT ({rentProducts.length})
                        </button>

                        <button
                          onClick={() => setActiveTab('Sell')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'Sell'
                            ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                          SELL ({sellProducts.length})
                        </button>

                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔹 TABLE */}
                <div className="flex-1 px-6  overflow-hidden">
                  <AgGridTable
                    columns={columns}
                    rowData={filteredProducts}
                    onSelectionChange={handleSelectionChange}
                    showCheckboxes={true}
                    height={480}
                    rowHeight={45}
                    isRowSelectable={(params) => !params.data.active_plan_name}
                    getRowStyle={(params) =>
                      params.data.active_plan_name
                        ? {
                          opacity: 0.5,
                          pointerEvents: 'none',
                          background: 'rgba(0,0,0,0.03)',
                        }
                        : undefined
                    }
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
                    onClick={handlePurchase}
                    disabled={
                      isPurchasing ||
                      selectedProductIds.length === 0 ||
                      (selectedProductIds.length > remainingSlots &&
                        activePurchasesForPlan.length === 0 &&
                        selectedProductIds.length >
                        (selectedPlan?.product_slots || 0))
                    }

                    className="px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg"
                  >
                    {isPurchasing ? 'Processing...' : 'Confirm & Activate'}
                  </Button>
                </div>

              </div>

            </Modal>
          </div>
        </>
      ) : currentTab === "booster" ? (
        <BoosterPlanView />
      ) : (
        <ListingPlanView />
      )}
    </div>
  )
};

export default SettingsPage;
