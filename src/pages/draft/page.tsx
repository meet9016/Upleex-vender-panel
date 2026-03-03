"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { MdClose } from 'react-icons/md';
import AgGridTable from '@/components/tables/AgGridTable';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';

const DraftsPage = () => {
  const router = useRouter();
  const [draftData, setDraftData] = useState([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPlanType, setSelectedPlanType] = useState('');
  const [customMonths, setCustomMonths] = useState(1);
  const [customMaxProducts, setCustomMaxProducts] = useState(1);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      headerName: "Product Name",
      field: "product_name",
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: "Category",
      field: "category_name",
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: "Price",
      field: "price",
      flex: 1,
      minWidth: 100,
      valueFormatter: (params: any) => `₹${params.value}`,
    },
    {
      headerName: "Created Date",
      field: "created_at",
      flex: 1,
      minWidth: 150,
      valueFormatter: (params: any) => {
        return params.value ? new Date(params.value).toLocaleDateString() : "";
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      flex: 1,
      minWidth: 250,
      cellRenderer: (params: any) => {
        return (
          <div className="flex gap-2 items-center h-full">
            <button
              onClick={() => openPlanModal(params.data)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              Dedraft
            </button>
            <button
              onClick={() => router.push(`/product/edit/${params.data._id || params.data.id}`)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => openDeletePopup(params.data._id || params.data.id)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const getDraftData = async () => {
    try {
      const response = await api.get(endPointApi.postAllVendorProductList);
      const drafts = response.data?.data?.filter((item: any) => item.status === 'draft') || [];
      setDraftData(drafts);
      setSelectedRows([]);
    } catch (error) {
      console.log("Get draft data error:", error);
      toast.error("Failed to fetch drafts");
    }
  };

  // Static plans shown in modal (no payment flow)
  const modalPlans = [
    { key: 'basic', name: 'Basic', description: '2 months, 1 product', price: 39, duration_months: 2, product_limit: 1 },
    { key: 'standard', name: 'Standard', description: '5 months, up to 3 products', price: 59, duration_months: 5, product_limit: 3 },
    { key: 'premium', name: 'Premium', description: '12 months, up to 7 products', price: 109, duration_months: 12, product_limit: 7 },
  ];

  const openPlanModal = (product: any) => {
    setSelectedProduct(product);
    setSelectedPlanType(product.plan_id || '');
    setShowPlanModal(true);
  };

  // Handle bulk delete with confirmation
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const ids = selectedRows.map((r: any) => r._id || r.id);
      await api.post(endPointApi.postBulkDeleteProducts, { product_ids: ids });
      toast.success(`${ids.length} draft products deleted successfully`);
      setBulkDeleteConfirm(false);
      getDraftData();
    } catch (error) {
      console.log("Bulk delete error:", error);
      toast.error("Failed to delete selected drafts");
    } finally {
      setLoading(false);
    }
  };

  // Open bulk delete confirmation
  const openBulkDeleteConfirm = () => {
    if (!selectedRows.length) {
      toast.info("Select drafts to delete");
      return;
    }
    setBulkDeleteConfirm(true);
  };

  const assignPlan = async () => {
    if (!selectedPlanType) {
      toast.error("Please select a plan");
      return;
    }
    try {
      const ids = selectedRows.length ? selectedRows.map((r: any) => r._id || r.id) : [(selectedProduct?._id || selectedProduct?.id)];
      const body: any = { plan_type: selectedPlanType, product_ids: ids };
      if (selectedPlanType === 'custom') {
        body.months = customMonths;
        body.max_products = customMaxProducts;
      }
      await api.post(endPointApi.postPurchasePlan, body);
      toast.success("Plan applied successfully! Selected products activated.");
      setShowPlanModal(false);
      setSelectedPlanType('');
      getDraftData();
    } catch (error) {
      console.log("assign plan error", error);
      toast.error("Failed to assign plan");
    }
  };

  useEffect(() => {
    getDraftData();
  }, []);

  const openDeletePopup = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const deleteById = async (id: string | number) => {
    try {
      await api.delete(`${endPointApi.postDeleteVendorProductList}/${id}`);
      toast.success("Deleted successfully");
      getDraftData();
    } catch (error) {
      console.log("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteById(deleteId);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Draft Products</h2>
        <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!selectedRows.length) {
                  toast.info("Select draft products to activate");
                  return;
                }
                setSelectedProduct(null);
                setSelectedPlanType('');
                setShowPlanModal(true);
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              Dedraft Selected (Select Plan)
            </button>
          <button
            onClick={openBulkDeleteConfirm}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Delete Selected ({selectedRows.length})
          </button>
          <button
            onClick={() => router.push('/product')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Products
          </button>
        </div>
      </div>

      <AgGridTable
        columns={columns}
        rowData={draftData}
        filter={false}
        tableName="Drafts"
        onSelectionChange={setSelectedRows}
      />

      {/* Enhanced Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Choose Your Plan</h3>
                  {selectedProduct ? (
                    <p className="text-blue-100 text-sm mt-1">Product: {selectedProduct?.product_name}</p>
                  ) : (
                    <p className="text-blue-100 text-sm mt-1">{selectedRows.length} products selected</p>
                  )}
                </div>
                <button 
                  onClick={() => setShowPlanModal(false)} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <MdClose size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid gap-4 mb-6">
                {modalPlans.map((plan) => (
                  <div
                    key={plan.key}
                    onClick={() => setSelectedPlanType(plan.key as any)}
                    className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedPlanType === plan.key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                    }`}
                  >
                    {selectedPlanType === plan.key && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                          {plan.key === 'premium' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">POPULAR</span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>{plan.duration_months} months</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Up to {plan.product_limit} products</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600">₹{plan.price}</div>
                        <div className="text-sm text-gray-500">one-time</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Custom Plan */}
                <div className={`p-5 border-2 rounded-xl transition-all duration-200 ${
                  selectedPlanType === 'custom'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Custom Plan</h4>
                      <p className="text-gray-600 dark:text-gray-400">Create your own plan</p>
                    </div>
                    {selectedPlanType === 'custom' && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Months</label>
                      <input
                        type="number"
                        min={1}
                        value={customMonths}
                        onChange={(e) => setCustomMonths(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter months"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Products</label>
                      <input
                        type="number"
                        min={1}
                        value={customMaxProducts}
                        onChange={(e) => setCustomMaxProducts(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter limit"
                      />
                    </div>
                    <div className="flex-shrink-0 pt-6">
                      <button
                        onClick={() => setSelectedPlanType('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPlanType === 'custom' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-600 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={assignPlan}
                  disabled={!selectedPlanType}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all font-medium disabled:cursor-not-allowed"
                >
                  {selectedProduct ? 'Activate Product' : `Activate ${selectedRows.length} Products`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteConfirm}
        actionType="delete"
        title="Confirm Bulk Delete"
        message={`Are you sure you want to delete ${selectedRows.length} selected draft product${selectedRows.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedRows.length}`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={loading}
      />
    </div>
  )
}

export default DraftsPage