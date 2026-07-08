"use client";
import React, { useEffect, useState, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { HiOutlineRefresh } from "react-icons/hi";
import Loader from "@/components/common/Loader";
import PlanSelectionDialog from "@/components/common/PlanSelectionDialog";
import ServicePlanDialog from "@/components/common/ServicePlanDialog";
import FreeActivationDialog from "@/components/common/FreeActivationDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { Package, Briefcase, RotateCcw } from "lucide-react";

const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f0f0f0'/%3E%3Ctext x='24' y='24' font-family='Arial' font-size='10' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

type Scope = 'product' | 'service';
type ProductTab = 'rent' | 'sell';

export default function DraftPage() {
  const [productRows, setProductRows] = useState<any[]>([]);
  const [serviceRows, setServiceRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showServicePlanDialog, setShowServicePlanDialog] = useState(false);
  const [showFreeDialog, setShowFreeDialog] = useState(false);
  const [freeActivateLoading, setFreeActivateLoading] = useState(false);
  const [activeScope, setActiveScope] = useState<Scope>('product');
  const [productTab, setProductTab] = useState<ProductTab>('rent');

  const filteredRows = useMemo(() => {
    if (activeScope !== 'product') return serviceRows;
    return productRows.filter((item) => item.product_type_name?.toLowerCase() === productTab);
  }, [productRows, serviceRows, activeScope, productTab]);

  const rentCount = useMemo(() => productRows.filter((d) => d.product_type_name?.toLowerCase() === 'rent').length, [productRows]);
  const sellCount = useMemo(() => productRows.filter((d) => d.product_type_name?.toLowerCase() === 'sell').length, [productRows]);

  const productColumns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      width: 280,
      cellRenderer: (params: any) => {
        const p = params.data;
        const imageUrl = p?.product_main_image || p?.image || DEFAULT_PLACEHOLDER;
        const name = p?.product_name || "N/A";
        const cat = p?.category_name || "";
        return (
          <div className="flex items-center gap-3 h-full">
            <img src={imageUrl} alt={name} className="w-9 h-9 object-cover rounded border" onError={(e: any) => { if (e.target.src !== DEFAULT_PLACEHOLDER) e.target.src = DEFAULT_PLACEHOLDER; }} loading="lazy" />
            <div className="flex flex-col justify-center h-full leading-tight py-0.5">
              <span className="font-medium text-gray-800 dark:text-white">{name}</span>
              {cat && <span className="text-xs text-gray-500 dark:text-gray-400">{cat}</span>}
            </div>
          </div>
        );
      }
    },
    { field: "category_name", headerName: "Category", width: 200 },
    { field: "product_type_name", headerName: "Type", width: 100, cellStyle: { textAlign: "center" } },
    { field: "price", headerName: "Price", width: 120, valueFormatter: p => p.value ? `₹${Number(p.value).toFixed(2)}` : "₹0.00", cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Listing Type", width: 130, cellStyle: { textAlign: "center" } },
    {
      field: "status", headerName: "Status", width: 100,
      cellRenderer: () => <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Draft</span>,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "pricing_type", headerName: "Pricing", width: 100,
      cellRenderer: (params: any) => <StatusBadge status={params.value || 'free'} />,
      cellStyle: { textAlign: "center" }
    },
  ];

  const serviceColumns: ColDef[] = [
    {
      headerName: "Service",
      field: "service_name",
      flex: 1,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const s = params.data;
        const imageUrl = s?.image || s?.service_main_image || DEFAULT_PLACEHOLDER;
        const name = s?.service_name || "N/A";
        const cat = s?.category_name || "";
        return (
          <div className="flex items-center gap-3 h-full">
            <img src={imageUrl} alt={name} className="w-9 h-9 object-cover rounded border" onError={(e: any) => { if (e.target.src !== DEFAULT_PLACEHOLDER) e.target.src = DEFAULT_PLACEHOLDER; }} loading="lazy" />
            <div className="flex flex-col justify-center h-full leading-tight py-0.5">
              <span className="font-medium text-gray-800 dark:text-white">{name}</span>
              {cat && <span className="text-xs text-gray-500 dark:text-gray-400">{cat}</span>}
            </div>
          </div>
        );
      }
    },
    { headerName: "Category", field: "category_name", width: 150 },
    { field: "price", headerName: "Price", width: 120, valueFormatter: (p: any) => p.value ? `₹${Number(p.value).toFixed(2)}` : "₹0.00", cellStyle: { textAlign: "center" } },
    {
      field: "status", headerName: "Status", width: 100,
      cellRenderer: () => <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Draft</span>,
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 120,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex gap-2 items-center h-full">
          <button
            onClick={() => openServicePlanModal(params.data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <RotateCcw size={12} />
            Activate
          </button>
        </div>
      ),
    },
  ];

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      
      const productRes = await api.get(`${endPointApi.postAllVendorProductList}?status=draft&limit=100000`);
      setProductRows(productRes?.data?.data || []);
      
      const serviceRes = await api.get(endPointApi.postAllVendorServiceList);
      const allServices = serviceRes?.data?.data || [];
      setServiceRows(allServices.filter((item: any) => item.status === 'draft'));
      
      setSelected([]);
    } catch (error) {
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const freeSelected = selected.filter((p) => p.pricing_type === 'free');
  const paidSelected = selected.filter((p) => p.pricing_type !== 'free');
  const hasOnlyFree = selected.length > 0 && paidSelected.length === 0;
  const hasMixed = freeSelected.length > 0 && paidSelected.length > 0;

  const handleFreeActivation = async () => {
    try {
      const ids = freeSelected.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("Select free draft products to activate");
        return;
      }
      setFreeActivateLoading(true);
      const body: any = { plan_type: 'custom', product_ids: ids, months: 1, max_products: ids.length, amount: 0 };
      await api.post(endPointApi.postCreateListingPlan, body);
      toast.success(`🎉 ${ids.length} free product${ids.length > 1 ? 's' : ''} activated for 1 month!`, { autoClose: 5000 });
      await fetchDrafts();
      setSelected([]);
      setShowFreeDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to activate free products");
    } finally {
      setFreeActivateLoading(false);
    }
  };

  const applyPlan = async (plan_type: "basic" | "standard" | "premium" | "custom", months?: number, max_products?: number, plan_id?: string) => {
    try {
      const ids = selected.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("Select draft products to activate");
        return;
      }
      if (plan_type !== 'custom' && max_products && ids.length > max_products) {
        toast.error(`Selected plan can only accommodate ${max_products} product${max_products > 1 ? 's' : ''}, but you have selected ${ids.length} products.`);
        return;
      }
      setLoading(true);
      const body: any = { plan_type: String(plan_type).toLowerCase(), product_ids: ids };
      if (plan_id) body.plan_id = plan_id;
      if (plan_type === "custom") { body.months = months; body.max_products = max_products; }
      await api.post(endPointApi.postCreateListingPlan, body);
      toast.success(`🎉 ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} plan applied! ${ids.length} product${ids.length > 1 ? 's' : ''} activated.`, { autoClose: 5000 });
      await fetchDrafts();
      setSelected([]);
      setShowPlanDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to apply plan");
    } finally {
      setLoading(false);
    }
  };

  const applyServicePlan = async (plan_type: string, months?: number, max_services?: number, plan_id?: string) => {
    try {
      const ids = selected.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("Select draft services to activate");
        return;
      }
      setLoading(true);
      const body: any = { plan_type: String(plan_type).toLowerCase(), service_ids: ids };
      if (plan_id) body.plan_id = plan_id;
      await api.post(endPointApi.postCreateServiceListingPlan, body);
      toast.success(`🎉 ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} plan applied! ${ids.length} service${ids.length > 1 ? 's' : ''} activated.`, { autoClose: 5000 });
      await fetchDrafts();
      setSelected([]);
      setShowServicePlanDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to apply service plan");
    } finally {
      setLoading(false);
    }
  };

  const openServicePlanModal = (item: any) => {
    setSelected([item]);
    setShowServicePlanDialog(true);
  };

  const currentColumns = activeScope === 'product' ? productColumns : serviceColumns;

  return (
    <>
      {/* Tabs Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Product/Service Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setActiveScope('product'); setSelected([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeScope === 'product' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Package size={14} />
              Products
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{productRows.length}</span>
            </button>
            <button
              onClick={() => { setActiveScope('service'); setSelected([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeScope === 'service' ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={14} />
              Services
              <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">{serviceRows.length}</span>
            </button>
          </div>

          {/* Rent/Sell Tabs */}
          {activeScope === 'product' && (
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setProductTab('rent'); setSelected([]); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${productTab === 'rent' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Rent ({rentCount})
              </button>
              <button
                onClick={() => { setProductTab('sell'); setSelected([]); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${productTab === 'sell' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sell ({sellCount})
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchDrafts} disabled={loading} className="px-4 py-2 text-sm font-medium flex items-center gap-2">
            {loading ? <Loader type="button" text="Refreshing..." iconClassName="text-white h-4 w-4" /> : <><HiOutlineRefresh className="text-lg" />Refresh</>}
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selected.length > 0 && activeScope === 'product' && (
        <div className="flex items-center justify-between p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <RotateCcw size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{selected.length} product{selected.length > 1 ? 's' : ''} selected for activation</span>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                {hasOnlyFree ? 'Free listings — activate at no cost' : hasMixed ? 'Free listings activate free; paid require plan' : 'Choose a plan to activate'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMixed && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Mixed: {freeSelected.length} free, {paidSelected.length} paid</p>}
            {freeSelected.length > 0 && (
              <Button onClick={() => setShowFreeDialog(true)} disabled={freeActivateLoading} className="text-sm font-medium px-4 py-2">
                {freeActivateLoading ? <Loader type="button" iconClassName="text-white h-4 w-4" /> : `Activate Free (${freeSelected.length})`}
              </Button>
            )}
            {paidSelected.length > 0 && (
              <Button onClick={() => setShowPlanDialog(true)} disabled={loading} className="text-sm font-medium px-4 py-2">
                {loading ? <Loader type="button" iconClassName="text-white h-4 w-4" /> : `Activate Paid (${paidSelected.length})`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Service Selection Info */}
      {selected.length > 0 && activeScope === 'service' && (
        <div className="flex items-center justify-between p-4 mb-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <RotateCcw size={18} className="text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">{selected.length} service{selected.length > 1 ? 's' : ''} selected</span>
          </div>
          <Button onClick={() => setShowServicePlanDialog(true)} className="text-sm font-medium px-4 py-2 bg-teal-600 hover:bg-teal-700">
            Activate ({selected.length})
          </Button>
        </div>
      )}

      <AgGridTable
        columns={currentColumns}
        rowData={activeScope === 'product' ? filteredRows : serviceRows}
        tableName={activeScope === 'product' ? `${productTab === 'rent' ? 'Rent' : 'Sell'} Product Drafts` : 'Service Drafts'}
        onSelectionChange={setSelected}
        loading={loading}
        rowHeight={50}
        height="650px"
        noRowsMessage={`No ${activeScope} drafts found`}
      />

      <PlanSelectionDialog
        isOpen={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        selectedCount={paidSelected.length || selected.length}
        onApplyPlan={applyPlan}
        selectedProducts={paidSelected.length > 0 ? paidSelected : selected}
      />

      <ServicePlanDialog
        isOpen={showServicePlanDialog}
        onClose={() => setShowServicePlanDialog(false)}
        selectedCount={selected.length}
        onApplyPlan={applyServicePlan}
        selectedServices={selected}
      />

      <FreeActivationDialog
        isOpen={showFreeDialog}
        onClose={() => setShowFreeDialog(false)}
        products={freeSelected}
        loading={freeActivateLoading}
        onConfirm={handleFreeActivation}
      />
    </>
  );
}
