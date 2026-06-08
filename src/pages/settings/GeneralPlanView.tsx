import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import PageLoader from "@/components/common/PageLoader";
import { Package, Check, Search, Rocket, X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import AgGridTable from "@/components/tables/AgGridTable";
import StatusBadge from "@/components/common/StatusBadge";
import { ColDef } from "ag-grid-community";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setMultipleSelections, replaceSelections } from "@/store/slices/selectionSlice";

interface GPlan {
  _id?: string;
  id?: string;
  plan_type: string;
  max_products: number;
  amount: number;
  status?: string;
  popular?: boolean;
  features?: string[];
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
  status: string;
  available_quantity?: number;
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const GeneralPlanView: React.FC = () => {
  const [plans, setPlans] = useState<GPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasedPlans, setPurchasedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, refreshBalance } = useWallet();
  const [selectedPlan, setSelectedPlan] = useState<GPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"Rent" | "Sell">("Rent");
  const [gridSearch, setGridSearch] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const [historyTab, setHistoryTab] = useState<"rent" | "sell">("rent");

  const dispatch = useDispatch();
  const selectedIdsMap = useSelector((state: RootState) => state.selection.selectedIds);
  const selectedProductIds = useMemo(() => 
    Object.keys(selectedIdsMap).filter(id => selectedIdsMap[id]), 
    [selectedIdsMap]
  );

  const fetchData = async () => {
    try {
      const [plansRes, productsRes, purchasesRes] = await Promise.all([
        api.get(endPointApi.getAllGeneralPlans),
        api.get(endPointApi.postAllVendorProductList, { params: { limit: 1000 } }),
        api.get(endPointApi.getVendorGeneralPurchases)
      ]);

      if (plansRes?.data?.data) {
        setPlans(plansRes.data.data.filter((p: GPlan) => p.status === 'active'));
      }

      if (productsRes?.data?.data) {
        setProducts(productsRes.data.data.map((p: any) => ({
          ...p,
          id: p.id || p._id,
          price: Number(p.price) || 0,
        })));
      }

      if (purchasesRes?.data?.data) {
        setPurchasedPlans(purchasesRes.data.data);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rentProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "rent"), [products]);
  const sellProducts = useMemo(() => products.filter(p => p.product_type_name?.toLowerCase() === "sell"), [products]);
  const currentTabProducts = activeTab === "Rent" ? rentProducts : sellProducts;
  
  const filteredProducts = useMemo(() => {
    return currentTabProducts.filter(p =>
      p.product_name?.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [currentTabProducts, gridSearch]);

  const activeProductIds = useMemo(() => {
    const ids = new Set<string>();
    const now = new Date();
    purchasedPlans.forEach(p => {
      if (new Date(p.expire_at) > now) {
        (p.product_ids || []).forEach((prod: any) => {
          const id = typeof prod === 'string' ? prod : (prod.id || prod._id || prod.product_id);
          if (id) ids.add(String(id));
        });
      }
    });
    return ids;
  }, [purchasedPlans]);

  const planAggregates = useMemo(() => {
    const aggs: Record<string, { total: number, used: number, purchase_id: string, productIds: Set<string> }> = {};
    const now = new Date();
    purchasedPlans.forEach(p => {
      if (new Date(p.expire_at) > now && p.status === 'active') {
        const used = p.product_ids?.length || 0;
        const total = p.max_products || 0;
        
        if (!aggs[p.plan_type]) {
            aggs[p.plan_type] = {
                total: 0,
                used: 0,
                purchase_id: "",
                productIds: new Set<string>()
            };
        }

        aggs[p.plan_type].total += total;
        aggs[p.plan_type].used += used;
        
        (p.product_ids || []).forEach((prod: any) => {
            aggs[p.plan_type].productIds.add(String(prod._id || prod.id || prod));
        });

        if (total > used) {
            aggs[p.plan_type].purchase_id = p.id || p._id;
        } else if (!aggs[p.plan_type].purchase_id) {
            aggs[p.plan_type].purchase_id = p.id || p._id;
        }
      }
    });
    return aggs;
  }, [purchasedPlans]);

  const handleSelectionChange = (rows: Product[]) => {
    const selectableRows = rows.filter(r => !activeProductIds.has(String(r.id)));

    const agg = selectedPlan ? planAggregates[selectedPlan.plan_type] : null;
    let maxAllowed = selectedPlan?.max_products || 0;
    
    if (agg) {
      const remaining = agg.total - agg.used;
      if (remaining > 0) {
        maxAllowed = remaining;
      }
    }

    if (selectedPlan && selectableRows.length > maxAllowed) {
      toast.warning(`Limit exceeded! You can only select ${maxAllowed} more product(s).`);
      
      const limitedRows = selectableRows.slice(0, maxAllowed);
      const ids = limitedRows.map((p) => p.id);
      
      const updateMap: Record<string, boolean> = {};
      filteredProducts.forEach(p => {
        updateMap[String(p.id || p._id)] = false;
      });
      ids.forEach(id => {
        updateMap[String(id)] = true;
      });
      dispatch(setMultipleSelections(updateMap));
      return;
    }

    const ids = selectableRows.map((p) => p.id);
    const updateMap: Record<string, boolean> = {};
    filteredProducts.forEach(p => {
      updateMap[String(p.id || p._id)] = false;
    });
    ids.forEach(id => {
      updateMap[String(id)] = true;
    });
    dispatch(setMultipleSelections(updateMap));
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
    }
  ], [currency]);

  const handlePurchaseClick = (plan: GPlan) => {
    setSelectedPlan(plan);
    dispatch(replaceSelections({}));
    setIsModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPlan) return;
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }
    
