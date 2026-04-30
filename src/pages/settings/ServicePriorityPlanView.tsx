"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Zap, Search, Check, History, Sparkles, Clock } from "lucide-react";
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

interface PriorityPlan {
  _id?: string;
  id?: string;
  monthly_price: number;
  yearly_price: number;
  addon_price: number;
  features?: string[];
}

const ServicePriorityPlanView: React.FC = () => {
  const { currency, balance, refreshBalance } = useWallet();
  const [plan, setPlan] = useState<PriorityPlan | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<"monthly" | "yearly">("monthly");
  const [hasDurationAddon, setHasDurationAddon] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [historyTab, setHistoryTab] = useState<"free" | "paid">("paid");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, purchasesRes, servicesRes] = await Promise.all([
        api.get(endPointApi.getServicePriorityPlanOptions),
        api.get(endPointApi.getPurchasedServicePriorityPlans),
        api.get(endPointApi.postAllVendorServiceList, { params: { limit: 1000 } })
      ]);
      const activePlans = plansRes.data.data || [];
      setPlan(activePlans.length > 0 ? activePlans[0] : null);
      setPurchases(purchasesRes.data.data || []);
      setServices(servicesRes.data.data || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPurchase = (duration: "monthly" | "yearly") => {
    setSelectedDuration(duration);
    setHasDurationAddon(false);
    setIsModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!plan) return;
    const planId = plan._id || plan.id;
    if (!planId) {
      toast.error("Invalid plan selection. Please refresh and try again.");
      return;
    }

    const amount = selectedDuration === "monthly" ? plan.monthly_price : plan.yearly_price;
    const totalAmount = amount + (hasDurationAddon ? plan.addon_price : 0);
    
    if (totalAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsPurchasing(true);
    try {
      await api.post(endPointApi.postCreateServicePriorityPlan, {
        plan_id: planId,
        duration: selectedDuration,
        has_duration_addon: hasDurationAddon
      });
      toast.success("Priority activated for all services!");
      setIsModalOpen(false);
      refreshBalance();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const freeServices = useMemo(() => services.filter(s => (s.pricing_type || 'paid').toLowerCase() === 'free'), [services]);
  const paidServices = useMemo(() => services.filter(s => (s.pricing_type || 'paid').toLowerCase() !== 'free'), [services]);

  const filteredPurchases = useMemo(() => {
    if (historyTab === 'free') return purchases.filter(p => p.pricing_type?.toLowerCase() === 'free');
    return purchases.filter(p => (p.pricing_type || 'paid').toLowerCase() !== 'free');
  }, [purchases, historyTab]);

  const columns: ColDef[] = [
    { headerName: "Plan", field: "plan_name", flex: 1 },
    { 
      headerName: "Amount", 
      field: "amount", 
      width: 120,
      valueFormatter: (p) => `${currency}${p.value}`
    },
    {
      headerName: "Services",
      field: "affected_services_count",
      width: 100,
      valueFormatter: (p) => `${p.value || 0} services`
    },
    { 
      headerName: "Start Date", 
      field: "start_at", 
      width: 120,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-'
    },
    { 
      headerName: "Expiry", 
      field: "expire_at", 
      width: 120,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-'
    },
    { 
      headerName: "Status", 
      field: "status",
      width: 100,
      cellRenderer: (p: any) => {
        const isActive = p.data.is_active;
        const daysRemaining = p.data.days_remaining;
        return (
          <div className="flex items-center h-full">
            <StatusBadge 
              status={isActive ? 'active' : 'expired'} 
            />
            {isActive && daysRemaining > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                {daysRemaining}d left
              </span>
            )}
          </div>
        );
      }
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
    }
  ];

  return (
    <div className="relative space-y-10">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-2xl min-h-[60vh]">
          <PageLoader fullScreen={false} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {plan && (
          <>
            {/* Monthly Plan Card */}
            <div className="p-6 rounded-3xl border border-gray-200 bg-white dark:bg-gray-800 flex flex-col hover:border-brand-500 transition-all group">
              <div className="mb-3 text-center">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                  <Zap className="w-5 h-5 text-brand-500" />
                </div>
                <h4 className="text-base font-bold mb-0.5">Monthly Priority</h4>
                <p className="text-gray-500 text-xs">All services included</p>
              </div>
              <div className="text-3xl font-black mb-6 text-center">{currency}{plan.monthly_price} <span className="text-sm font-normal text-gray-500">/ month</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                {(plan.features || []).map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500"/> {feature}
                  </li>
                ))}
                {(!plan.features || plan.features.length === 0) && (
                  <>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> Top Placement</li>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> Verified Badge</li>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> All services (Paid + Free)</li>
                  </>
                )}
              </ul>
              <Button onClick={() => handleOpenPurchase("monthly")} className="btn-primary !py-3.5">Select Monthly</Button>
            </div>

            {/* Yearly Plan Card */}
            <div className="p-6 rounded-3xl border-2 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10 flex flex-col relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">BEST VALUE</div>
              <div className="mb-3 text-center">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                  <Zap className="w-5 h-5 text-brand-500" />
                </div>
                <h4 className="text-base font-bold mb-0.5">Annual Priority</h4>
                <p className="text-gray-500 text-xs">Best value plan</p>
              </div>
              <div className="text-3xl font-black mb-6 text-center">{currency}{plan.yearly_price} <span className="text-sm font-normal text-gray-500">/ year</span></div>
              <ul className="space-y-3 mb-8 flex-grow">
                {(plan.features || []).map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500"/> {feature}
                  </li>
                ))}
                {(!plan.features || plan.features.length === 0) && (
                  <>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> Top Placement</li>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> Verified Badge</li>
                    <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500"/> All services (Paid + Free)</li>
                    <li className="flex items-center gap-2 text-sm font-bold text-brand-600"><Sparkles size={16}/> Annual Exclusive Addon</li>
                  </>
                )}
              </ul>
              <Button onClick={() => handleOpenPurchase("yearly")} className="btn-primary bg-brand-600 hover:bg-brand-700 !py-3.5">Select Yearly</Button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Priority Purchase History</h2>
          </div>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 gap-1">
            {(["free", "paid"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition capitalize ${
                  historyTab === tab
                    ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>
        </div>
        <AgGridTable rowData={filteredPurchases} columns={columns} height={400} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md w-full">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-brand-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Activate {selectedDuration} Priority</h3>
            <p className="text-sm text-gray-500 mt-1">This will apply priority status to ALL your services (Paid + Free).</p>
          </div>
          
          {selectedDuration === "yearly" && plan && (
            <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${hasDurationAddon ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 bg-gray-50 dark:bg-gray-800'}`}
                 onClick={() => setHasDurationAddon(!hasDurationAddon)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hasDurationAddon}
                    onChange={() => setHasDurationAddon(!hasDurationAddon)}
                    className="w-4 h-4 accent-brand-600 cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <p className="font-bold text-sm">Exclusive Priority Annual Benefit</p>
                    <p className="text-[10px] text-gray-500">Unlimited service listings for the year</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-600 text-sm">+ {currency}{plan.addon_price}</p>
                  <p className="text-[8px] uppercase font-bold text-gray-400 tracking-tighter">Optional Add-on</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between text-sm mb-2 text-gray-600">
              <span>{selectedDuration === 'monthly' ? 'Monthly' : 'Yearly'} Plan</span>
              <span>{currency}{selectedDuration === 'monthly' ? plan?.monthly_price : plan?.yearly_price}</span>
            </div>
            {services.length > 0 && (
              <div className="flex justify-between text-sm mb-2 text-gray-600">
                <span>Services Covered</span>
                <span className="font-semibold">
                  {services.length} Total
                  <span className="ml-1 text-gray-400">|</span>
                  <span className="ml-1 text-blue-600">{paidServices.length} Paid</span>
                  {freeServices.length > 0 && (
                    <span className="ml-1 text-green-600">(+{freeServices.length} Free)</span>
                  )}
                </span>
              </div>
            )}
            {hasDurationAddon && (
              <div className="flex justify-between text-sm mb-2 text-gray-600">
                <span>Annual Benefit Addon</span>
                <span>{currency}{plan?.addon_price}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Total Payable</span>
              <span className="text-brand-600">{currency}{(selectedDuration === 'monthly' ? plan?.monthly_price : plan?.yearly_price)! + (hasDurationAddon ? (plan?.addon_price || 0) : 0)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handlePurchase} disabled={isPurchasing} className="w-full btn-primary py-4 font-bold shadow-lg shadow-brand-100">
              {isPurchasing ? 'Processing...' : 'Confirm & Pay'}
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full text-gray-400 font-medium">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicePriorityPlanView;
