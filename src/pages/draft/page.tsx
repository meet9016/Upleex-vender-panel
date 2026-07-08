"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { MdClose } from 'react-icons/md';
import ActionButtons from '@/components/common/ActionButtons';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { useSearchParams } from 'next/navigation';
import { Package, Briefcase, ShoppingCart, RotateCcw } from 'lucide-react';

type Scope = 'product' | 'service';
type ProductTab = 'rent' | 'sell';

const DraftsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftData, setDraftData] = useState<any[]>([]);
  const [activeScope, setActiveScope] = useState<Scope>(
    searchParams?.get('tab') === 'service' ? 'service' : 'product'
  );
  const [productTab, setProductTab] = useState<ProductTab>('rent');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState('');
  const [customMonths, setCustomMonths] = useState(1);
  const [customMaxProducts, setCustomMaxProducts] = useState(1);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // ── Filtered product drafts by Rent/Sell tab ──────────────────────────
  const filteredDraftData = useMemo(() => {
    if (activeScope !== 'product') return draftData;
    return draftData.filter(
      (item) => item.product_type_name?.toLowerCase() === productTab
    );
  }, [draftData, activeScope, productTab]);

  const rentCount = useMemo(
    () => draftData.filter((d) => d.product_type_name?.toLowerCase() === 'rent').length,
    [draftData]
  );
  const sellCount = useMemo(
    () => draftData.filter((d) => d.product_type_name?.toLowerCase() === 'sell').length,
    [draftData]
  );

  // ── Column definitions ─────────────────────────────────────────────────
  const productColumns: ColDef[] = [
    { headerName: 'Product Name', field: 'product_name', flex: 1, minWidth: 200 },
    { headerName: 'Category', field: 'category_name', flex: 1, minWidth: 150 },
    { headerName: 'Type', field: 'product_type_name', flex: 1, minWidth: 100 },
    {
      headerName: 'Price',
      field: 'price',
      flex: 1,
      minWidth: 100,
      valueFormatter: (params: any) => `₹${params.value ?? '-'}`,
    },
    {
      headerName: 'Draft Since',
      field: 'updatedAt',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params: any) =>
        params.value
          ? new Date(params.value).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      minWidth: 200,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex gap-2 items-center h-full">
          <button
            onClick={() => openPlanModal(params.data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <RotateCcw size={12} />
            Activate
          </button>
          <ActionButtons
            onEdit={() => router.push(`/product/addProduct?id=${params.data._id || params.data.id}`)}
            onDelete={() => openDeletePopup(params.data._id || params.data.id)}
          />
        </div>
      ),
    },
  ];

  const serviceColumns: ColDef[] = [
    { headerName: 'Service Name', field: 'service_name', flex: 1, minWidth: 200 },
    { headerName: 'Category', field: 'category_name', flex: 1, minWidth: 150 },
    {
      headerName: 'Price',
      field: 'price',
      flex: 1,
      minWidth: 100,
      valueFormatter: (params: any) => `₹${params.value ?? '-'}`,
    },
    {
      headerName: 'Draft Since',
      field: 'updatedAt',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params: any) =>
        params.value
          ? new Date(params.value).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      minWidth: 200,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex gap-2 items-center h-full">
          <button
            onClick={() => openPlanModal(params.data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <RotateCcw size={12} />
            Activate
          </button>
          <ActionButtons
            onEdit={() => router.push(`/service/edit/${params.data._id || params.data.id}`)}
            onDelete={() => openDeletePopup(params.data._id || params.data.id)}
          />
        </div>
      ),
    },
  ];

  // ── Data fetching ───────────────────────────────────────────────────────
  const getDraftData = async () => {
    try {
      setLoading(true);
      setSelectedRows([]);
      if (activeScope === 'product') {
        const res = await api.get(`${endPointApi.postAllVendorProductList}?status=draft&limit=100000`);
        setDraftData(res.data?.data || []);
      } else {
        const res = await api.get(endPointApi.postAllVendorServiceList);
        const all = res.data?.data || [];
        setDraftData(all.filter((item: any) => item.status === 'draft'));
      }
    } catch {
      toast.error(`Failed to fetch ${activeScope} drafts`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      if (activeScope === 'product') {
        const res = await api.get(endPointApi.getPlanOptions);
        const list = res?.data?.data || [];
        const normalized = list.map((p: any) => ({
          key: p.plan_type,
          name: p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1),
          description: `${p.months} months, up to ${p.max_products} products`,
          price: p.amount,
          duration_months: p.months,
          product_limit: p.max_products,
        }));
        setPlans(normalized);
      } else {
        const res = await api.get(endPointApi.getServicePlanOptions);
        const list = res?.data?.data || [];
        const normalized = list
          .filter((p: any) => p.status === 'active')
          .map((p: any) => ({
            _id: p._id || p.id,
            key: p._id || p.id,
            name: p.plan_name,
            description: `${p.months} month${p.months > 1 ? 's' : ''} visibility${p.max_services ? `, up to ${p.max_services} services` : ''}`,
            price: p.amount,
            duration_months: p.months,
            service_limit: p.max_services || 0,
            is_popular: p.is_popular,
          }));
        setPlans(normalized);
      }
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const openPlanModal = (item: any) => {
    setSelectedItem(item);
    setSelectedPlanKey('');
    setShowPlanModal(true);
    fetchPlans();
  };

  const openBulkActivateModal = () => {
    if (!selectedRows.length) {
      toast.info(`Select ${activeScope} drafts to activate`);
      return;
    }
    setSelectedItem(null);
    setSelectedPlanKey('');
    setShowPlanModal(true);
    fetchPlans();
  };

  // ── Assign / Activate plan ─────────────────────────────────────────────
  const assignPlan = async () => {
    if (!selectedPlanKey) {
      toast.error('Please select a plan');
      return;
    }
    try {
      setAssigning(true);
      const ids = selectedItem
        ? [selectedItem._id || selectedItem.id]
        : selectedRows.map((r: any) => r._id || r.id);

      if (activeScope === 'product') {
        const body: any = { plan_type: selectedPlanKey, product_ids: ids };
        if (selectedPlanKey === 'custom') {
          body.months = customMonths;
          body.max_products = customMaxProducts;
        }
        await api.post(endPointApi.postCreateListingPlan, body);
      } else {
        await api.post(endPointApi.postCreateServiceListingPlan, {
          plan_id: selectedPlanKey,
          service_ids: ids,
        });
      }

      toast.success('Activated successfully! Items moved out of draft.');
      setShowPlanModal(false);
      setSelectedPlanKey('');
      getDraftData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to activate. Check wallet balance.';
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const ids = selectedRows.map((r: any) => r._id || r.id);
      if (activeScope === 'product') {
        await api.post(endPointApi.postBulkDeleteProducts, { product_ids: ids });
      } else {
        for (const id of ids) {
          await api.delete(`${endPointApi.postDeleteVendorServiceList}/${id}`);
        }
      }
      toast.success(`${ids.length} draft ${activeScope}(s) deleted`);
      setBulkDeleteConfirm(false);
      getDraftData();
    } catch {
      toast.error(`Failed to delete selected drafts`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const endpoint =
        activeScope === 'product'
          ? endPointApi.postDeleteVendorProductList
          : endPointApi.postDeleteVendorServiceList;
      await api.delete(`${endpoint}/${deleteId}`);
      toast.success('Deleted successfully');
      getDraftData();
    } catch {
      toast.error('Delete failed');
    }
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  const openDeletePopup = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  useEffect(() => {
    getDraftData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const currentColumns = activeScope === 'product' ? productColumns : serviceColumns;
  const activateBtnLabel = selectedItem
    ? activeScope === 'product'
      ? `Activate Product`
      : `Activate Service`
    : `Activate ${selectedRows.length} ${activeScope === 'product' ? 'Product' : 'Service'}(s)`;

  return (
    <div>
      {/* ── Header card ── */}
      <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Draft Management</h2>
          <button
            onClick={() => router.push(activeScope === 'product' ? '/product' : '/service')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to {activeScope === 'product' ? 'Products' : 'Services'}
          </button>
        </div>

        {/* ── Scope + Rent/Sell tabs row ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          {/* Left: Product/Service scope toggle (ProductTable style) */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => { setActiveScope('product'); setSelectedRows([]); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  activeScope === 'product'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/[0.04]'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Package size={14} />
                Products
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeScope === 'product' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {activeScope === 'product' ? draftData.length : ''}
                </span>
              </button>
              <button
                onClick={() => { setActiveScope('service'); setSelectedRows([]); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  activeScope === 'service'
                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-md ring-1 ring-black/[0.04]'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Briefcase size={14} />
                Services
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeScope === 'service' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {activeScope === 'service' ? draftData.length : ''}
                </span>
              </button>
            </div>

            {/* Rent / Sell sub-tabs — only for product scope */}
            {activeScope === 'product' && (
              <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                <button
                  onClick={() => { setProductTab('rent'); setSelectedRows([]); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    productTab === 'rent'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/[0.04]'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Rent ({rentCount})
                </button>
                <button
                  onClick={() => { setProductTab('sell'); setSelectedRows([]); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    productTab === 'sell'
                      ? 'bg-white dark:bg-orange-700 text-orange-600 dark:text-orange-400 shadow-md ring-1 ring-black/[0.04]'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Sell ({sellCount})
                </button>
              </div>
            )}
          </div>

          {/* Right: Bulk actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={openBulkActivateModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-xs font-bold shadow-sm"
            >
              <RotateCcw size={13} />
              Activate ({selectedRows.length})
            </button>
            <button
              onClick={() => {
                if (!selectedRows.length) { toast.info('Select drafts to delete'); return; }
                setBulkDeleteConfirm(true);
              }}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl transition-colors text-xs font-bold dark:bg-red-900/20 dark:border-red-900/30"
            >
              Delete ({selectedRows.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AgGridTable
            columns={currentColumns}
            rowData={filteredDraftData}
            filter={false}
            tableName={
              activeScope === 'product'
                ? `${productTab === 'rent' ? 'Rent' : 'Sell'} Product Drafts`
                : 'Service Drafts'
            }
            onSelectionChange={setSelectedRows}
          />
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="sm:hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDraftData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No {activeScope} drafts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredDraftData.map((item: any) => {
              const id = item._id || item.id;
              const name = item.product_name || item.service_name || '-';
              const image = item.product_main_image || item.image || '';
              return (
                <div key={id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    {image ? (
                      <img src={image} alt={name} className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">
                        No Img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.category_name || '-'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Draft</span>
                        {item.product_type_name && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full capitalize">
                            {item.product_type_name}
                          </span>
                        )}
                        {item.price && <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">₹{item.price}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[11px] text-gray-400">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB') : '-'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPlanModal(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <RotateCcw size={11} />
                        Activate
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            activeScope === 'product'
                              ? `/product/addProduct?id=${id}`
                              : `/service/edit/${id}`
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeletePopup(id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border border-red-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Plan Selection Modal ── */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className={`px-6 py-4 ${activeScope === 'product' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-teal-500 to-emerald-600'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {activeScope === 'product' ? 'Choose Listing Plan' : 'Choose Service Plan'}
                  </h3>
                  {selectedItem ? (
                    <p className="text-white/80 text-sm mt-0.5">
                      {activeScope === 'product' ? '📦' : '🛠️'}{' '}
                      {selectedItem.product_name || selectedItem.service_name}
                    </p>
                  ) : (
                    <p className="text-white/80 text-sm mt-0.5">
                      {selectedRows.length} {activeScope}(s) selected for activation
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors mt-0.5"
                >
                  <MdClose size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {plansLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm">Loading plans...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No plans available</p>
                </div>
              ) : (
                <div className="grid gap-3 mb-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.key}
                      onClick={() => setSelectedPlanKey(plan.key)}
                      className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedPlanKey === plan.key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Selected checkmark */}
                      {selectedPlanKey === plan.key && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {plan.is_popular && (
                        <span className="absolute top-4 right-4 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                          POPULAR
                        </span>
                      )}
                      <div className="flex justify-between items-start pr-10">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white capitalize">{plan.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{plan.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {plan.duration_months} month{plan.duration_months !== 1 ? 's' : ''}
                            </span>
                            {plan.product_limit > 0 && (
                              <span className="flex items-center gap-1">
                                <Package size={12} />
                                Up to {plan.product_limit} products
                              </span>
                            )}
                            {plan.service_limit > 0 && (
                              <span className="flex items-center gap-1">
                                <Briefcase size={12} />
                                Up to {plan.service_limit} services
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-2xl font-bold text-blue-600">₹{plan.price}</div>
                          <div className="text-xs text-gray-400">+ 18% GST</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Custom plan — products only */}
                  {activeScope === 'product' && (
                    <div
                      className={`p-5 border-2 rounded-xl transition-all duration-200 ${
                        selectedPlanKey === 'custom'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">Custom Plan</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Set your own duration & product limit</p>
                        </div>
                        {selectedPlanKey === 'custom' && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Months</label>
                          <input
                            type="number"
                            min={1}
                            value={customMonths}
                            onChange={(e) => setCustomMonths(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Products</label>
                          <input
                            type="number"
                            min={1}
                            value={customMaxProducts}
                            onChange={(e) => setCustomMaxProducts(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => setSelectedPlanKey('custom')}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            selectedPlanKey === 'custom'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/40 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={assignPlan}
                disabled={!selectedPlanKey || assigning}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedPlanKey && !assigning
                    ? activeScope === 'product'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md shadow-blue-200'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {assigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    {activateBtnLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <ConfirmationDialog
        open={bulkDeleteConfirm}
        actionType="delete"
        title="Confirm Bulk Delete"
        message={`Are you sure you want to delete ${selectedRows.length} selected draft ${activeScope}(s)? This cannot be undone.`}
        confirmText={`Delete ${selectedRows.length}`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={loading}
      />
    </div>
  );
};

export default DraftsPage;
