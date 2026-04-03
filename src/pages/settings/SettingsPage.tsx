"use client";

import React, { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/button/Button";
import { Zap, Wallet, Package, ShoppingBag, Info, Search, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useWallet } from "@/context/WalletContext";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";

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
  product_type_name: string; // "Rent" or "Sell"
  product_listing_type_name?: string; // "Hourly", "Daily", "Monthly"
  price: number;
  product_main_image?: string;
  image?: string;
  is_priority?: boolean;
  priority_expiry?: string;
  // Plan details (injected from purchases)
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
  const { balance, currency, refreshBalance } = useWallet();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes, purchasesRes] = await Promise.all([
        api.get(endPointApi.getAllPriorityPlans),
        api.get(endPointApi.postAllVendorProductList),
        api.get(endPointApi.getVendorPriorityPurchases)
      ]);

      const plansData = plansRes.data.data || [];
      const rawProducts = productsRes.data.data || [];
      const activePurchases: PriorityPurchase[] = purchasesRes.data.data || [];

      setVendorPurchases(activePurchases);

      // Normalize product data
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
        // Find if this product belongs to an active purchase
        const assocPurchase = activePurchases.find(purchase => purchase.product_ids.includes(pid));

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

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name === "Rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name === "Sell"), [products]);

  const existingSlotsUsed = useMemo(() => {
    if (!selectedPlan) return 0;
    const activePurchase = vendorPurchases.find(p => p.plan_id === selectedPlan.id);
    return activePurchase ? activePurchase.product_ids.length : 0;
  }, [selectedPlan, vendorPurchases]);

  const handleSelectPlan = (plan: PriorityPlan) => {
    setSelectedPlan(plan);
    setSelectedProductIds([]);
    setIsModalOpen(true);
    // Explicitly check for case-insensitive matches if needed, but here we assume normalized
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

    const activePurchase = vendorPurchases.find(p => (p.plan_id === targetPlanId || (p as any).plan_id === targetPlanId));
    const totalSlots = Number(activePurchase?.total_slots || selectedPlan.product_slots || 0);
    const usedSlots = Number(activePurchase?.product_ids?.length || 0);
    const remainingSlotsCalculated = totalSlots - usedSlots;
    
    // If we are within existing slots, price should effectively be 0 for frontend logic
    const finalPrice = selectedProductIds.length <= remainingSlotsCalculated && activePurchase ? 0 : selectedPlan.monthly_price;

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
        fetchData(); // Refresh products and purchases
        setSelectedProductIds([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Action failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const getColumns = (): ColDef[] => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: (params) => {
        const p = params.data as Product;
        const isCurrentlyPriority = p.is_priority && p.priority_expiry && new Date(p.priority_expiry) > new Date();
        return !isCurrentlyPriority;
      },
      width: 50,
      pinned: 'left'
    },
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = product.product_main_image || product.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3">
            <img 
              src={imageUrl} 
              className="w-8 h-8 rounded object-cover border" 
              onError={(e:any) => e.target.src = DEFAULT_PLACEHOLDER}
            />
            <span className="font-medium truncate">{product.product_name}</span>
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
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold uppercase tracking-tight">
            {params.value}
          </span>
        ) : <span className="text-gray-400">-</span>
      )
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
    {
      headerName: "Price",
      field: "price",
      width: 100,
      valueFormatter: (params) => `${currency}${params.value?.toLocaleString()}`
    }
  ];

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
    return <div className="flex items-center justify-center min-h-[400px]"><PageLoader fullScreen={false} /></div>;
  }

  const activePurchaseForCurrentPlan = selectedPlan ? vendorPurchases.find(p => (p.plan_id === (selectedPlan.id || selectedPlan._id))) : null;
  const currentTotal = Number(activePurchaseForCurrentPlan?.total_slots || selectedPlan?.product_slots || 0);
  const currentUsed = Number(activePurchaseForCurrentPlan?.product_ids?.length || 0);
  const remainingSlots = Math.max(0, currentTotal - currentUsed);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageBreadcrumb pageTitle="Settings" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-3">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-yellow-500 fill-yellow-500" /> Priority Visibility Plans
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const planId = plan.id || (plan as any)._id;
              const myActive = vendorPurchases.find(p => String(p.plan_id) === String(planId));
              const isSubscribed = !!myActive;
              
              return (
                <div 
                  key={plan.id} 
                  className={`relative p-8 rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white group ${
                    plan.is_popular 
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
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-8 p-4 bg-gray-50 rounded-2xl">
                    <span className="text-4xl font-extrabold text-gray-900">{currency}{plan.monthly_price}</span>
                    <span className="text-gray-500 font-medium">/ month</span>
                  </div>

                  {isSubscribed && plan.product_slots > 1 && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-xs font-bold text-green-700 uppercase mb-1">Active Subscription</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-medium">Remaining Slots</span>
                        <span className="font-bold text-green-800">
                          {Math.max(0, Number(myActive.total_slots || 0) - (myActive.product_ids?.length || 0))} / {Number(myActive.total_slots || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-8 flex-grow">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-green-100 p-1.5 rounded-full"><Check className="text-green-600" size={14} /></div>
                      <div>
                        <p className="text-gray-900 font-bold text-sm">{plan.product_slots} Product Slots</p>
                        <p className="text-xs text-gray-500">Add up to {plan.product_slots} items</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-green-100 p-1.5 rounded-full"><Check className="text-green-600" size={14} /></div>
                      <div>
                        <p className="text-gray-900 font-bold text-sm">Top Feed Priority</p>
                        <p className="text-xs text-gray-500">Show above standard listings</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleSelectPlan(plan)}
                    variant={plan.is_popular ? 'primary' : 'outline'}
                    className="w-full py-3.5 rounded-xl font-bold"
                  >
                    {isSubscribed ? 'Add More Products' : 'Select Plan'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-4xl w-full"
      >
        <div className="p-0 flex flex-col max-h-[90vh]">
          <div className="p-6 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap size={24} className="text-brand-500 fill-brand-500" />
                  {selectedPlan?.name} Products
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Available Slots: <span className="font-bold text-brand-600">{remainingSlots} products left</span>
                </p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab("Rent")}
                className={`px-8 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "Rent" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Rent ({rentProducts.length})
              </button>
              <button 
                onClick={() => setActiveTab("Sell")}
                className={`px-8 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "Sell" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Sell ({sellProducts.length})
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[400px] bg-white p-4">
            <AgGridTable
              columns={getColumns()}
              rowData={filteredProducts}
              onSelectionChange={handleSelectionChange}
              showCheckboxes={true}
              height={400}
            />
          </div>

          <div className="p-6 border-t bg-gray-50 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight">Selection Charge</p>
              <p className="text-2xl font-black text-gray-900">
                {selectedProductIds.length <= remainingSlots && activePurchaseForCurrentPlan ? "FREE" : `${currency}${(selectedPlan?.monthly_price || 0).toLocaleString()}`}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                {selectedProductIds.length} products selected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 rounded-xl font-bold">Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handlePurchase}
                disabled={isPurchasing || selectedProductIds.length === 0 || (selectedProductIds.length > remainingSlots && !activePurchaseForCurrentPlan && selectedProductIds.length > (selectedPlan?.product_slots || 0))}
                className="px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-100"
              >
                {isPurchasing ? 'Processing...' : `Confirm & Activate`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Remove manual Check component since it is now imported from lucide-react
export default SettingsPage;