    const agg = planAggregates[selectedPlan.plan_type];
    const isRefill = agg && (agg.total - agg.used > 0);
    
    if (isRefill) {
      executePurchase(true);
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const executePurchase = async (isRefill = false) => {
    if (!selectedPlan) return;
    setIsPurchasing(true);
    
    const agg = planAggregates[selectedPlan.plan_type];
    
    try {
      const payload: any = {
        plan_id: selectedPlan.id || selectedPlan._id,
        product_ids: selectedProductIds,
      };
      if (isRefill) {
        payload.is_refill = true;
        if (agg?.purchase_id) {
          payload.purchase_id = agg.purchase_id;
        }
      }

      const res = await api.post(endPointApi.postPurchaseGeneralPlan, payload);
      if (res.data.success) {
        toast.success(res.data.message || `${selectedPlan.plan_type} plan updated successfully!`);
        setIsConfirmModalOpen(false);
        setIsModalOpen(false);
        dispatch(replaceSelections({}));
        refreshBalance();
        fetchData();
      }
    } catch (error: any) {
      console.error("General Plan Purchase Error:", error.response?.data || error.message || error);
      toast.error(error?.response?.data?.message || error.message || "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
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
        });
        return;
      }
      productList.forEach((prod: any) => {
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
      width: 140,
      cellRenderer: (params: any) => (
        <span className="capitalize">{params.value}</span>
      )
    },
    {
      headerName: "Expiry Date",
      field: "expire_at",
      width: 130,
      cellRenderer: (params: any) => {
        if (!params.value) return "-";
        const date = new Date(params.value);
        return <span>{date.toLocaleDateString('en-GB')}</span>;
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

  const rentHistoryCount = useMemo(() => purchasedPlans.reduce((acc, purchase) => {
    return acc + (purchase.product_ids || []).filter((prod: any) => {
      const fullProduct = products.find(p => String(p.id) === String(prod._id || prod));
      return fullProduct?.product_type_name?.toLowerCase() === "rent" || prod.product_type_name?.toLowerCase() === "rent";
    }).length;
  }, 0), [purchasedPlans, products]);

  const sellHistoryCount = useMemo(() => purchasedPlans.reduce((acc, purchase) => {
    return acc + (purchase.product_ids || []).filter((prod: any) => {
      const fullProduct = products.find(p => String(p.id) === String(prod._id || prod));
      return fullProduct?.product_type_name?.toLowerCase() === "sell" || prod.product_type_name?.toLowerCase() === "sell";
    }).length;
  }, 0), [purchasedPlans, products]);


  if (loading) {
    return <PageLoader fullScreen={false} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {plans.map((plan) => (
          <div key={plan._id} className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 flex flex-col h-full bg-white dark:bg-[#0d111c] group ${plan.popular ? 'border-brand-500 shadow-2xl shadow-brand-100 sm:scale-[1.02] z-10' : 'border-gray-200 hover:border-brand-300 hover:shadow-xl shadow-sm'}`}>
            {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-lg">Popular</span>}
            
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Package className="w-6 h-6 text-brand-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2 dark:text-gray-100">{plan.plan_type}</h4>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-brand-600">{currency}{plan.amount}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              {(() => {
                const agg = planAggregates[plan.plan_type];
                if (agg) {
                  const remaining = Math.max(0, agg.total - agg.used);
                  return (
                    <div className="mb-2 p-3 bg-brand-50 border border-brand-100 rounded-xl dark:bg-[#1c2938]">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-brand-600 font-medium">Remaining Slots</span>
                        <span className="font-bold text-brand-800 dark:text-brand-200">
                          {remaining} / {agg.total}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-green-100 p-1 rounded-full flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{plan.max_products} Max Products</p>
                </div>
              </div>
              {(plan.features || []).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 p-1 rounded-full flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-sm dark:text-gray-300">{feature}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => handlePurchaseClick(plan)} 
              variant={plan.popular ? 'primary' : 'outline'} 
              className="w-full !py-3.5 rounded-xl font-bold btn-primary"
            >
              {(() => {
                const agg = planAggregates[plan.plan_type];
                if (!agg) return 'Select Plan';
                const remaining = Math.max(0, agg.total - agg.used);
                if (remaining > 0) return 'Add More Products';
                return 'Select Plan';
              })()}
            </Button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No general plans available at the moment.
          </div>
        )}
      </div>

      <div className="space-y-2 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">General Plan History</h2>
          </div>
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
                {tab === 'rent' ? 'Rent' : 'Sell'} ({tab === 'rent' ? rentHistoryCount : sellHistoryCount})
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
                  Select Products for {selectedPlan?.plan_type}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Available Slots: <span className="font-semibold text-emerald-600">
                    {(() => {
                      const agg = selectedPlan ? planAggregates[selectedPlan.plan_type] : null;
                      if (!agg || agg.total === 0) return selectedPlan?.max_products || 0;
                      const remaining = Math.max(0, agg.total - agg.used);
                      return remaining > 0 ? remaining : selectedPlan?.max_products;
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

                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700 gap-1.5">
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
                return !activeProductIds.has(String(params.data.id));
              }}
              getRowStyle={(params) => {
                if (activeProductIds.has(String(params.data.id))) {
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
              onClick={handleConfirmPurchase}
              disabled={isPurchasing || selectedProductIds.length === 0}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-100/50"
            >
              {isPurchasing ? 'Processing...' : 'Activate Plan'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 relative">
          <button
            onClick={() => setIsConfirmModalOpen(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-20 h-20 bg-[#F4F6FF] rounded-[20px] flex items-center justify-center mb-6">
              <Rocket className="w-10 h-10 text-[#6B46FF]" />
            </div>

            <h3 className="text-[28px] font-black text-[#111827] mb-3 font-outfit tracking-tight">
              Confirm Purchase
            </h3>

            <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
              You are about to activate the <span className="font-bold text-gray-900 capitalize">{selectedPlan?.plan_type}</span> plan for <span className="font-bold text-gray-900">{selectedProductIds.length}</span> product(s).
              <br />
              <span className="text-[#6B46FF] font-bold mt-2 block">
                Do you want to purchase this plan?
              </span>
            </p>

            <div className="w-full bg-[#F9FAFB] rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#6B7280] font-semibold text-sm">Plan Amount</span>
                <span className="text-[#111827] font-bold">₹{selectedPlan?.amount || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-[#6B7280] font-semibold text-sm">GST (18%)</span>
                <span className="text-[#111827] font-bold">+₹{selectedPlan ? (selectedPlan.amount * 0.18).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[#111827] font-black text-sm uppercase tracking-wider">Total Payable</span>
                <span className="text-[#6B46FF] font-black text-xl">₹{selectedPlan ? (selectedPlan.amount + (selectedPlan.amount * 0.18)).toFixed(2) : '0.00'}</span>
              </div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] text-center mt-4 uppercase tracking-wider">
                Amount will be deducted from your wallet balance
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                variant="primary"
                onClick={() => executePurchase(false)}
                disabled={isPurchasing}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl py-4 font-bold text-[15px] transition-all shadow-lg shadow-purple-500/25 border-0"
              >
                {isPurchasing ? 'Processing...' : 'Confirm & Activate'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-4 font-bold text-[15px] transition-all"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GeneralPlanView;
