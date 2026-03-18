"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit, MdClose, MdSearch, MdMoreVert, MdBlock } from "react-icons/md";
import ActionButtons from "@/components/common/ActionButtons";
import StatusBadge from "@/components/common/StatusBadge";
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { CiFilter, CiWarning } from "react-icons/ci";
import { toast } from 'react-toastify';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import Label from '@/components/form/Label';
import { HiOutlineDocumentText } from "react-icons/hi";
import { Modal } from '@/components/ui/modal';
import Loader from '@/components/common/Loader';
import { exportProductsToExcel, exportProductsToPDF } from '@/utils/exportUtils';
import { FaFileExcel, FaFilePdf, FaDownload } from 'react-icons/fa';
import PlanSelectionDialog from '@/components/common/PlanSelectionDialog';
import Button from '@/components/ui/button/Button';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ADD THIS at the top of your file (after imports)
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

type Product = {
  id: string;
  product_name: string;
  category_name: string;
  sub_category_name: string;
  product_type_name: string;
  cancel_price: string;
  product_listing_type_name: string;
  price: number;
  product_main_image?: string;
  image?: string;
  _id?: string;
  status?: string;
  expires_at?: string;
};

type Category = {
  _id?: string;
  id?: string;
  categories_id?: string;
  categories_name?: string;
  name?: string;
  subcategories?: Array<{
    subcategory_id: string;
    subcategory_name: string;
  }>;
};

type Option = {
  label: string;
  value: string;
};

