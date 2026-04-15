"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Rocket, History, TrendingUp, Sparkles, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
  const [priorityCount, setPriorityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlanForBoost, setSelectedPlanForBoost] = useState<any>(null);
  const [priorityProducts, setPriorityProducts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userInfoStr = localStorage.getItem("user_info");
      const vendor = userInfoStr ? JSON.parse(userInfoStr) : null;
      const vendor_id = vendor?.id || vendor?._id;

      const [plansRes, purchasesRes, productsRes] = await Promise.all([
        api.get(endPointApi.getAllRentalBoostPlans, { params: { status: "active" } }),
        api.get(endPointApi.getVendorRentalBoostPurchases),
        api.get(endPointApi.postAllVendorProductList, {
          params: { vendor_id, is_priority: true, approval_status: "approved", limit: 1000 }
        })
      ]);

      if (plansRes?.data?.success) setPlans(plansRes.data.data);
      if (purchasesRes?.data?.success) setPurchases(purchasesRes.data.data);

      const products = productsRes?.data?.data || [];
      setPriorityProducts(products);
      const nonBoostedPriority = products.filter((p: any) => p.is_priority === true && !p.is_boosted);
      setPriorityCount(nonBoostedPriority.length);

    } catch (error) {
      console.error("Error fetching booster data:", error);
      toast.error("Failed to load booster data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeBooster = useMemo(() => {
    const now = new Date();
    return purchases.find(p => p.payment_status === 'completed' && new Date(p.expiry_date) > now);
  }, [purchases]);

  const handleOpenConfirm = (plan: any) => {
    if (priorityCount === 0) {
      toast.warning("You don't have any products with an active Priority Plan to boost.");
      return;
    }
    setSelectedPlanForBoost(plan);
    setShowConfirmModal(true);
  };

  const handleBulkBoost = async () => {
    if (!selectedPlanForBoost) return;

    const priceToPay = activeBooster ? 0 : selectedPlanForBoost.price;
    if (priceToPay > balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }

    try {
      setIsPurchasing(true);
      const res = await api.post(endPointApi.purchaseRentalBoostPlan, {
        plan_id: selectedPlanForBoost.id || selectedPlanForBoost._id,
      });

      if (res?.data?.success) {
        toast.success(res.data.message || "Priority products boosted successfully!");
        refreshBalance();
        fetchData();
        setShowConfirmModal(false);
      }
    } catch (error: any) {
      console.error("Bulk boost error:", error);
      toast.error(error?.response?.data?.message || "Failed to apply bulk boost");
    } finally {
      setIsPurchasing(false);
    }
  };

  const flattenedBoosterHistory = useMemo(() => {
    const rows: any[] = [];
    purchases.forEach(purchase => {
      const product = priorityProducts.find(p => p._id === purchase.product_id || p.id === purchase.product_id);
      rows.push({
        ...purchase,
        product_name: purchase.product_name || product?.product_name || "All Priority Products",
        category_name: product?.category_name || "-",
        sub_category_name: product?.sub_category_name || "-",
      });
    });
    return rows.sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime());
  }, [purchases, priorityProducts]);

  const columns: ColDef[] = [
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
      headerName: "Plan",
      field: "plan_name",
      width: 150,
      cellRenderer: (params: any) => (
        <span className=" text-xs font-semibold">{params.value}</span>
      )
    },
    {
      headerName: "Expiry Date",
      field: "expiry_date",
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
      field: "expiry_date",
      width: 120,
      cellRenderer: (params: any) => {
        const isExpired = new Date(params.value) < new Date();
        return <StatusBadge status={isExpired ? "expired" : "active"} />;
      }
    }
  ];

  if (loading) {
    return <PageLoader fullScreen={false} />;
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

            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform dark:text-gray-200 dark:bg-black">
                <Rocket className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1 dark:text-gray-200">{plan.name || `${plan.days}-Day Boost`}</h4>
              <p className="text-gray-500 text-sm line-clamp-2 dark:text-gray-200">{plan.description || `Boost all priority products for ${plan.days} days`}</p>
            </div>

            {/* Price block */}
            <div className={`mb-8 p-5 rounded-2xl dark:bg-black ${activeBooster ? 'bg-green-50' : 'bg-indigo-50'}`}>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-extrabold ${activeBooster ? 'text-green-600' : 'text-indigo-900'}`}>
                  {activeBooster ? 'FREE' : `${currency}${plan.price}`}
                </span>
                {!activeBooster && <span className="text-indigo-500 font-medium">/ plan</span>}
                {activeBooster && <span className="text-green-600 font-bold text-sm ml-2">Active</span>}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full dark:bg-indigo-900/40">
                  {plan.days} days duration
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full dark:bg-slate-800">
                  {priorityCount} products eligible
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
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
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => handleOpenConfirm(plan)}
                disabled={isPurchasing}
                className={`w-full !py-4 rounded-xl font-bold btn-primary dark:bg-[#1c2938] ${activeBooster ? 'shadow-green-100' : 'shadow-indigo-100'}`}
                variant="primary"
              >
                {isPurchasing ? "Processing..." : (activeBooster ? "Sync New Products" : `Boost All Products for ${currency}${plan.price}`)}
              </Button>
              <p className="text-center text-[10px] text-gray-400 font-medium px-4 leading-relaxed">
                {activeBooster
                  ? "This will apply the current active boost expiry to any new products for free."
                  : `Apply this ${plan.days}-day boost to all ${priorityCount} priority products simultaneously.`}
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
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="max-w-md w-full"
      >
        <div className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center animate-bounce ${activeBooster ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {activeBooster ? <Zap size={36} /> : <Rocket size={36} />}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-200">
              {activeBooster ? "Sync Active Boost" : "Activate Booster Plan"}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              {activeBooster
                ? `You have an active booster subscription. This will boost all your ${priorityCount} priority products until ${new Date(activeBooster.expiry_date).toLocaleDateString()} for free.`
                : `Are you sure you want to boost all ${priorityCount} priority products for ${currency}${selectedPlanForBoost?.price}? This boost will be active for ${selectedPlanForBoost?.days} days.`}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner dark:bg-[#1c2938] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-200">Booster Plan</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{selectedPlanForBoost?.name || `${selectedPlanForBoost?.days}-Day Boost`}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-200">Products to Boost</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{priorityCount} Items</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black border-t pt-2 border-gray-200 dark:border-gray-700 dark:text-gray-200">
              <span className="text-gray-900 dark:text-gray-200 uppercase text-xs">Total Payable</span>
              <span className={`text-lg ${activeBooster ? 'text-green-600' : 'text-indigo-600'}`}>
                {activeBooster ? 'FREE' : `${currency}${selectedPlanForBoost?.price}`}
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
              {isPurchasing ? "Processing..." : (activeBooster ? "Confirm Free Boost" : "Confirm & Pay")}
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Booster Purchase History</h2>
        </div>

        {/* <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden"> */}
          <AgGridTable
            rowData={flattenedBoosterHistory}
            columns={columns}
            showCheckboxes={false}
            height={400}
            rowHeight={52}
          />
        {/* </div> */}
      </div>
    </div>
  );
};

export default BoosterPlanView;
