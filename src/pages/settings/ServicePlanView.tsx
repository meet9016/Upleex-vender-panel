"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Briefcase, Search, Check, History } from "lucide-react";
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

interface ServiceListingPlan {
  _id?: string;
  id?: string;
  plan_name: string;
  months: number;
  amount: number;
  max_services: number;
  status: string;
}

interface Service {
  id: string;
  _id?: string;
  service_name: string;
  category_name?: string;
  price: number;
  image?: string;
  expires_at?: string;
  status: string;
  active_plan_name?: string; // Add this field
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const ServicePlanView: React.FC = () => {
  const { currency, balance, refreshBalance } = useWallet();
  const [plans, setPlans] = useState<ServiceListingPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [purchasedPlans, setPurchasedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ServiceListingPlan | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [gridSearch, setGridSearch] = useState("");

  const planAggregates = useMemo(() => {
    const aggregates: Record<string, { total: number; used: number; serviceIds: Set<string>; planName: string }> = {};
    const now = new Date();

    const activePurchases = purchasedPlans.filter(p => new Date(p.expire_at) > now);

    activePurchases.forEach(p => {
      const planName = p.plan_name;
      if (!aggregates[planName]) {
        aggregates[planName] = { total: 0, used: 0, serviceIds: new Set(), planName };
      }
      aggregates[planName].total += Number(p.max_services || 0);

      const sIds = p.service_ids || [];
      sIds.forEach((svc: any) => {
        const id = typeof svc === 'string' ? svc : (svc.id || svc._id || svc.service_id);
        if (id) {
          aggregates[planName].serviceIds.add(String(id));
        }
      });
    });

    Object.keys(aggregates).forEach(planName => {
      aggregates[planName].used = aggregates[planName].serviceIds.size;
    });

    return aggregates;
  }, [purchasedPlans]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, servicesRes, purchasesRes] = await Promise.all([
        api.get(endPointApi.getServicePlanOptions),
        api.get(endPointApi.postAllVendorServiceList, { params: { limit: 1000 } }),
        api.get(endPointApi.getPurchasedServicePlans)
      ]);

      setPlans(plansRes.data.data || []);
      
      // Map services to include active plan info
      const allServices = servicesRes.data.data || [];
      const activeServicePlans = (purchasesRes.data.data || [])
        .filter((purchase: any) => new Date(purchase.expire_at) > new Date())
        .flatMap((purchase: any) => 
          (purchase.service_ids || []).map((service: any) => ({
            service_id: service._id || service.id,
            plan_name: purchase.plan_name,
            expires_at: purchase.expire_at,
          }))
        );

      const servicesWithPlanInfo = allServices.map((service: any) => {
        const activePlan = activeServicePlans.find((ap: any) => ap.service_id === (service._id || service.id));
        return {
          ...service,
          active_plan_name: activePlan ? activePlan.plan_name : undefined,
          expires_at: activePlan ? activePlan.expires_at : service.expires_at,
        };
      });
      setServices(servicesWithPlanInfo);
      
      setPurchasedPlans(purchasesRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load service plan data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPlan = (plan: ServiceListingPlan) => {
    setSelectedPlan(plan);
    setSelectedServiceIds([]);
    setIsModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    const planId = selectedPlan._id || selectedPlan.id;
    
    if (!planId) {
      toast.error("Invalid plan selection. Please refresh and try again.");
      return;
    }

    if (selectedServiceIds.length === 0) {
      toast.error("Please select at least one service.");
      return;
    }

    const agg = planAggregates[selectedPlan.plan_name] || { total: 0, used: 0, serviceIds: new Set() };
    const remainingSlots = Math.max(0, agg.total - agg.used);

    // Identify truly new services (not already in THIS plan)
    const trulyNewIds = selectedServiceIds.filter(id => !agg.serviceIds.has(String(id)));

    // Deduction is only needed if new services exceed current remaining slots
    const isNewPurchaseNeeded = trulyNewIds.length > remainingSlots || agg.total === 0;
    const priceToPay = isNewPurchaseNeeded ? selectedPlan.amount : 0;

    if (priceToPay > balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }

    if (trulyNewIds.length > (isNewPurchaseNeeded ? selectedPlan.max_services : remainingSlots)) {
      toast.error(`Exceeds available capacity. You can add up to ${isNewPurchaseNeeded ? selectedPlan.max_services : remainingSlots} services.`);
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await api.post(endPointApi.postCreateServiceListingPlan, {
        plan_id: planId,
        service_ids: selectedServiceIds,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Service plan activated successfully!");
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

  const purchaseHistoryColumns = useMemo((): ColDef[] => [
    { headerName: "Plan Name", field: "plan_name", minWidth: 150 },
    {
      headerName: "Amount",
      field: "amount",
      width: 100,
      valueFormatter: (p) => `${currency}${p.value?.toLocaleString()}`
    },
    { headerName: "Months", field: "months", width: 90 },
    {
      headerName: "Services Covered",
      field: "service_ids",
      width: 200,
      valueFormatter: (p) => {
        if (!p.value || !Array.isArray(p.value)) return "0";
        return p.value.map((s: any) => s.service_name).join(", ");
      }
    },
    {
      headerName: "Start Date",
      field: "start_at",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString('en-GB');
      }
    },
    {
      headerName: "Expiry Date",
      field: "expire_at",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString('en-GB');
      }
    },
    {
      headerName: "Status",
      field: "expire_at",
      width: 110,
      cellRenderer: (params: any) => {
        const isExpired = new Date(params.value) < new Date();
        return <StatusBadge status={isExpired ? "expired" : "active"} />;
      }
    }
  ], [currency]);

  const serviceSelectionColumns = useMemo((): ColDef[] => [
    {
      headerName: "Service",
      field: "service_name",
      minWidth: 240,
      flex: 1,
      cellRenderer: (params: any) => {
        const service = params.data;
        const imageUrl = service.image || DEFAULT_PLACEHOLDER;
        return (
          <div className="flex items-center gap-3 h-full">
            <img
              src={imageUrl}
              className="w-9 h-9 rounded-lg object-cover border border-gray-100"
              onError={(e: any) => e.target.src = DEFAULT_PLACEHOLDER}
            />
            <span className="font-bold text-[13px] text-gray-800 dark:text-gray-100 truncate" title={service.service_name}>
              {service.service_name}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Category",
      field: "category_name",
      width: 150,
    },
    {
      headerName: "Active Plan",
      field: "active_plan_name",
      width: 120,
      cellRenderer: (params: any) => {
        if (!params.value) return "-";
        return (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: "Price",
      field: "price",
      width: 100,
      valueFormatter: (p) => `${currency}${p.value?.toLocaleString()}`
    },
    {
      headerName: "Current Expiry",
      field: "listing_expires_at",
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString('en-GB');
      },
      cellRenderer: (params: any) => {
        if (!params.value) return "-";
        const expiryDate = new Date(params.value);
        const now = new Date();
        const isExpired = expiryDate < now;
        return (
          <span className={`text-xs font-medium ${
            isExpired ? 'text-red-600' : 'text-green-600'
          }`}>
            {expiryDate.toLocaleDateString('en-GB')}
            {isExpired && ' (Expired)'}
          </span>
        );
      }
    },
  ], [currency]);

  const filteredServices = useMemo(() => {
    return services.filter(s =>
      s.service_name.toLowerCase().includes(gridSearch.toLowerCase()) ||
      s.category_name?.toLowerCase().includes(gridSearch.toLowerCase())
    );
  }, [services, gridSearch]);

  if (loading) return <PageLoader fullScreen={false} />;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="relative p-8 rounded-3xl border border-gray-200 transition-all duration-500 flex flex-col h-full bg-white group dark:bg-[#0d111c] hover:border-blue-300 hover:shadow-xl shadow-sm"
          >
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1 dark:text-gray-100">{plan.plan_name}</h4>
              <p className="text-gray-500 text-sm dark:text-gray-400">Listing plan for services</p>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-8 p-4 bg-blue-50 rounded-2xl dark:bg-[#1c2938]">
              <span className="text-4xl font-extrabold text-blue-700">
                {currency}{plan.amount}
              </span>
              <span className="text-blue-500 font-medium">/ {plan.months} months</span>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              {(() => {
                const myActive = purchasedPlans.find(p => p.plan_name === plan.plan_name && new Date(p.expire_at) > new Date());
                if (myActive) {
                  const used = myActive.service_ids?.length || 0;
                  const total = myActive.max_services || plan.max_services;
                  const remaining = Math.max(0, total - used);
                  return (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-100 rounded-xl dark:bg-[#1c2938]">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600 font-medium">Remaining Slots</span>
                        <span className="font-bold text-blue-800 dark:text-blue-200">
                          {remaining} / {total}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {plan.max_services === 0 ? 'Unlimited' : `${plan.max_services}`} Service Slots
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Active for {plan.months} Months</span>
              </div>
            </div>

            <Button
              onClick={() => handleSelectPlan(plan)}
              className="w-full !py-4 rounded-xl font-bold btn-primary shadow-lg shadow-blue-50"
              variant={planAggregates[plan.plan_name] ? "outline" : "primary"}
            >
              {planAggregates[plan.plan_name] ? 'Add More Services' : 'Select Plan'}
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Service Plan History</h2>
        </div>
        <AgGridTable
          rowData={purchasedPlans}
          columns={purchaseHistoryColumns}
          showCheckboxes={false}
          height={400}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-6xl w-full"
      >
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-6 pr-14 py-4 border-b">
            <h3 className="text-xl font-bold">Select Services for {selectedPlan?.plan_name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Available Slots: <span className="font-semibold text-blue-600">
                {(() => {
                  const agg = selectedPlan ? planAggregates[selectedPlan.plan_name] : null;
                  if (!agg || agg.total === 0) return selectedPlan?.max_services || 0;
                  const remaining = Math.max(0, agg.total - agg.used);
                  return remaining > 0 ? remaining : selectedPlan?.max_services;
                })()}
              </span>
            </p>
          </div>
          <div className="flex-1 px-6 overflow-hidden">
            <AgGridTable
              columns={serviceSelectionColumns}
              rowData={filteredServices}
              onSelectionChange={(rows) => {
                const ids = rows.map(r => r._id || r.id).filter(id => !!id);
                if (selectedPlan?.max_services !== 0 && ids.length > (selectedPlan?.max_services || 0)) {
                  toast.error(`You can only select up to ${selectedPlan?.max_services} services for this plan.`);
                  // Optionally, you can revert the selection or take other actions
                  return;
                }
                setSelectedServiceIds(ids);
              }}
              showCheckboxes={true}
              height={500}
              isRowSelectable={(params) => {
                const isAlreadyActive = params.data.active_plan_name;
                const isMaxServicesReached = selectedPlan?.max_services !== 0 && selectedServiceIds.length >= (selectedPlan?.max_services || 0);
                
                // Disable if already active or if max services reached and this service is not already selected
                return !isAlreadyActive && !(isMaxServicesReached && !selectedServiceIds.includes(params.data._id || params.data.id));
              }}
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
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handlePurchase}
              disabled={isPurchasing || selectedServiceIds.length === 0}
              className="btn-primary"
            >
              {isPurchasing ? 'Processing...' : (
                (() => {
                  const agg = selectedPlan ? planAggregates[selectedPlan.plan_name] : null;
                  const remaining = agg ? Math.max(0, agg.total - agg.used) : 0;
                  return (remaining > 0 && selectedServiceIds.length <= remaining) ? 'Add to Plan (Free)' : 'Activate Plan';
                })()
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicePlanView;