const ProductTable = () => {
  const router = useRouter();
  const [productData, setProductData] = useState<Product[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ type: 'deactivate' | 'delete' | null; open: boolean }>({ type: null, open: false });
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [snoozeToday, setSnoozeToday] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [productsToActivate, setProductsToActivate] = useState<any[]>([]);
  const [selectedExpiringProducts, setSelectedExpiringProducts] = useState<string[]>([]);
const [singleProductActivate, setSingleProductActivate] = useState<any>(null);
  // Filter dropdown data
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<Option[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [listingTypes, setListingTypes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ADD THESE helper functions inside your component, before the columns definition
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:image') ||
      url.startsWith('/');
  };

  const getImageUrl = (product: any): string => {
    const imageUrl = product?.product_main_image || product?.image || '';
    return isValidImageUrl(imageUrl) ? imageUrl : DEFAULT_PLACEHOLDER;
  };
  
  // Applied filters (used for actual API calls)
  const [filters, setFilters] = useState({
    category_id: '',
    sub_category_id: '',
    filter_rent_sell: '',
    filter_tenure: '',
    status: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Pending filters (shown in modal, applied only on Apply click)
  const [pendingFilters, setPendingFilters] = useState({
    category_id: '',
    sub_category_id: '',
    filter_rent_sell: '',
    filter_tenure: '',
    status: '',
  });
  const [pendingCategory, setPendingCategory] = useState<string>('');
  const [pendingSubCategory, setPendingSubCategory] = useState<string>('');
  const [pendingSubCategoryOptions, setPendingSubCategoryOptions] = useState<Option[]>([]);

  const debouncedSearch = useDebounce(searchText, 600);

  // Count active filters (excluding empty strings)
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const columns: ColDef[] = [
    {
      headerName: "Product Name",
      field: "product_name",
      width: 240,
      sortable: true,
      cellRenderer: (params: any) => {
        const product = params.data;
        const imageUrl = getImageUrl(product);
        const productName = product?.product_name || "N/A";

        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={productName}
                className="w-14 h-14 object-cover rounded-lg border"
                onError={(e: any) => {
                  if (e.target.src !== DEFAULT_PLACEHOLDER) {
                    e.target.src = DEFAULT_PLACEHOLDER;
                  }
                }}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 dark:text-white">
                {productName}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      field: "category_name",
      headerName: "Category",
      minWidth: 180,
      cellStyle: { textAlign: "left" }
    },
    {
      field: "sub_category_name",
      headerName: "Sub Category",
      minWidth: 180,
      cellStyle: { textAlign: "left" }
    },
    {
      field: "product_type_name",
      headerName: "Type",
      minWidth: 120,
      cellStyle: { textAlign: "left" }
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 120,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toFixed(2)}` : '₹0.00';
      },
      cellStyle: { textAlign: "left" }
    },
    {
      field: "cancel_price",
      headerName: "Cancel Price",
      minWidth: 120,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toFixed(2)}` : '₹0.00';
      },
      cellStyle: { textAlign: "left" }
    },
    {
      field: "product_listing_type_name",
      headerName: "Listing Type",
      minWidth: 150,
      cellStyle: { textAlign: "left" }
    },
    {
      headerName: "Approval Status by Admin",
      field: "approval_status",
      minWidth: 140,
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'active'} />
        </div>
      ),
      cellStyle: { justifyContent: "left" }
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'active'} />
        </div>
      ),
      cellStyle: { justifyContent: "left" }
    },
    {
      field: "expires_at",
      headerName: "Expires On",
      minWidth: 140,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
      cellStyle: { textAlign: "left" }
    },
    {
      headerName: "Action",
      minWidth: 120,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => (
        <ActionButtons
          onEdit={() => router.push(`/product/addProduct?id=${params.data._id || params.data.id}`)}
          onDelete={() => openDeletePopup(params.data._id || params.data.id)}
        />
      ),
    },
  ];

  // Fetch products with filters
  const getProductData = async (filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add all non-empty filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      params.append('page', String(page));
      params.append('limit', String(pageSize));

      const queryString = params.toString();
      const url = queryString
        ? `${endPointApi.postAllVendorProductList}?${queryString}`
        : endPointApi.postAllVendorProductList;

      const res = await api.get(url);
      const products = res?.data?.data || [];
      setTotal(res?.data?.total || 0);
      setTotalPages(res?.data?.totalPages || 1);
      setPage(res?.data?.page || page);

      // Normalize product data
      const normalized = products.map((p: any) => {
        let price = p.price;
        let cancel_price = p.cancel_price;

        // Handle rent products with monthly pricing
        if (
          p.product_type_name?.toLowerCase() === 'rent' &&
          p.product_listing_type_name?.toLowerCase() === 'monthly' &&
          Array.isArray(p.month_arr) &&
          p.month_arr.length
        ) {
          const first = p.month_arr[0];
          price = first?.price ?? price;
          cancel_price = first?.cancel_price ?? cancel_price;
        }

        return {
          ...p,
          price,
          cancel_price,
          id: p._id || p.id
        };
      });

      setProductData(normalized);
      
      // Compute expiring within 3 days (active only)
      try {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const nearExpiry = normalized.filter((p: any) => {
          if (p.status?.toLowerCase() !== 'active') return false;
          const exp = p.expires_at ? new Date(p.expires_at).getTime() : 0;
          if (!exp) return false;
          return exp > now && (exp - now) <= threeDaysMs;
        });
        const snoozeKey = localStorage.getItem('expiry_modal_snooze');
        const today = new Date().toISOString().slice(0, 10);
        const isSnoozed = snoozeKey === today;
        if (nearExpiry.length && !isSnoozed) {
          setExpiringProducts(nearExpiry);
          setExpiryModalOpen(true);
        }
      } catch { }
    } catch (error) {
      console.log("fetch error", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Re-check expiry periodically to show popup without refresh
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const nearExpiry = productData.filter((p: any) => {
          if (p.status?.toLowerCase() !== 'active') return false;
          const exp = p.expires_at ? new Date(p.expires_at).getTime() : 0;
          if (!exp) return false;
          return exp > now && (exp - now) <= threeDaysMs;
        });
        const snoozeKey = localStorage.getItem('expiry_modal_snooze');
        const today = new Date().toISOString().slice(0, 10);
        const isSnoozed = snoozeKey === today;
        if (nearExpiry.length && !isSnoozed) {
          setExpiringProducts(nearExpiry);
          setExpiryModalOpen(true);
        }
      } catch { }
    }, 60000);
    return () => clearInterval(interval);
  }, [productData]);

  // Toggle product selection in expiry modal
const toggleExpiringProduct = (productId: string) => {
  setSelectedExpiringProducts(prev => 
    prev.includes(productId) 
      ? prev.filter(id => id !== productId)
      : [...prev, productId]
  );
};

