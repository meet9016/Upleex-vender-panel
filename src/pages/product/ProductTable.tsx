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
import { FiMoreVertical, FiSlash, FiTrash2, FiFileText, FiPauseCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import PlanSelectionDialog from '@/components/common/PlanSelectionDialog';
import Button from '@/components/ui/button/Button';
import Switch from '@/components/form/switch/Switch';
import Checkbox from '@/components/form/input/Checkbox';


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
  approval_status?: string;
  is_visible?: boolean;
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
  const [rentProducts, setRentProducts] = useState<Product[]>([]);
  const [sellProducts, setSellProducts] = useState<Product[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ type: 'deactivate' | 'delete' | null; open: boolean }>({ type: null, open: false });
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rent' | 'sell'>('rent');
  const [dataCache, setDataCache] = useState<{
    rent: { data: Product[], total: number, totalPages: number, page: number } | null,
    sell: { data: Product[], total: number, totalPages: number, page: number } | null
  }>({ rent: null, sell: null });
  const filterModalRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [snoozeToday, setSnoozeToday] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });



  // Robustly clear hover when mouse is NOT over a trigger
  useEffect(() => {
    if (!hoveredImage) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.hover-zoom-trigger')) {
        setHoveredImage(null);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [hoveredImage]);

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

  // Toggle product visibility
  const toggleProductVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      await api.post(endPointApi.toggleProductVisibility, {
        product_id: productId,
        is_visible: !currentVisibility
      });

      const message = !currentVisibility
        ? 'Product is now visible to users'
        : 'Product is now hidden from users';

      toast.success(message);

      // Refresh the product data
      getProductData(getCurrentParams(), undefined, true);
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update product visibility';
      toast.error(errorMessage);
    }
  };

  // Create columns based on active tab
  const getColumns = (): ColDef[] => {
    const baseColumns: ColDef[] = [
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
              <div className="flex-shrink-0 relative">
                <img
                  src={imageUrl}
                  alt={productName}
                  className="w-9 h-9 object-cover rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-shadow hover:shadow-md hover-zoom-trigger"
                  onMouseEnter={(e: any) => {
                    setHoveredImage(imageUrl);
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e: any) => {
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredImage(null);
                  }}
                  onError={(e: any) => {
                    if (e.target.src !== DEFAULT_PLACEHOLDER) {
                      e.target.src = DEFAULT_PLACEHOLDER;
                    }
                  }}
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-[13px] text-gray-800 dark:text-white truncate" title={productName}>
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
        minWidth: 150,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "sub_category_name",
        headerName: "Sub Category",
        minWidth: 150,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "price",
        headerName: "Price",
        minWidth: 100,
        valueFormatter: (params) => {
          return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
        },
        cellStyle: { textAlign: "left" }
      },
      {
        field: "cancel_price",
        headerName: "Cancel Price",
        minWidth: 120,
        valueFormatter: (params) => {
          return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
        },
        cellStyle: { textAlign: "left" }
      }
    ];

    // Add conditional columns based on activeTab
    if (activeTab === 'rent') {
      // Add Listing Type, Stock, and Deposit for Rent products
      baseColumns.push(
        {
          field: "product_listing_type_name",
          headerName: "Listing Type",
          minWidth: 120,
          cellStyle: { textAlign: "left" }
        },
        {
          field: "available_quantity",
          headerName: "Stock",
          minWidth: 100,
          cellRenderer: (params: any) => {
            const product = params.data;
            const available = product.available_quantity || 0;
            const isOutOfStock = product.is_out_of_stock || available <= 0;

            return (
              <div className="flex items-center h-full">
                <span className={`text-xs font-semibold ${
                  isOutOfStock ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {available} {isOutOfStock && "(OOS)"}
                </span>
              </div>
            );
          },
          cellStyle: { justifyContent: "left" }
        },
        {
          field: "deposit_amount",
          headerName: "Deposit",
          minWidth: 120,
          valueFormatter: (params) => {
            const value = params.value;
            if (!value || value === '0') return '-';
            return `₹${Number(value).toLocaleString('en-IN')}`;
          },
          cellStyle: { textAlign: "left" }
        }
      );
    } else if (activeTab === 'sell') {
      // Add Stock for Sell products
      baseColumns.push({
        field: "available_quantity",
        headerName: "Stock",
        minWidth: 100,
        cellRenderer: (params: any) => {
          const product = params.data;
          const available = product.available_quantity || 0;
          const isOutOfStock = product.is_out_of_stock || available <= 0;

          return (
            <div className="flex items-center h-full">
              <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
                }`}>
                {available} {isOutOfStock && "(OOS)"}
              </span>
            </div>
          );
        },
        cellStyle: { justifyContent: "left" }
      });
    }

    // Add remaining common columns
    baseColumns.push(
      {
        field: "is_new",
        headerName: "New",
        minWidth: 100,
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full">
            {params.value ? (
              <StatusBadge status={'New'} />
            ) : (
              <span className="text-gray-400 text-xs">-</span>
            )}
          </div>
        ),
        cellStyle: { justifyContent: "left" }
      },
      {
        headerName: "Admin",
        field: "approval_status",
        minWidth: 110,
        sortable: true,
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full">
            <StatusBadge status={params.value || 'active'} />
          </div>
        ),
        cellStyle: { justifyContent: "left" }
      },
      // {
      //   field: "status",
      //   headerName: "Status",
      //   minWidth: 100,
      //   cellRenderer: (params: any) => (
      //     <div className="flex items-center h-full">
      //       <StatusBadge status={params.value || 'active'} />
      //     </div>
      //   ),
      //   cellStyle: { justifyContent: "left" }
      // },
      {
        field: "expires_at",
        headerName: "Exp Date",
        minWidth: 120,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
        cellStyle: { textAlign: "left" }
      },
      {
        field: "is_visible",
        headerName: "Visibility",
        minWidth: 110,
        cellRenderer: (params: any) => {
          const product = params.data;
          const isVisible = product.is_visible !== false;
          const isApproved = product.approval_status === 'approved';

          return (
            <div className="flex items-center h-full">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isVisible}
                  onChange={() => {
                    if (isApproved) {
                      toggleProductVisibility(product._id || product.id, isVisible);
                    }
                  }}
                  disabled={!isApproved}
                  size="sm"
                  className={`${!isApproved ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                />
                {/* <span className={`text-xs font-medium ${
                  !isApproved 
                    ? 'text-gray-400' 
                    : isVisible 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isVisible ? 'Visible' : 'Hidden'}
                </span> */}
              </div>
            </div>
          );
        },
        cellStyle: { justifyContent: "left" }
      },
      {
        headerName: "Action",
        width: 150,
        minWidth: 150,
        pinned: 'right',
        suppressHeaderMenuButton: true,
        cellStyle: { textAlign: "center" },
        cellRenderer: (params: any) => {
          const product = params.data;
          const isApproved = product.approval_status === 'approved';

          return (
            <ActionButtons
              onEdit={() => router.push(`/product/addProduct?id=${product._id || product.id}`)}
              onDelete={() => {
                if (!isApproved) {
                  openDeletePopup(product._id || product.id);
                }
              }}
              showDelete={true}
              disableDelete={isApproved}
            />
          );
        },
      }
    );

    return baseColumns;
  };

  const columns = getColumns();

  const getRowStyle = (params: any) => {
    if (params.data.status?.toLowerCase() === 'draft') {
      return { backgroundColor: '#f3f4f6' }; // Light grey for Draft
    }
    return undefined;
  };

  const getCurrentParams = () => {
    const params: any = {};
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.sub_category_id) params.sub_category_id = filters.sub_category_id;
    if (filters.filter_rent_sell) params.filter_rent_sell = filters.filter_rent_sell;
    if (filters.filter_tenure) params.filter_tenure = filters.filter_tenure;
    if (filters.status) params.status = filters.status;
    return params;
  };

  // Fetch products with filters
  const getProductData = async (filterParams = {}, tabType?: 'rent' | 'sell', skipCache = false) => {
    try {
      const targetTab = tabType || activeTab;
      setTabLoading(true);

      // Check if we have cached data for this tab and no filters are applied
      const hasFilters = Object.values(filterParams).some(v => v !== undefined && v !== '');
      const cachedData = dataCache[targetTab];

      if (!skipCache && cachedData && !hasFilters && !debouncedSearch) {
        // Use cached data
        setProductData(cachedData.data);
        setTotal(cachedData.total);
        setTotalPages(cachedData.totalPages);
        setPage(cachedData.page);
        setTabLoading(false);
        return;
      }

      const params = new URLSearchParams();

      // Add all non-empty filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      // Add tab-based filtering
      if (targetTab === 'rent') {
        params.append('filter_rent_sell', '1');
      } else if (targetTab === 'sell') {
        params.append('filter_rent_sell', '2');
      }

      params.append('page', String(page));
      params.append('limit', String(pageSize));

      const queryString = params.toString();
      const url = queryString
        ? `${endPointApi.postAllVendorProductList}?${queryString}`
        : endPointApi.postAllVendorProductList;

      const res = await api.get(url);
      const products = res?.data?.data || [];
      const responseTotal = res?.data?.total || 0;
      const responseTotalPages = res?.data?.totalPages || 1;
      const responsePage = res?.data?.page || page;

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
      setTotal(responseTotal);
      setTotalPages(responseTotalPages);
      setPage(responsePage);

      // Cache the data if no filters are applied
      if (!hasFilters && !debouncedSearch) {
        setDataCache(prev => ({
          ...prev,
          [targetTab]: {
            data: normalized,
            total: responseTotal,
            totalPages: responseTotalPages,
            page: responsePage
          }
        }));
      }


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
      setTabLoading(false);
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
  }, [debouncedSearch, filters, activeTab]);

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
  }, [debouncedSearch, filters, page, pageSize, activeTab]);

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
      getProductData(getCurrentParams(), undefined, true);
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
      getProductData(getCurrentParams(), undefined, true);
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
      getProductData(getCurrentParams(), undefined, true);
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
      setExcelLoading(true);
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
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
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
      setPdfLoading(false);
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

      const response = await api.post(endPointApi.postCreateListingPlan, body);
      const message = response?.data?.message || "Plan applied successfully! Selected products activated.";
      toast.success(message);

      // Refresh the product data
      getProductData(getCurrentParams(), undefined, true);

      // Close both modals
      setShowPlanDialog(false);
      setExpiryModalOpen(false);
      setProductsToActivate([]);
      setSelectedExpiringProducts([]);

    } catch (error: any) {
      console.error("Error applying plan:", error);
      const errorMessage = error?.response?.data?.message || "Failed to apply plan";
      toast.error(errorMessage);
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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Products</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full sm:w-64"
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
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 relative"
            >
              <CiFilter size={20} />
              <span className="hidden sm:inline">Filter</span>
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
                className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-auto sm:w-96 z-50 border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-120px)] overflow-y-auto"
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
                    {/* <div>
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
                    </div> */}

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
                        const hasActiveFilters = Object.values(filters).some(val => val !== '');
                        const hadSearch = searchText !== '';

                        setPendingCategory('');
                        setPendingSubCategory('');
                        setPendingSubCategoryOptions([]);
                        setPendingFilters({ category_id: '', sub_category_id: '', filter_rent_sell: '', filter_tenure: '', status: '' });

                        if (hasActiveFilters || hadSearch) {
                          setSelectedCategory('');
                          setSelectedSubCategory('');
                          setSubCategoryOptions([]);
                          setFilters({ category_id: '', sub_category_id: '', filter_rent_sell: '', filter_tenure: '', status: '' });
                          setSearchText('');
                        }

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
            className="w-full sm:w-auto px-4 py-2 btn-primary font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">+ Add Product</span>
            <span className="sm:hidden">+ Add</span>
          </button>
          {/* Actions Menu (3-dots) - Ultra Sophisticated Design */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="w-full sm:w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
              title="More actions"
            >
              <FiMoreVertical className="text-xl" />
            </button>

            {showActionsMenu && (
              <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-3 w-auto sm:w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Bulk Actions Section */}
                <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100/30 dark:border-gray-800/30">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Bulk Operations</span>
                </div>

                <div className="py-1">
                  {/* Deactivate */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      openBulkAction("deactivate");
                    }}
                    className="group w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <FiPauseCircle className="text-lg text-amber-500 group-hover:scale-110 transition-transform duration-200" />
                      <span>Deactivate</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full">
                      {selectedRows.length}
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      openBulkAction("delete");
                    }}
                    className="group w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-rose-600 dark:text-rose-400 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <FiTrash2 className="text-lg group-hover:scale-110 transition-transform duration-200" />
                      <span>Delete Selected</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">
                      {selectedRows.length}
                    </span>
                  </button>
                </div>

                {/* Management Section */}
                <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border-y border-gray-100/30 dark:border-gray-800/30">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Management</span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      router.push("/draft");
                    }}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-200"
                  >
                    <FiFileText className="text-lg text-indigo-500 group-hover:scale-110 transition-transform duration-200" />
                    <span>View Drafts</span>
                  </button>
                </div>

                {/* Export Section */}
                <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border-y border-gray-100/30 dark:border-gray-800/30">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Export Options</span>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleExportExcel}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                    <span>Export to Excel</span>
                    {excelLoading && <Loader className="ml-auto text-emerald-600 w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                    <span>Export to PDF</span>
                    {pdfLoading && <Loader className="ml-auto text-rose-600 w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-start mb-6 overflow-x-auto">
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 shadow-sm min-w-max">

          <button
            onClick={() => setActiveTab('rent')}
            className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'rent'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/[0.04]'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'rent' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">RENT</span>
            <span className="sm:hidden">R</span>
          </button>

          <button
            onClick={() => setActiveTab('sell')}
            className={`group flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'sell'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-md ring-1 ring-black/[0.04]'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'sell' ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">SELL</span>
            <span className="sm:hidden">S</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <AgGridTable
            columns={columns}
            rowData={productData}
            filter={false}
            tableName="Products"
            onSelectionChange={setSelectedRows}
            loading={loading}
            getRowStyle={getRowStyle}
            rowHeight={52}
          />
        </div>
      </div>
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
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      onClick={() => toggleExpiringProduct(productId)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleExpiringProduct(productId)}
                          className="w-4 h-4"
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
              <Checkbox
                id="snoozeToday"
                checked={snoozeToday}
                onChange={(checked) => setSnoozeToday(checked)}
                label="Don’t show again today"
              />
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
                  if (selectedExpiringProducts.length === 0 && !snoozeToday) {
                    toast.info("Please select at least one product to activate");
                    return;
                  }

                  if (snoozeToday) {
                    const today = new Date().toISOString().slice(0, 10);
                    localStorage.setItem('expiry_modal_snooze', today);
                  }

                  if (selectedExpiringProducts.length > 0) {
                    const selectedProducts = expiringProducts.filter(p =>
                      selectedExpiringProducts.includes(p._id || p.id)
                    );
                    setProductsToActivate(selectedProducts);
                    setExpiryModalOpen(false);
                    setShowPlanDialog(true);
                  } else {
                    setExpiryModalOpen(false);
                  }
                }}
                disabled={selectedExpiringProducts.length === 0 && !snoozeToday}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedExpiringProducts.length > 0
                  ? `Activate Selected (${selectedExpiringProducts.length})`
                  : 'Confirm Snooze'}
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

      {/* Floating Image Preview */}
      {hoveredImage && (
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            top: mousePos.y + 20,
            left: mousePos.x + 20,
            transform: `translate(${mousePos.x + 220 > window.innerWidth ? '-110%' : '0'}, ${mousePos.y + 220 > window.innerHeight ? '-110%' : '0'})`
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <img
              src={hoveredImage}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductTable
