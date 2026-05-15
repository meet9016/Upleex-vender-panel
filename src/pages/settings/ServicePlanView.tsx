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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setMultipleSelections, replaceSelections } from "@/store/slices/selectionSlice";

interface ServiceListingPlan {
  _id?: string;
  id?: string;
  plan_name: string;
  months: number;
  amount: number;
  max_services: number;
  status: string;
  features?: string[];
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
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServiceListingPlan | null>(null);
  
  // Redux state for persistent selection
  const dispatch = useDispatch();
  const selectedIdsMap = useSelector((state: RootState) => state.selection.selectedIds);
  const selectedServiceIds = useMemo(() => 
    Object.keys(selectedIdsMap).filter(id => selectedIdsMap[id]), 
    [selectedIdsMap]
  );

  const setSelectedServiceIds = (ids: string[] | ((prev: string[]) => string[])) => {
    const newIds = typeof ids === 'function' ? ids(selectedServiceIds) : ids;
    const newMap: Record<string, boolean> = {};
    newIds.forEach(id => newMap[id] = true);
    dispatch(replaceSelections(newMap));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchaseSummary, setPurchaseSummary] = useState<{ amount: number; gstAmount: number; totalAmount: number; count: number } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [gridSearch, setGridSearch] = useState("");
  const [hasShownLimitToast, setHasShownLimitToast] = useState(false);
  const fetchedRef = React.useRef(false);

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
    if (!fetchedRef.current) {
      fetchData();
      fetchedRef.current = true;
    }
  }, []);

  const handleSelectPlan = (plan: ServiceListingPlan) => {
    setSelectedPlan(plan);
    setSelectedServiceIds([]);
    setIsModalOpen(true);
  };

  const handlePurchase = async (isConfirmed = false) => {
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

    // Strict limit check requested by user: block if exceeding slots
    const aggForLimit = planAggregates[selectedPlan.plan_name] || { total: 0, used: 0, serviceIds: new Set() };
    const remainingSlotsForLimit = aggForLimit && aggForLimit.total > 0 ? Math.max(0, aggForLimit.total - aggForLimit.used) : (selectedPlan.max_services || 0);

    if (selectedServiceIds.length > (remainingSlotsForLimit || 0)) {
      toast.error(`You cannot select more than ${remainingSlotsForLimit} service(s) for this plan.`);
      return;
    }

    const agg = planAggregates[selectedPlan.plan_name] || { total: 0, used: 0, serviceIds: new Set() };
    const remainingSlots = Math.max(0, agg.total - agg.used);

    // Identify truly new services (not already in THIS plan)
    const trulyNewIds = selectedServiceIds.filter(id => !agg.serviceIds.has(String(id)));

    // Deduction is only needed if new services exceed current remaining slots
    const isNewPurchaseNeeded = trulyNewIds.length > remainingSlots || agg.total === 0;
    const priceToPay = isNewPurchaseNeeded ? selectedPlan.amount : 0;

    const gstAmount = Math.round(priceToPay * 0.18);
    const totalAmount = priceToPay + gstAmount;

    if (!isConfirmed) {
      setPurchaseSummary({
        amount: priceToPay,
        gstAmount: gstAmount,
        totalAmount: totalAmount,
        count: selectedServiceIds.length
      });
      setShowConfirmModal(true);
      return;
    }

    if (totalAmount > balance) {
      toast.error(`Insufficient wallet balance. Total required including 18% GST is ₹${totalAmount}.`);
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
        setShowConfirmModal(false);
        refreshBalance();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleConfirmPurchase = () => {
    handlePurchase(true);
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
      headerName: "Pricing",
      field: "pricing_type",
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={(params.value || 'paid').toLowerCase() === 'free' ? 'free' : 'paid'} />
        </div>
      )
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

  return (
    <div className="relative space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-2xl min-h-[60vh]">
          <PageLoader fullScreen={false} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="relative p-8 rounded-3xl border-2 border-gray-200 transition-all duration-500 flex flex-col h-full bg-white group dark:bg-[#0d111c] hover:border-blue-500 hover:shadow-2xl hover:scale-[1.02] shadow-sm"
          >
            <div className="mb-3 text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform dark:bg-[#1c2938]">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-0.5 dark:text-gray-100">{plan.plan_name}</h4>
              <p className="text-gray-500 text-xs dark:text-gray-400">Listing plan for services</p>
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
              {(plan.features || []).map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{feature}</span>
                </div>
              ))}
              {(!plan.features || plan.features.length === 0) && (
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Active for {plan.months} Months</span>
                </div>
              )}
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
          noRowsMessage="No service purchases yet"
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
                // Filter out services that already have an active plan
                const selectableRows = rows.filter((r: any) => !r.active_plan_name);
                
                // Check service limit
                if (selectedPlan?.max_services && selectedPlan.max_services > 0) {
                  const agg = selectedPlan ? planAggregates[selectedPlan.plan_name] : null;
                  const remainingSlots = agg && agg.total > 0 ? Math.max(0, agg.total - agg.used) : selectedPlan.max_services;
                  
                  // If exceeding limit
                  if (selectableRows.length > (remainingSlots || 0)) {
                    // Service plans currently don't have "extra" pricing implemented in UI the same way,
                    // so we enforce the hard limit.
                    const limitedRows = selectableRows.slice(0, remainingSlots);
                    const ids = limitedRows.map((r: any) => String(r._id || r.id)).filter((id: any) => !!id);
                    
                    // Sync with Redux
                    const updateMap: Record<string, boolean> = {};
                    filteredServices.forEach(s => {
                      updateMap[String(s._id || s.id)] = false;
                    });
                    ids.forEach(id => {
                      updateMap[String(id)] = true;
                    });
                    dispatch(setMultipleSelections(updateMap));
                    
                    if (!hasShownLimitToast) {
                      toast.warning(`Limit exceeded! This plan allows only ${remainingSlots} service(s).`);
                      setHasShownLimitToast(true);
                    }
                    return;
                  }
                }
                
                const ids = selectableRows.map((r: any) => String(r._id || r.id)).filter((id: any) => !!id);
                
                // Sync with Redux
                const updateMap: Record<string, boolean> = {};
                filteredServices.forEach(s => {
                  updateMap[String(s._id || s.id)] = false;
                });
                ids.forEach(id => {
                  updateMap[String(id)] = true;
                });
                dispatch(setMultipleSelections(updateMap));
                
                // Reset toast flag when valid selection is made
                setHasShownLimitToast(false);
              }}
              selectedIds={selectedIdsMap}
              getRowId={(params) => String(params.data._id || params.data.id)}
              showCheckboxes={true}
              height={500}
              isRowSelectable={(params) => {
                const isAlreadyActive = params.data.active_plan_name;
                const isMaxServicesReached = selectedPlan?.max_services !== 0 && selectedServiceIds.length >= (selectedPlan?.max_services || 0);
                // Disable if already active or if max services reached and this service is not already selected
                return !isAlreadyActive && !(isMaxServicesReached && !selectedServiceIds.includes(params.data._id || params.data.id));
              }}
              getRowStyle={(params) => {
                if (params.data.active_plan_name)
                  return {
                      opacity: 0.5,
                      pointerEvents: 'none',
                      background: 'rgba(0,0,0,0.03)',
                    };
                return undefined;
              }}
              noRowsMessage="No service purchases yet"
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="max-w-md w-full"
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center animate-bounce bg-blue-100 text-blue-600">
            <Briefcase size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Confirm Activation
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              {`You are activating the ${selectedPlan?.plan_name} for ${purchaseSummary?.count} service(s).`}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner dark:bg-gray-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-semibold">Plan Amount</span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{currency}{purchaseSummary?.amount}</span>
            </div>
            {purchaseSummary && purchaseSummary.amount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-semibold">GST (18%)</span>
                <span className="font-bold text-gray-900 dark:text-gray-200">+{currency}{purchaseSummary.gstAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-black border-t pt-3 border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white uppercase text-[10px] tracking-widest font-black">Total Payable</span>
              <span className="text-2xl text-blue-600 drop-shadow-sm">
                {currency}{purchaseSummary?.totalAmount}
              </span>
            </div>
            <p className="text-[10px] text-center text-gray-400 font-medium  mt-2">
              Amount will be deducted from your wallet balance
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              className="w-full !py-4 rounded-xl font-bold shadow-xl btn-primary transform active:scale-95 transition-all"
              onClick={handleConfirmPurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Confirm & Pay"}
            </Button>
            <Button
              variant="outline"
              className="w-full py-3.5 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowConfirmModal(false)}
              disabled={isPurchasing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicePlanView;