// Add useEffect to handle single product activation
useEffect(() => {
  if (singleProductActivate) {
    setProductsToActivate([singleProductActivate]);
    setSingleProductActivate(null);
  }
}, [singleProductActivate]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get(endPointApi.postCategoryList);
      if (res?.data?.data) {
        const list = res.data.data || [];
        setCategoriesData(list);

        // Create options for SearchableDropdown without images
        const options = list.map((item: any) => ({
          label: item.categories_name || item.name,
          value: String(item.categories_id || item.id || item._id),
        }));
        setCategoryOptions(options);
      }
    } catch (error) {
      console.log("Error fetching categories", error);
    }
  };

  // Fetch product dropdown data
  const fetchDropdownData = async () => {
    try {
      const productDropdownRes = await api.post(endPointApi.postProductDropDownList);
      const dropdownData = productDropdownRes?.data?.data || productDropdownRes?.data;

      // Set product types
      if (dropdownData?.products_type) {
        setProductTypes(dropdownData.products_type);
      } else if (dropdownData?.product_type) {
        setProductTypes(dropdownData.product_type);
      }

      // Set listing types
      if (dropdownData?.products_listing_type) {
        setListingTypes(dropdownData.products_listing_type);
      } else if (dropdownData?.listing_type) {
        setListingTypes(dropdownData.listing_type);
      }
    } catch (error) {
      console.log("fetch dropdown error", error);
      toast.error("Failed to load filter options");
    }
  };

  // Update pending subcategories when pending category changes
  useEffect(() => {
    if (!pendingCategory) {
      setPendingSubCategoryOptions([]);
      setPendingSubCategory('');
      setPendingFilters(prev => ({ ...prev, category_id: '', sub_category_id: '' }));
      return;
    }
    const cat = categoriesData.find((c: any) =>
      String(c.categories_id || c.id || c._id) === String(pendingCategory)
    );
    const subcats = (cat?.subcategories || []).map((item: any) => ({
      value: String(item.subcategory_id || item.id),
      label: item.subcategory_name || item.name,
    }));
    setPendingSubCategoryOptions(subcats);
    setPendingSubCategory('');
    setPendingFilters(prev => ({ ...prev, category_id: pendingCategory, sub_category_id: '' }));
  }, [pendingCategory, categoriesData]);

  // Handle product type change (Rent/Sell)
  const handleProductTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, filter_rent_sell: value }));
  };

  // Handle listing type change
  const handleListingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, filter_tenure: value }));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // Apply filters when search/filters/page/pageSize change
  useEffect(() => {
    const params: any = {};

    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.sub_category_id) params.sub_category_id = filters.sub_category_id;
    if (filters.filter_rent_sell) params.filter_rent_sell = filters.filter_rent_sell;
    if (filters.filter_tenure) params.filter_tenure = filters.filter_tenure;
    if (filters.status) params.status = filters.status;

    getProductData(params);
  }, [debouncedSearch, filters, page, pageSize]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node) &&
        filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial data fetch
  useEffect(() => {
    getProductData();
    fetchCategories();
    fetchDropdownData();
  }, []);

  // Open delete confirmation modal
  const openDeletePopup = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  // Delete product by ID
  const deleteById = async (id: string | number) => {
    try {
      const res = await api.delete(`${endPointApi.postDeleteVendorProductList}/${id}`);
      toast.success("Deleted successfully");
      getProductData();
    } catch (error) {
      console.log("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteById(deleteId);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setFilters({
      category_id: '',
      sub_category_id: '',
      filter_rent_sell: '',
      filter_tenure: '',
      status: ''
    });
    setSubCategoryOptions([]);
    setSearchText('');
    setShowFilterModal(false);
  };

  // Handle bulk deactivate
  const handleBulkDeactivate = async () => {
    try {
      setLoading(true);
      const ids = selectedRows.map((r: any) => r._id || r.id);
      await api.post(endPointApi.postBulkDeactivateProducts, { product_ids: ids });
      toast.success(`${ids.length} products deactivated successfully`);
      setBulkAction({ type: null, open: false });
      getProductData();
    } catch (error) {
      toast.error("Failed to deactivate selected products");
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const ids = selectedRows.map((r: any) => r._id || r.id);
      await api.post(endPointApi.postBulkDeleteProducts, { product_ids: ids });
      toast.success(`${ids.length} products deleted successfully`);
      setBulkAction({ type: null, open: false });
      getProductData();
    } catch (error) {
      toast.error("Failed to delete selected products");
    } finally {
      setLoading(false);
    }
  };

  // Open bulk action confirmation
  const openBulkAction = (type: 'deactivate' | 'delete') => {
    if (!selectedRows.length) {
      toast.info(`Select products to ${type}`);
      return;
    }
    setBulkAction({ type, open: true });
    setShowActionsMenu(false);
  };

  // Export functions
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params: any = {};

      // Add current filters to export
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.search = debouncedSearch.trim();
      }
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.sub_category_id) params.sub_category_id = filters.sub_category_id;
      if (filters.filter_rent_sell) params.filter_rent_sell = filters.filter_rent_sell;
      if (filters.filter_tenure) params.filter_tenure = filters.filter_tenure;
      if (filters.status) params.status = filters.status;

      await exportProductsToExcel(params);
      toast.success('Products exported to Excel successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products to Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const params: any = {};

      // Add current filters to export
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.search = debouncedSearch.trim();
      }
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.sub_category_id) params.sub_category_id = filters.sub_category_id;
      if (filters.filter_rent_sell) params.filter_rent_sell = filters.filter_rent_sell;
      if (filters.filter_tenure) params.filter_tenure = filters.filter_tenure;
      if (filters.status) params.status = filters.status;

      await exportProductsToPDF(params);
      toast.success('Products exported to PDF successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products to PDF');
    } finally {
      setExportLoading(false);
    }
  };

  // Add this function to handle applying plans from expiry modal
  const applyPlanFromExpiry = async (plan_type: "basic" | "standard" | "premium" | "custom", months?: number, max_products?: number, plan_id?: string) => {
    try {
      const ids = productsToActivate.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("No products to activate");
        return;
      }
      
      const body: any = { 
        plan_type: String(plan_type).toLowerCase(), 
        product_ids: ids 
      };
      
      if (plan_id) body.plan_id = plan_id;
      if (plan_type === "custom") {
        body.months = months;
        body.max_products = max_products;
      }
      
      await api.post(endPointApi.postCreateListingPlan, body);
      toast.success("Plan applied successfully! Selected products activated.");
      
      // Refresh the product data
      getProductData();
      
      // Close both modals
      setShowPlanDialog(false);
      setExpiryModalOpen(false);
      setProductsToActivate([]);
      
    } catch (error) {
      console.error("Error applying plan:", error);
      toast.error("Failed to apply plan");
    }
  };

  // Update the "Activate Plans" button handler in your expiry modal
  const handleActivatePlans = () => {
    if (snoozeToday) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('expiry_modal_snooze', today);
    }
    
    // Set the products to activate (expiring products)
    setProductsToActivate(expiringProducts);
    
    // Close expiry modal and open plan selection dialog
    setExpiryModalOpen(false);
    setShowPlanDialog(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Products</h2>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => {
                // Sync pending state with current applied filters when opening
                setPendingFilters(filters);
                setPendingCategory(selectedCategory);
                setPendingSubCategory(selectedSubCategory);
                setPendingSubCategoryOptions(subCategoryOptions);
                setShowFilterModal(!showFilterModal);
              }}
              className="px-4 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative"
            >
              <CiFilter size={20} />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Modal */}
            {showFilterModal && (
              <div
                ref={filterModalRef}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 z-50 border border-gray-200 dark:border-gray-700"
              >
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filter Products</h3>
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <MdClose size={18} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div>
                      <Label className="font-semibold mb-2">Category</Label>
                      <SearchableDropdown
                        searchable
                        options={categoryOptions}
                        value={pendingCategory}
                        placeholder="Select category"
                        onChange={(value) => setPendingCategory(value)}
                      />
                    </div>

                    {/* Sub Category Filter */}
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Sub Category
                      </Label>
                      <SearchableDropdown
                        searchable
                        options={pendingSubCategoryOptions}
                        value={pendingSubCategory}
                        placeholder={pendingCategory ? "Search sub category..." : "Select category first"}
                        onChange={(value) => {
                          setPendingSubCategory(value);
                          setPendingFilters(prev => ({ ...prev, sub_category_id: value }));
                        }}
                        disabled={!pendingCategory}
                      />
                    </div>

                    {/* Product Type Filter (Rent/Sell) */}
                    <div>
                      <Label className="font-semibold mb-2">Product Type</Label>
                      <SearchableDropdown
                        searchable
                        options={[
                          { label: 'Rent', value: '1' },
                          { label: 'Sell', value: '2' },
                        ]}
                        value={pendingFilters.filter_rent_sell}
                        placeholder="All Types"
                        onChange={(value) => setPendingFilters(prev => ({ ...prev, filter_rent_sell: value }))}
                      />
                    </div>

                    {/* Listing Type Filter (Tenure) */}
                    <div>
                      <Label className="font-semibold mb-2">Listing Type</Label>
                      <SearchableDropdown
                        searchable
                        options={listingTypes.map((type: any) => ({
                          label: type.name,
                          value: String(type.id || type._id),
                        }))}
                        value={pendingFilters.filter_tenure}
                        placeholder="All Listing Types"
                        onChange={(value) => setPendingFilters(prev => ({ ...prev, filter_tenure: value }))}
                      />
                    </div>
                    <div>
                      <Label className="font-semibold mb-2">Status</Label>
                      <SearchableDropdown
                        searchable
                        options={[
                          { label: 'Active', value: 'active' },
                          { label: 'Draft', value: 'draft' },
                          { label: 'Inactive', value: 'inactive' },
                        ]}
                        value={pendingFilters.status}
                        placeholder="Status"
                        onChange={(value) => setPendingFilters(prev => ({ ...prev, status: value }))}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setPendingCategory('');
                        setPendingSubCategory('');
                        setPendingSubCategoryOptions([]);
                        setPendingFilters({ category_id: '', sub_category_id: '', filter_rent_sell: '', filter_tenure: '', status: '' });
                        setSelectedCategory('');
                        setSelectedSubCategory('');
                        setSubCategoryOptions([]);
                        setFilters({ category_id: '', sub_category_id: '', filter_rent_sell: '', filter_tenure: '', status: '' });
                        setSearchText('');
                        setShowFilterModal(false);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(pendingCategory);
                        setSelectedSubCategory(pendingSubCategory);
                        setSubCategoryOptions(pendingSubCategoryOptions);
                        setFilters(pendingFilters);
                        setShowFilterModal(false);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => router.push('/product/addProduct')}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            + Add Product
          </button>
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="px-3 py-1 hover:bg-gray-200 border-2 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
              title="More actions"
            >
              <MdMoreVert className="text-lg" />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">

                <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />

                {/* Bulk Actions Section */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bulk Actions</span>
                </div>

                {/* Deactivate */}
                <button
                  onClick={() => openBulkAction("deactivate")}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-2 text-yellow-600">
                    <MdBlock className="text-base" />
                    <span>Deactivate</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {selectedRows.length}
                  </span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => openBulkAction("delete")}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <MdDelete className="text-base" />
                    <span>Delete</span>
                  </div>
                  <span className="text-xs opacity-70">
                    {selectedRows.length}
                  </span>
                </button>

                <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />

                {/* View Drafts */}
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    router.push("/draft");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <HiOutlineDocumentText className="text-base" />
                  <span>View Drafts</span>
                </button>
                
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Export</span>
                </div>

                {/* Export to Excel */}
                <button
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                >
                  <FaFileExcel className="text-green-600 text-base" />
                  <span>Export to Excel</span>
                  {exportLoading && <Loader className="ml-auto text-green-600 w-4 h-4" />}
                </button>

                {/* Export to PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={exportLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                >
                  <FaFilePdf className="text-red-600 text-base" />
                  <span>Export to PDF</span>
                  {exportLoading && <Loader className="ml-auto text-red-600 w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <AgGridTable
        columns={columns}
        rowData={productData}
        filter={false}
        tableName="Products"
        onSelectionChange={setSelectedRows}
        loading={loading}
      />
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkAction.open}
        actionType={bulkAction.type || 'delete'}
        title={bulkAction.type === 'deactivate' ? 'Confirm Bulk Deactivate' : 'Confirm Bulk Delete'}
        message={`Are you sure you want to ${bulkAction.type} ${selectedRows.length} selected product${selectedRows.length > 1 ? 's' : ''}?`}
        confirmText={bulkAction.type === 'deactivate' ? `Deactivate ${selectedRows.length}` : `Delete ${selectedRows.length}`}
        onConfirm={bulkAction.type === 'deactivate' ? handleBulkDeactivate : handleBulkDelete}
        onCancel={() => setBulkAction({ type: null, open: false })}
        loading={loading}
      />
      
      {/* Expiry Warning Modal */}
      <Modal
        isOpen={expiryModalOpen}
        onClose={() => setExpiryModalOpen(false)}
        className="max-w-2xl p-0 overflow-hidden"
        showCloseButton
      >
        <div className="space-y-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <CiWarning className="text-yellow-600 dark:text-yellow-400 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your listings are expiring soon
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {expiringProducts.length} product{expiringProducts.length > 1 ? 's' : ''} will move to Draft in less than 3 days
                </p>
              </div>
            </div>
          </div>

          {/* Products List with Selection */}
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold text-gray-700 dark:text-gray-300">
                  Select products to activate
                </Label>
                <button
                  onClick={() => {
                    const allIds = expiringProducts.map(p => p._id || p.id);
                    setSelectedExpiringProducts(
                      selectedExpiringProducts.length === expiringProducts.length 
                        ? [] 
                        : expiringProducts.map(p => p._id || p.id)
                    );
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  {selectedExpiringProducts.length === expiringProducts.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {expiringProducts.map((p: any) => {
                  const productId = p._id || p.id;
                  const isSelected = selectedExpiringProducts.includes(productId);
                  return (
                    <div
                      key={productId}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500' 
                          : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => toggleExpiringProduct(productId)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExpiringProduct(productId)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {p.product_name}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Expires: {p.expires_at ? new Date(p.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                            </span>
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              {Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* <Button
                        onClick={() => {
                          // stopPropagation();
                          setSingleProductActivate(p);
                          setExpiryModalOpen(false);
                          setShowPlanDialog(true);
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Activate
                      </Button> */}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Snooze Option */}
            <div className="flex items-center gap-2 px-1 py-3 border-t border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="snoozeToday"
                checked={snoozeToday}
                onChange={(e) => setSnoozeToday(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="snoozeToday" className="text-sm text-gray-600 dark:text-gray-400">
                Don’t show again today
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => {
                if (snoozeToday) {
                  const today = new Date().toISOString().slice(0, 10);
                  localStorage.setItem('expiry_modal_snooze', today);
                }
                setExpiryModalOpen(false);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (selectedExpiringProducts.length === 0) {
                    toast.info("Please select at least one product to activate");
                    return;
                  }
                  if (snoozeToday) {
                    const today = new Date().toISOString().slice(0, 10);
                    localStorage.setItem('expiry_modal_snooze', today);
                  }
                  
                  // Get selected products
                  const selectedProducts = expiringProducts.filter(p => 
                    selectedExpiringProducts.includes(p._id || p.id)
                  );
                  setProductsToActivate(selectedProducts);
                  setExpiryModalOpen(false);
                  setShowPlanDialog(true);
                }}
                disabled={selectedExpiringProducts.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Activate Selected ({selectedExpiringProducts.length})
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Plan Selection Dialog */}
      <PlanSelectionDialog
        isOpen={showPlanDialog}
        onClose={() => {
          setShowPlanDialog(false);
          setProductsToActivate([]);
        }}
        selectedCount={productsToActivate.length}
        onApplyPlan={applyPlanFromExpiry}
        selectedProducts={productsToActivate}
      />
    </div>
  )
}

export default ProductTable
