"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { MdDelete, MdModeEdit, MdFilterList, MdClose, MdSearch, MdKeyboardArrowDown, MdCheck, MdMoreVert } from "react-icons/md";
import StatusBadge from "@/components/common/StatusBadge";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import DatePicker from "@/components/common/DatePicker";
import { CiFilter } from "react-icons/ci";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { exportQuotesToExcel, exportQuotesToPDF } from '@/utils/exportUtils';
import { FaFileExcel, FaFilePdf, FaDownload } from 'react-icons/fa';
import { FiEdit3, FiCheck, FiX, FiMoreVertical } from 'react-icons/fi';
import ActionButtons from "@/components/common/ActionButtons";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type Quote = {
  _id: string;
  product_id: {
    _id: string;
    product_name: string;
    product_type_name: string;
    product_listing_type_name: string;
    price: string;
    product_main_image: string;
    category_name: string;
    sub_category_name: string;
    description: string;
  };
  delivery_date: string;
  number_of_days: number;
  months_id: string;
  qty: number;
  note: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields for display
  product_name?: string;
  product_type_name?: string;
  product_listing_type_name?: string;
  price?: string;
  total_price?: string;
  month_name?: string;
  product_main_image?: string;
};

const QuoteTable = () => {
  const router = useRouter();
  const gridRef = useRef<any>(null);
  const [quoteData, setQuoteData] = useState<Quote[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [productTypes, setProductTypes] = useState<any[]>([]);
  console.log("🚀 ~ QuoteTable ~ productTypes:", productTypes)
  const [listingTypes, setListingTypes] = useState<any[]>([]);
  const [months, setMonths] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchText, 600);
  const [exportLoading, setExportLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

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

  // Filter state
  const [filters, setFilters] = useState({
    product_type: '',
    listing_type: '',
    delivery_start_date: '',
    delivery_end_date: '',
    month: '',
    status: '',
  });
  console.log("🚀 ~ QuoteTable ~ filters:", filters)

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Transform API data to match table columns
  const transformQuoteData = (quotes: any[]): Quote[] => {
    return quotes.map(quote => {
      const product = quote.product_id || {};
      const fmt = (d?: any) => {
        if (!d) return '-';
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return '-';
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      // Get month name from product's month_arr if months_id exists
      let monthName = '-';
      if (quote.months_id && product.month_arr && Array.isArray(product.month_arr)) {
        const month = product.month_arr.find((m: any) =>
          m.months_id === quote.months_id || m.product_months_id === quote.months_id
        );
        if (month) {
          monthName = month.month_name;
        }
      }

      // Calculate price based on quote data
      let totalPrice = '0';
      let unitPrice = '0';

      console.log('Processing quote:', {
        quoteId: quote._id,
        months_id: quote.months_id,
        calculated_price: quote.calculated_price,
        product_month_arr: product.month_arr,
        product_price: product.price,
        qty: quote.qty,
        number_of_days: quote.number_of_days
      });

      if (quote.calculated_price) {
        // Use calculated price from backend if available
        totalPrice = quote.calculated_price.toString();
        // Calculate unit price from total
        const qty = parseInt(quote.qty || '1');
        const days = parseInt(quote.number_of_days || '1');
        if (quote.months_id && product.month_arr && Array.isArray(product.month_arr)) {
          // Monthly product - unit price is per month
          const month = product.month_arr.find((m: any) =>
            m.months_id === quote.months_id || m.product_months_id === quote.months_id
          );
          unitPrice = month?.price || '0';
        } else {
          // Daily/Hourly product - calculate unit price
          unitPrice = days > 0 ? (parseFloat(totalPrice) / (qty * days)).toString() : '0';
        }
        console.log('Using calculated price:', { totalPrice, unitPrice });
      } else if (quote.months_id && product.month_arr && Array.isArray(product.month_arr)) {
        // Monthly product - calculate from month_arr
        const month = product.month_arr.find((m: any) =>
          m.months_id === quote.months_id || m.product_months_id === quote.months_id
        );
        if (month) {
          unitPrice = month.price || '0';
          totalPrice = (parseFloat(month.price || '0') * parseInt(quote.qty || '1')).toString();
          console.log('Monthly calculation:', { month, unitPrice, totalPrice });
        }
      } else {
        // Daily/Hourly product - calculate from base price
        unitPrice = product.price || '0';
        const days = parseInt(quote.number_of_days || '1');
        const qty = parseInt(quote.qty || '1');
        totalPrice = (parseFloat(unitPrice) * days * qty).toString();
        console.log('Daily/Hourly calculation:', { unitPrice, days, qty, totalPrice });
      }

      return {
        ...quote,
        // Flatten product fields for easy access in table
        product_name: product.product_name || '-',
        product_type_name: product.product_type_name || '-',
        product_listing_type_name: product.product_listing_type_name || '-',
        price: unitPrice,
        product_main_image: product.product_main_image || '',
        total_price: totalPrice,
        month_name: monthName,
        delivery_date: fmt(quote.delivery_date),
        start_date: fmt(quote.start_date),
        end_date: fmt(quote.end_date),
      };
    });
  };

  const columns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 300,
      sortable: true,
      cellRenderer: (params: any) => {
        const imageUrl = params.data?.product_main_image;
        const productName = params.data?.product_name;

        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0 relative">
              {imageUrl ? (
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
                    e.target.src =
                      "https://via.placeholder.com/60x60?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-400 text-[10px] rounded-lg border">
                  No
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[13px] text-gray-800 dark:text-white truncate" title={productName}>
                {productName || "N/A"}
              </span>
              <span className="text-[10px] text-gray-500 truncate">
                {params.data?.category_name || ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      field: "product_type_name",
      headerName: "Product Type",
      minWidth: 120,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "product_listing_type_name",
      headerName: "Product Listing Type",
      minWidth: 220,
      cellStyle: { textAlign: "center" }
    },

    {
      field: "month_name",
      headerName: "Month",
      minWidth: 120,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "qty",
      headerName: "Qty",
      minWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "price",
      headerName: "Unit Price",
      minWidth: 120,
      valueFormatter: (params) => {
        const value = params.value;
        if (!value || value === '0') return "₹0";
        return `₹${Number(value).toLocaleString('en-IN')}`;
      },
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_price",
      headerName: "Total Price",
      minWidth: 140,
      valueFormatter: (params) => {
        const value = params.value;
        if (!value || value === '0') return "₹0";
        return `₹${Number(value).toLocaleString('en-IN')}`;
      },
      cellStyle: { textAlign: "left", fontWeight: "600" },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'pending'} />
        </div>
      ),
    },
    {
      field: "delivery_date",
      headerName: "Delivery Date",
      minWidth: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "start_date",
      headerName: "Start Date",
      minWidth: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "end_date",
      headerName: "End Date",
      minWidth: 150,
      cellStyle: { textAlign: "center" }
    },

    {
      headerName: "Action",
      width: 150,
      minWidth: 150,
      pinned: 'right',
      suppressHeaderMenuButton: true,

      cellRenderer: (params: any) => {
        const status = params.data?.status?.toLowerCase();
        const isApproved = status === 'approval' || status === 'approved';
        const isRejected = status === 'reject' || status === 'rejected';
        const isCompleted = status === 'complete' || status === 'completed';
        const isDisabled = isApproved || isRejected || isCompleted;

        return (
          <div className="flex items-center justify-center gap-2 h-full">
            {/* Approve */}
            <button
              onClick={() => handleApproval(params.data._id)}
              disabled={isDisabled}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
              ${isDisabled
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm hover:shadow"
                }`}
              title="Approve"
            >
              <FiCheck className="text-base" />
            </button>

            {/* Reject */}
            <button
              onClick={() => handleRejected(params.data._id)}
              disabled={isDisabled}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
              ${isDisabled
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm hover:shadow"
                }`}
              title="Reject"
            >
              <FiX className="text-base" />
            </button>
            <ActionButtons
              onEdit={() => router.push(`/quote/edit/${params.data._id || params.data.id}`)}
              showDelete={false}
            />
          </div>
        );
      },
    }
  ];

  const getQuoteData = async (filterParams: any = {}) => {
    try {
      // Build query params
      const params: any = {};

      if (filterParams.status) params.status = filterParams.status;
      if (filterParams.search) params.search = filterParams.search;
      if (filterParams.product_type) params.product_type = filterParams.product_type;
      if (filterParams.listing_type) params.listing_type = filterParams.listing_type;
      if (filterParams.month) params.month = filterParams.month;
      if (filterParams.delivery_start_date) params.delivery_start_date = filterParams.delivery_start_date;
      if (filterParams.delivery_end_date) params.delivery_end_date = filterParams.delivery_end_date;
      if (filterParams.page) params.page = filterParams.page;
      if (filterParams.limit) params.limit = filterParams.limit;

      console.log("🚀 ~ API Request Params:", params);

      const res = await api.get(endPointApi.postGetQuote, { params });
      console.log("🚀 ~ API Response:", res);

      if (res?.data?.success && res?.data?.data) {
        const transformedData = transformQuoteData(res.data.data);
        console.log("🚀 ~ Transformed Data:", transformedData);
        setQuoteData(transformedData);

        // You might want to store pagination info in state
        // setTotalPages(res.data.totalPages);
        // setCurrentPage(res.data.page);
      }
    } catch (error) {
      console.log("fetch quotes error:", error);
      toast.error("Failed to fetch quotes");
    }
  };

  const getDropdownData = async () => {
    try {
      const res = await api.post(endPointApi.postProductDropDownList);
      console.log("🚀 ~ getDropdownData ~ res:", res);

      // Check for success flag instead of status
      if (res?.data?.success === true) {
        const data = res.data; // Data is at root level
        console.log("🚀 ~ getDropdownData ~ data:", data)
        setProductTypes(data.products_type || []);
        setListingTypes(data.products_listing_type || []);
        setMonths(data.products_months || []);
      }
      // Fallback check if data is directly available
      else if (res?.data?.products_type) {
        setProductTypes(res.data.products_type || []);
        setListingTypes(res.data.products_listing_type || []);
        setMonths(res.data.products_months || []);
      }
    } catch (error) {
      console.log("fetch dropdown error:", error);
    }
  };

  const getStatusList = async () => {
    try {
      const res = await api.post(endPointApi.getStatus);
      if (res?.data?.status === 200 && Array.isArray(res.data?.data)) {
        setStatusList(res.data.data);
      }
    } catch (error) {
      console.log("fetch status error:", error);
    }
  };

  const handleApproval = async (quoteId: string) => {
    try {
      const statusApproved = statusList.find((s: any) =>
        String(s.name || '').toLowerCase().includes('approv')
      );
      if (!statusApproved) return toast.error("Approval status not found");

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', statusApproved.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success(`Status changed to ${String(statusApproved.name).toUpperCase()}`);
        await getQuoteData(filters);
      }
    } catch (error) {
      console.log('Approval error:', error);
      toast.error("Failed to approve quote");
    }
  };

  const handleRejected = async (quoteId: string) => {
    try {
      const rejectedStatus = statusList.find(s =>
        s.name?.toLowerCase() === 'rejected' || s.name?.toLowerCase() === 'reject'
      );
      if (!rejectedStatus) {
        toast.error("Rejected status not found");
        return;
      }

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', rejectedStatus.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success("Quote rejected successfully");
        await getQuoteData(filters);
      }
    } catch (error) {
      console.log('Rejection error:', error);
      toast.error("Failed to reject quote");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOpenDropdown(null);
  };

  const getSelectedLabel = (key: string) => {
    const value = filters[key as keyof typeof filters];
    if (!value) return null;

    switch (key) {
      case 'product_type':
        return productTypes.find(t => t.id === value)?.product_type;
      case 'listing_type':
        return listingTypes.find(l => l.id === value)?.name;
      case 'month':
        return months.find(m => m.id === value)?.month_name;
      case 'status':
        return statusList.find(s => s.id === value)?.name;
      default:
        return value;
    }
  };
  const applyFilters = () => {
    const params: any = {};

    // Add all filter parameters
    if (filters.status) params.status = filters.status;
    if (filters.product_type) params.product_type = filters.product_type;
    if (filters.listing_type) params.listing_type = filters.listing_type;
    if (filters.month) params.month = filters.month;
    if (filters.delivery_start_date) params.delivery_start_date = filters.delivery_start_date;
    if (filters.delivery_end_date) params.delivery_end_date = filters.delivery_end_date;
    if (searchText) params.search = searchText;

    // Add pagination params (optional)
    params.page = 1; // Reset to first page when applying filters
    params.limit = 10;

    console.log("🚀 ~ Applying filters:", params);
    getQuoteData(params);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    const hasActiveFilters = Object.values(filters).some(val => val !== '');
    const hadSearch = searchText !== '';

    if (hasActiveFilters || hadSearch) {
      setFilters({
        product_type: '',
        listing_type: '',
        delivery_start_date: '',
        delivery_end_date: '',
        month: '',
        status: ''
      });
      setSearchText('');
      getQuoteData();
    }

    setShowFilterModal(false);
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
      if (filters.status) params.status = filters.status;
      if (filters.product_type) params.product_type = filters.product_type;
      if (filters.listing_type) params.listing_type = filters.listing_type;
      if (filters.month) params.month = filters.month;
      if (filters.delivery_start_date) params.delivery_start_date = filters.delivery_start_date;
      if (filters.delivery_end_date) params.delivery_end_date = filters.delivery_end_date;

      await exportQuotesToExcel(params);
      toast.success('Quotes exported to Excel successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export quotes to Excel');
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
      if (filters.status) params.status = filters.status;
      if (filters.product_type) params.product_type = filters.product_type;
      if (filters.listing_type) params.listing_type = filters.listing_type;
      if (filters.month) params.month = filters.month;
      if (filters.delivery_start_date) params.delivery_start_date = filters.delivery_start_date;
      if (filters.delivery_end_date) params.delivery_end_date = filters.delivery_end_date;

      await exportQuotesToPDF(params);
      toast.success('Quotes exported to PDF successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export quotes to PDF');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    const params: any = { ...filters };
    if (debouncedSearch) params.search = debouncedSearch;
    getQuoteData(params);
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setShowFilterModal(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getStatusList();
    getDropdownData();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Quotes</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative"
            >
              <CiFilter size={20} />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterModal && (
              <div ref={dropdownRef} className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[300px] z-50 border border-gray-200 dark:border-gray-700">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Quotes</h3>
                    <button onClick={() => setShowFilterModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                      <MdClose size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Product Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product Type</label>
                      <SearchableDropdown
                        searchable
                        options={productTypes.map((t: any) => ({ label: t.product_type, value: String(t.id) }))}
                        value={filters.product_type}
                        placeholder="Select Product Type"
                        onChange={(val) => handleFilterChange('product_type', val)}
                      />
                    </div>

                    {/* Listing Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Listing Type</label>
                      <SearchableDropdown
                        searchable
                        options={listingTypes.map((lt: any) => ({ label: lt.name, value: String(lt.id) }))}
                        value={filters.listing_type}
                        placeholder="Select Listing Type"
                        onChange={(val) => handleFilterChange('listing_type', val)}
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ">Start Date</label>
                      <DatePicker
                        value={filters.delivery_start_date}
                        onChange={(date) => handleFilterChange("delivery_start_date", date)}
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <DatePicker
                        value={filters.delivery_end_date}
                        min={filters.delivery_start_date}
                        onChange={(date) => handleFilterChange("delivery_end_date", date)}
                      />
                    </div>

                    {/* Month */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Month</label>
                      <SearchableDropdown
                        searchable
                        options={months.map((m: any) => ({ label: m.month_name, value: String(m.id) }))}
                        value={filters.month}
                        placeholder="Select Month"
                        onChange={(val) => handleFilterChange('month', val)}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <SearchableDropdown
                        searchable
                        options={statusList.map((s: any) => ({ label: s.name, value: String(s.id) }))}
                        value={filters.status}
                        placeholder="Select Status"
                        onChange={(val) => handleFilterChange('status', val)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={clearFilters} className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium">
                      Clear
                    </button>
                    <button onClick={applyFilters} className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Menu (3-dots) - Ultra Sophisticated Design */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
              title="Export options"
            >
              <FiMoreVertical className="text-xl" />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 mt-3 w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Export Section */}
                <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100/30 dark:border-gray-800/30">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Export Options</span>
                </div>

                <div className="py-1">
                  {/* Export to Excel */}
                  <button
                    onClick={handleExportExcel}
                    disabled={exportLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to Excel</span>
                    {exportLoading && <div className="ml-auto w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />}
                  </button>

                  {/* Export to PDF */}
                  <button
                    onClick={handleExportPDF}
                    disabled={exportLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to PDF</span>
                    {exportLoading && <div className="ml-auto w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AgGridTable
        columns={columns}
        rowData={quoteData}
        filter={true}
        tableName="Quotes"
        rowHeight={52}
      />
      {/* Floating Image Preview */}
      {hoveredImage && (
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            top: mousePos.y + 25,
            left: mousePos.x + 25,
            opacity: hoveredImage ? 1 : 0
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <img
              src={hoveredImage}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteTable;