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
import MultiSelectDropdown from "@/components/common/MultiSelectDropdown";
import { exportQuotesToExcel, exportQuotesToPDF } from '@/utils/exportUtils';
import { FaFileExcel, FaFilePdf, FaDownload } from 'react-icons/fa';
import { FiEdit3, FiCheck, FiX, FiMoreVertical, FiTruck } from 'react-icons/fi';
import ActionButtons from "@/components/common/ActionButtons";
import Loader from "@/components/common/Loader";

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
  number_of_days: number;
  months_id: string;
  qty: number;
  note: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  product_name?: string;
  product_type_name?: string;
  product_listing_type_name?: string;
  price?: string;
  total_price?: string;
  month_name?: string;
  product_main_image?: string;
  razorpay_payment_link?: string;
  payment_status?: string;
};

const QuoteTable = () => {
  const router = useRouter();
  const gridRef = useRef<any>(null);
  const [quoteData, setQuoteData] = useState<Quote[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
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
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

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

  // Filter state - Updated to support multiple selections
  const [filters, setFilters] = useState({
    product_type: [] as string[],
    listing_type: [] as string[],
    delivery_start_date: '',
    delivery_end_date: '',
    month: [] as string[],
    status: [] as string[],
  });
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Categories data - removed since not needed
  console.log("🚀 ~ QuoteTable ~ filters:", filters)

  const activeFilterCount = Object.values(filters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== ''
  ).length;

  const getCurrentParams = (customFilters?: typeof filters) => {
    const targetFilters = customFilters || filters;
    const params: any = {};

    // Convert status IDs → internal enum strings that MongoDB stores
    if (targetFilters.status.length > 0) {
      const internalStatuses = resolveStatusValues(targetFilters.status);
      if (internalStatuses) params.status = internalStatuses;
    }
    if (targetFilters.product_type.length > 0) params.product_type = targetFilters.product_type.join(',');
    if (targetFilters.listing_type.length > 0) params.listing_type = targetFilters.listing_type.join(',');
    if (targetFilters.month.length > 0) params.month = targetFilters.month.join(',');
    if (targetFilters.delivery_start_date) params.delivery_start_date = targetFilters.delivery_start_date;
    if (targetFilters.delivery_end_date) params.delivery_end_date = targetFilters.delivery_end_date;

    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }

    return params;
  };

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
        product_name: product.product_name || '-',
        product_type_name: product.product_type_name || '-',
        product_listing_type_name: product.product_listing_type_name || '-',
        price: unitPrice,
        product_main_image: product.product_main_image || '',
        total_price: totalPrice,
        month_name: monthName,
        start_date: fmt(quote.start_date) || '-',
        end_date: fmt(quote.end_date) || '-',
        start_time: quote.start_time || '-',
        end_time: quote.end_time || '-',
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
      field: "payment_status",
      headerName: "Payment Status",
      minWidth: 140,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center justify-center h-full">
            <StatusBadge status={params.value || 'pending'} />
          </div>
        );
      }
    },
    // {
    //   field: "delivery_date",
    //   headerName: "Delivery Date",
    //   minWidth: 150,
    //   cellStyle: { textAlign: "center" }
    // },
    {
      field: "start_date",
      headerName: "Start Date",
      minWidth: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "start_time",
      headerName: "Start Time",
      minWidth: 130,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "end_date",
      headerName: "End Date",
      minWidth: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "end_time",
      headerName: "End Time",
      minWidth: 130,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "razorpay_payment_link",
      headerName: "Payment Link",
      minWidth: 160,
      cellRenderer: (params: any) => {
        const link = params.value;
        if (!link) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex items-center h-full">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors inline-block font-medium truncate max-w-[140px]"
              title={link}
            >
              Copy Link
            </a>
          </div>
        );
      }
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
        const isCompleted = status === 'complete' || status === 'completed' || status === 'successful' || status === 'success';
        const isDelivery = status === 'delivery';
        const isDisabled = isApproved || isRejected || isCompleted || isDelivery;

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

            {/* Move to Delivery - Only show if approved and payment is paid */}
            {/* {isApproved && (
              <button
                onClick={() => {
                  if (params.data?.payment_status?.toLowerCase() !== 'paid') {
                    toast.warning("Delivery available only after payment is PAID");
                    return;
                  }
                  handleDelivery(params.data._id);
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                ${params.data?.payment_status?.toLowerCase() !== 'paid'
                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 opacity-60"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm hover:shadow"
                  }`}
                title={params.data?.payment_status?.toLowerCase() !== 'paid' ? "Payment Pending" : "Mark as Delivery"}
              >
                <FiTruck className="text-base" />
              </button>
            )} */}

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
      setLoading(true);
      // Build query params
      const params = { ...filterParams };

      console.log("🚀 ~ API Request Params:", params);

      const res = await api.get(endPointApi.postGetQuote, { params });
      console.log("🚀 ~ API Response:", res);

      if (res?.data?.success && res?.data?.data) {
        const transformedData = transformQuoteData(res.data.data);
        console.log("🚀 ~ Transformed Data:", transformedData);
        setQuoteData(transformedData);
      }
    } catch (error) {
      console.log("fetch quotes error:", error);
      toast.error("Failed to fetch quotes");
    } finally {
      setLoading(false);
    }
  };

  // Remove unused getCategoriesData function

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
    // Optimistic update
    const previousData = [...quoteData];
    const statusApprovedRaw = statusList.find((s: any) =>
      String(s.name || '').toLowerCase().includes('approv')
    );
    
    setQuoteData(prev => prev.map(q => 
      q._id === quoteId ? { ...q, status: getInternalStatus(statusApprovedRaw?.name || 'approval') } : q
    ));

    try {
      if (!statusApprovedRaw) {
        setQuoteData(previousData);
        return toast.error("Approval status not found");
      }

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', statusApprovedRaw.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success(`Status changed to ${String(statusApprovedRaw.name).toUpperCase()}`);
        // No need to full fetch if status is already correct
      } else {
        toast.error(res?.data?.message || "Failed to approve quote");
        setQuoteData(previousData);
      }
    } catch (error) {
      console.log('Approval error:', error);
      toast.error("Failed to approve quote");
      setQuoteData(previousData);
    }
  };

  const handleRejected = async (quoteId: string) => {
    // Optimistic update
    const previousData = [...quoteData];
    const rejectedStatusRaw = statusList.find(s =>
      s.name?.toLowerCase() === 'rejected' || s.name?.toLowerCase() === 'reject'
    );

    setQuoteData(prev => prev.map(q => 
      q._id === quoteId ? { ...q, status: getInternalStatus(rejectedStatusRaw?.name || 'reject') } : q
    ));

    try {
      if (!rejectedStatusRaw) {
        setQuoteData(previousData);
        toast.error("Rejected status not found");
        return;
      }

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', rejectedStatusRaw.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success("Quote rejected successfully");
      } else {
        toast.error(res?.data?.message || "Failed to reject quote");
        setQuoteData(previousData);
      }
    } catch (error) {
      console.log('Rejection error:', error);
      toast.error("Failed to reject quote");
      setQuoteData(previousData);
    }
  };

  const handleDelivery = async (quoteId: string) => {
    // Optimistic update
    const previousData = [...quoteData];
    const deliveryStatusRaw = statusList.find((s: any) =>
      String(s.name || '').toLowerCase().includes('deliver')
    );

    setQuoteData(prev => prev.map(q => 
      q._id === quoteId ? { ...q, status: getInternalStatus(deliveryStatusRaw?.name || 'delivery') } : q
    ));

    try {
      if (!deliveryStatusRaw) {
        setQuoteData(previousData);
        return toast.error("Delivery status not found");
      }

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', deliveryStatusRaw.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success("Status changed to DELIVERY");
      } else {
        toast.error(res?.data?.message || "Failed to update status");
        setQuoteData(previousData);
      }
    } catch (error) {
      console.log('Delivery error:', error);
      toast.error("Failed to update status");
      setQuoteData(previousData);
    }
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
    setOpenDropdown(null);
  };

  // Convert a display status name to the internal enum stored in MongoDB
  // Backend stores: 'pending', 'approval', 'reject', 'complete', 'successful', 'delivery', 'active'
  const getInternalStatus = (name: string): string => {
    const s = (name || '').toLowerCase();
    if (s.includes('active')) return 'active';
    if (s.includes('approv')) return 'approval';
    if (s.includes('reject')) return 'reject';
    if (s.includes('complet') || s.includes('success') || s.includes('return')) return 'complete';
    if (s.includes('deliver')) return 'delivery';
    return 'pending';
  };

  // Convert selected status IDs → internal status strings for the API
  const resolveStatusValues = (selectedIds: string[]): string => {
    return selectedIds
      .map(id => {
        const found = statusList.find((s: any) => s.id === id);
        return found ? getInternalStatus(found.name) : null;
      })
      .filter(Boolean)
      .join(',');
  };

  const getSelectedLabel = (key: string) => {
    const value = pendingFilters[key as keyof typeof pendingFilters];
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    if (Array.isArray(value)) {
      switch (key) {
        case 'product_type':
          return value.map(v => productTypes.find(t => t.id === v)?.product_type).filter(Boolean).join(', ');
        case 'listing_type':
          return value.map(v => listingTypes.find(l => l.id === v)?.name).filter(Boolean).join(', ');
        case 'month':
          return value.map(v => months.find(m => m.id === v)?.month_name).filter(Boolean).join(', ');
        case 'status':
          return value.map(v => statusList.find(s => s.id === v)?.name).filter(Boolean).join(', ');
        default:
          return value.join(', ');
      }
    } else {
      return value;
    }
  };
  const applyFilters = () => {
    setFilters(pendingFilters);
    const params = getCurrentParams(pendingFilters);
    params.page = 1;
    params.limit = 10;

    console.log("🚀 ~ Applying filters:", params);
    console.log("🚀 ~ Current filter state:", pendingFilters);

    getQuoteData(params);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    // Reset all filter states
    const resetFilters = {
      product_type: [],
      listing_type: [],
      delivery_start_date: '',
      delivery_end_date: '',
      month: [],
      status: [],
    };
    setPendingFilters(resetFilters);
    setFilters(resetFilters);
    setSearchText('');

    // Immediately fetch data with no filters
    getQuoteData({});
    setShowFilterModal(false);
  };

  // const showInitialLoader = loading && quoteData.length === 0;

  // Export functions
  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = getCurrentParams();

      await exportQuotesToExcel(params);
      toast.success('Quotes exported to Excel successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export quotes to Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = getCurrentParams();

      await exportQuotesToPDF(params);
      toast.success('Quotes exported to PDF successfully!');
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export quotes to PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    // Search automatically triggers a fetch with all current applied filters
    const params = getCurrentParams();
    params.page = 1;
    params.limit = 10;
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
    // Load initial data without filters
    getQuoteData({});
  }, []);

  const getRowStyle = (params: any) => {
    if (!params.data || !params.data.end_date || params.data.end_date === '-') return undefined;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse DD/MM/YYYY
      const parts = params.data.end_date.split('/');
      if (parts.length !== 3) return undefined;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      const endDate = new Date(year, month, day);
      endDate.setHours(0, 0, 0, 0);

      const status = (params.data.status || '').toLowerCase();
      const isCompleted = status.includes('complet') || status.includes('success') || status.includes('return');

      // 1. If end_date is today -> Light Green
      if (endDate.getTime() === today.getTime()) {
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)' }; // Light Green (Emerald)
      }

      // 2. If end_date < today AND status is not complete -> Light Red
      if (endDate.getTime() < today.getTime() && !isCompleted) {
        return { backgroundColor: 'rgba(244, 63, 94, 0.15)' }; // Light Red (Rose)
      }
    } catch (e) {
      console.error("Error calculating row style:", e);
    }

    return undefined;
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-2 mt-5 !justify-end">
        {/* <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Quotes</h2> */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 ">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full sm:w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <MdClose size={18} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="w-full sm:w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md border-gray-300 border-1 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              <CiFilter size={20} />
              {/* <span className="hidden sm:inline">Filter </span> */}
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterModal && (
              <div ref={dropdownRef} className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[calc(100vw-32px)] sm:w-[320px] z-50 border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
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
                        options={productTypes.map((t: any) => ({ label: t.product_type, value: String(t.id) }))}
                        value={pendingFilters.product_type[0] || null}
                        onChange={(value) => handleFilterChange('product_type', value ? [value] : [])}
                        placeholder="Select Product Type"
                      />
                    </div>

                    {/* Listing Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Listing Type</label>
                      <MultiSelectDropdown
                        options={listingTypes.map((lt: any) => ({ label: lt.name, value: String(lt.id) }))}
                        selectedValues={pendingFilters.listing_type}
                        onChange={(values) => handleFilterChange('listing_type', values)}
                        placeholder="Select Listing Types"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ">Start Date</label>
                      <DatePicker
                        value={pendingFilters.delivery_start_date}
                        onChange={(date) => handleFilterChange("delivery_start_date", date)}
                        width="100%"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <DatePicker
                        value={pendingFilters.delivery_end_date}
                        min={pendingFilters.delivery_start_date}
                        onChange={(date) => handleFilterChange("delivery_end_date", date)}
                        width="100%"
                      />
                    </div>

                    {/* Month */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Month</label>
                      <MultiSelectDropdown
                        options={months.map((m: any) => ({ label: m.month_name, value: String(m.id) }))}
                        selectedValues={pendingFilters.month}
                        onChange={(values) => handleFilterChange('month', values)}
                        placeholder="Select Months"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <MultiSelectDropdown
                        options={statusList.map((s: any) => ({ label: s.name, value: String(s.id) }))}
                        selectedValues={pendingFilters.status}
                        onChange={(values) => handleFilterChange('status', values)}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={clearFilters} className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium">
                      Clear All
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
              className="w-full sm:w-10 h-10 flex items-center justify-center  bg-white dark:bg-gray-800  border-gray-300 border-1 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
              title="Export options"
            >
              <FiMoreVertical className="text-xl" />
            </button>

            {showActionsMenu && (
              <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-3 w-auto sm:w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Export Section */}


                <div className="py-1">
                  {/* Export to Excel */}
                  <button
                    onClick={handleExportExcel}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to Excel</span>
                    {excelLoading && <Loader className="ml-auto text-emerald-600 w-3.5 h-3.5" />}
                  </button>

                  {/* Export to PDF */}
                  <button
                    onClick={handleExportPDF}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to PDF</span>
                    {pdfLoading && <Loader className="ml-auto text-rose-600 w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <AgGridTable
            columns={columns}
            rowData={quoteData}
            filter={false}
            tableName="Quotes"
            onSelectionChange={setSelectedRows}
            rowHeight={60}
            showCheckboxes={false}
            loading={loading}
            height={"650px"}
            getRowStyle={getRowStyle}
          />
        </div>
      </div>
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
