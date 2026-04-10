"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Package, Search, Check, ShoppingBag, Loader2, AlertCircle, History, Eye } from "lucide-react";
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
  description: string;
  price: number;
  duration_months: number;
  product_limit: number;
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
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const ListingPlanView: React.FC = () => {
  const { currency, balance, refreshBalance } = useWallet();
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasedPlans, setPurchasedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes, purchasesRes] = await Promise.all([
        api.get(endPointApi.getPlanOptions),
        api.get(endPointApi.postAllVendorProductList),
        api.get(endPointApi.getPurchasedPlans)
      ]);

      const rawPlans = plansRes.data.data || [];
      const normalizedPlans = rawPlans.map((p: any) => ({
        key: p.plan_type,
        name: p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1),
        description: `${p.months} months, up to ${p.max_products} products`,
        price: p.amount,
        duration_months: p.months,
        product_limit: p.max_products,
      }));

      const rawProducts = productsRes.data.data || [];
      const normalizedProducts = rawProducts.map((p: any) => {
        let price = p.price;
        // Normalizing price for Rent items if it's in month_arr
        if (
          p.product_type_name?.toLowerCase() === 'rent' &&
          Array.isArray(p.month_arr) &&
          p.month_arr.length
        ) {
          price = p.month_arr[0]?.price ?? price;
        }

        return {
          ...p,
          id: p.id || p._id,
          price: Number(price) || 0,
        };
      });

      setPlans(normalizedPlans);
      setProducts(normalizedProducts);
      setPurchasedPlans(purchasesRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load listing plan data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPlan = (plan: ListingPlan) => {
    setSelectedPlan(plan);
    setSelectedProductIds([]);
    setIsModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    if (selectedProductIds.length > selectedPlan.product_limit) {
      toast.error(`This plan only allows up to ${selectedPlan.product_limit} products.`);
      return;
    }

    if (selectedPlan.price > balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await api.post(endPointApi.postCreateListingPlan, {
        plan_type: selectedPlan.key,
        product_ids: selectedProductIds,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Listing plan activated successfully!");
        setIsModalOpen(false);
        refreshBalance();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Purchase failed");
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
  ], [currency]);

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name === "Rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name === "Sell"), [products]);

  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  const filteredProducts = useMemo(() => {
    return currentTabProducts.filter(p =>
      p.product_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch]);

  const handleSelectionChange = (rows: Product[]) => {
    const ids = rows.map((p) => p.id);
    setSelectedProductIds(ids);
  };

  const purchaseHistoryColumns: ColDef[] = [
    {
      headerName: "Plan Details",
      field: "plan_type",
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-gray-900 dark:text-gray-100 uppercase text-xs">{params.value} Plan</span>
          <span className="text-[10px] text-gray-500">Duration: {params.data.months} Months</span>
        </div>
      )
    },
    {
      headerName: "Products & Categories",
      field: "product_ids",
      flex: 1.5,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const productList = params.value || [];
        if (productList.length === 0) return <span className="text-gray-400">-</span>;

        // Show the first product or a summary
        const firstProd = productList[0];
        const categories = [...new Set(productList.map((p: any) => p.category_name).filter(Boolean))];
        const subCategories = [...new Set(productList.map((p: any) => p.sub_category_name).filter(Boolean))];

        return (
          <div className="flex flex-col py-1 overflow-hidden">
            <span className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">
              {productList.length} Product(s): {productList.map((p: any) => p.product_name).join(", ")}
            </span>
            <div className="flex gap-2 flex-wrap mt-1">
              {categories.map((c: any, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {c}
                </span>
              ))}
              {subCategories.map((sc: any, i) => (
                <span key={i} className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100 dark:bg-gray-800 dark:text-gray-400">
                  {sc}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      headerName: "Amount Paid",
      field: "amount",
      width: 120,
      cellRenderer: (params: any) => (
        <span className="font-bold text-emerald-600">{currency}{params.value?.toLocaleString() || 0}</span>
      )
    },
    {
      headerName: "Purchase Date",
      field: "created_at",
      width: 130,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-GB') : "-"
    },
    {
      headerName: "Plan Expiry",
      field: "expire_at",
      width: 130,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (!val) return "-";
        const date = new Date(val);
        const isExpired = date < new Date();
        return (
          <span className={`font-medium ${isExpired ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
            {date.toLocaleDateString('en-GB')}
          </span>
        );
      }
    },
    {
      headerName: "Payment Status",
      field: "payment_status",
      width: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || "paid"} />
        </div>
      )
    }
  ];

  if (loading) {
    return <PageLoader fullScreen={false} />;
  }


  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative p-8 rounded-3xl border border-gray-200 transition-all duration-500 flex flex-col h-full bg-white group dark:bg-[#0d111c] hover:border-emerald-300 hover:shadow-xl shadow-sm`}
          >
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1 dark:text-gray-100">{plan.name}</h4>
              <p className="text-gray-500 text-sm line-clamp-2 dark:text-gray-400">{plan.description}</p>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-8 p-4 bg-emerald-50 rounded-2xl dark:bg-[#1c2938]">
              <span className="text-4xl font-extrabold text-emerald-700">
                {currency}{plan.price}
              </span>
              <span className="text-emerald-500 font-medium">/ {plan.duration_months} months</span>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              {(() => {
                const myActive = purchasedPlans.find(p => p.plan_type === plan.key);
                if (myActive) {
                  const used = myActive.product_ids?.length || 0;
                  const total = myActive.max_products || plan.product_limit;
                  const remaining = Math.max(0, total - used);
                  return (
                    <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl dark:bg-[#1c2938]">
                      <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Active Subscription</p>
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
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Active for {plan.duration_months} Months</span>
              </div>
            </div>

            <Button
              onClick={() => handleSelectPlan(plan)}
              className="w-full py-4 rounded-xl font-bold shadow-lg shadow-emerald-50"
              variant="primary"
            // style={{ backgroundColor: '#10b981' }}
            >
              Select Plan
            </Button>
          </div>
        ))}
      </div>

      {/* History Section */}
      {/* <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Listing Plan History</h2>
        </div>

        <AgGridTable
          rowData={purchasedPlans}
          columns={purchaseHistoryColumns}
          showCheckboxes={false}
          height={400}
          rowHeight={48}
        />
      </div> */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-6xl w-full"
      >
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-6 pr-14 py-4 border-b bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Products for {selectedPlan?.name} Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selected: <span className="font-semibold text-emerald-600">{selectedProductIds.length} / {selectedPlan?.product_limit}</span>
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
                    // variant={activeTab === 'Rent' ? 'primary' : 'ghost'}
                    // size="sm"
                    onClick={() => setActiveTab('Rent')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Rent' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    RENT ({rentProducts.length})
                  </button>
                  <button
                    // variant={activeTab === 'Sell' ? 'primary' : 'ghost'}
                    // size="sm"
                    onClick={() => setActiveTab('Sell')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-auto ${activeTab === 'Sell' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    SELL ({sellProducts.length})
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
              rowHeight={50}
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
              disabled={isPurchasing || selectedProductIds.length === 0 || selectedProductIds.length > (selectedPlan?.product_limit || 0)}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-100/50"
            >
              {isPurchasing ? 'Processing...' : 'Activate Plan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListingPlanView;
