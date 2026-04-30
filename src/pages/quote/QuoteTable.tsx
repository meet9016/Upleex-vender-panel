"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { FaFileInvoice } from 'react-icons/fa';
import BillingInvoice from '@/components/invoice/BillingInvoice';

const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='30' y='30' font-family='Arial' font-size='8' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

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
  isNew?: boolean;
  has_reviewed?: boolean;
  review_details?: any;
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<any[]>([]);
  const [groupedQuotes, setGroupedQuotes] = useState<any[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  const handleBulkDownloadPdf = async () => {
    try {
      setInvoiceLoading(true);
      
      // Download each quote invoice separately via backend
      for (const quote of groupedQuotes) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/invoice/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            data: quote,
            vendorProfile,
            type: 'quote'
          })
        });
        
        if (!response.ok) throw new Error('Failed to generate PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const quoteId = quote._id || quote.id || 'quote';
        link.download = `Quotation-${quoteId.slice(-8).toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('All quotations downloaded successfully!');
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      toast.error('Failed to generate bulk PDF');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleBulkInvoiceDownload = async () => {
    // Filter valid quotes from selection
    const validSelection = selectedQuotes.filter(quote => {
      if (quote?.type === 'customer') return false;
      // For quotes, we might not have a "Completed" status in the same way, 
      // but we filter based on existence and type
      return quote?._id || quote?.id;
    });

    if (validSelection.length === 0) {
      toast.warning('No valid items in selection');
      return;
    }
    
    try {
      setInvoiceLoading(true);
      setIsBulkPrinting(true);
      
      if (!vendorProfile) {
        const profileRes = await api.get(endPointApi.postFetchVendorKYCFormData as string);
        if (profileRes.data?.status == "200") {
          const data = profileRes.data.data;
          const getFirstIfArray = (val: any) => Array.isArray(val) ? val[0] : val;
          const contact = getFirstIfArray(data.ContactDetails) || {};
          const identity = getFirstIfArray(data.Identity) || {};
          const documents = getFirstIfArray(data.Documents) || {};
          
          setVendorProfile({
            business_name: identity?.business_name || data.business_name || data.businessName || '',
            gst_number: identity?.gst_number || data.gst_number || '',
            business_logo_image: documents?.business_logo_image || data.business_logo_image || '',
            address: contact?.address || data.address || '',
            city: contact?.city_name || data.city_name || data.city || '',
            state: contact?.state_name || data.state_name || data.state || '',
            pincode: contact?.pincode || data.pincode || '',
            mobile: contact.mobile || data.mobile || '',
            email: contact.email || data.email || ''
          });
        }
      }

      const detailedQuotes = await Promise.all(
        validSelection.map(async (quote) => {
          const quoteId = quote._id;
          const res = await api.get(`${endPointApi.getQuoteById}/${quoteId}`);
          return res.data?.success ? (res.data.data?.quote || res.data.data) : quote;
        })
      );

      // Group quotes by user_id
      const groups: { [key: string]: any } = {};
      detailedQuotes.forEach((quote: any) => {
        const userId = quote.user_id?._id || quote.user_id?.id || quote.user_id || 'unknown';
        if (!groups[userId]) {
          groups[userId] = {
            ...quote,
            items: [quote], // Quotes are usually single product, but we treat them as items
            total_price: Number(quote.total_price || quote.calculated_price || 0)
          };
          groups[userId].quote_id = quote._id; 
        } else {
          // Append as another item
          groups[userId].items = [...groups[userId].items, quote];
          groups[userId].total_price += Number(quote.total_price || quote.calculated_price || 0);
          // Combine IDs
          if (!groups[userId].quote_id.includes(quote._id)) {
            groups[userId].quote_id += `, ${quote._id}`;
          }
        }
      });

      const finalGroupedQuotes = Object.values(groups);
      setGroupedQuotes(finalGroupedQuotes);
      setShowInvoiceModal(true);
      setTimeout(() => {
        setInvoiceLoading(false);
      }, 500);

    } catch (error) {
      console.error('Error in bulk download:', error);
      toast.error('Failed to prepare bulk quotations');
      setIsBulkPrinting(false);
      setInvoiceLoading(false);
    }
  };

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
      } else if (quote.months_id && product.month_arr && Array.isArray(product.month_arr)) {
        // Monthly product - calculate from month_arr
        const month = product.month_arr.find((m: any) =>
          m.months_id === quote.months_id || m.product_months_id === quote.months_id
        );
        if (month) {
          unitPrice = month.price || '0';
          totalPrice = (parseFloat(month.price || '0') * parseInt(quote.qty || '1')).toString();
        }
      } else {
        // Daily/Hourly product - calculate from base price
        unitPrice = product.price || '0';
        const days = parseInt(quote.number_of_days || '1');
        const qty = parseInt(quote.qty || '1');
        totalPrice = (parseFloat(unitPrice) * days * qty).toString();
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

  // Flatten Data for Tree Data Structure
  const rowDataFlat = useMemo(() => {
    const flat: any[] = [];
    const groups: { [key: string]: any } = {};

    quoteData.forEach((quote: any) => {
      let customerId = 'unknown';
      let customerName = 'Unknown Customer';
      let customerEmail = '';

      // Check if user_id is populated
      if (typeof quote.user_id === 'object' && quote.user_id !== null && quote.user_id.name) {
        customerId = quote.user_id._id || quote.user_id.id || 'unknown';
        customerName = quote.user_id.name;
        customerEmail = quote.user_id.email || '';
      } 
      // Fallback to review_details.user_id if populated
      else if (quote.review_details?.user_id && typeof quote.review_details.user_id === 'object') {
        customerId = quote.review_details.user_id._id || quote.review_details.user_id.id || quote.user_id;
        customerName = quote.review_details.user_id.name || 'Unknown Customer';
        customerEmail = quote.review_details.user_id.email || '';
      } 
      // Fallback for string user_id
      else {
        customerId = typeof quote.user_id === 'string' ? quote.user_id : (quote.user_id?._id || 'unknown');
      }

      console.log("customer fallback resolved:", customerName);
      if (!groups[customerId]) {

         groups[customerId] = {
           id: customerId,
           type: 'customer',
           name: customerName,
           email: customerEmail,
           path: [customerId.toString()],
         };
         flat.push(groups[customerId]);
      }
      
      flat.push({
        ...quote,
        type: 'quote',
        path: [customerId.toString(), (quote._id || quote.id || '').toString()]
      });
    });

    return flat;
  }, [quoteData]);

  const autoGroupColumnDef = useMemo(() => ({
    headerName: "Customer / Product",
    field: "product_name",
    minWidth: 280,
    cellStyle: { textAlign: "left" },
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (props: any) => {
        const { data } = props;
        if (data?.type === "customer") {
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <span className="text-indigo-600 font-bold text-sm">
                  {data.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col justify-center leading-tight py-0.5">
                <div className="text-[13px] font-bold text-gray-900 leading-tight dark:text-white">{data.name}</div>
                <div className="text-[11px] text-gray-500 font-medium">{data.email}</div>
              </div>
            </div>
          );
        }
        
        const imageUrl = data?.product_main_image;
        const productName = data?.product_name;

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
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PLACEHOLDER;
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
                {data?.category_name || ''}
              </span>
            </div>
          </div>
        );
      },
    },
  }), []);

  const columns = useMemo((): ColDef[] => {
    return [
      {
        field: "product_type_name",
        headerName: "Product Type",
        minWidth: 120,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "product_listing_type_name",
        headerName: "Product Listing Type",
        minWidth: 220,
        cellStyle: { textAlign: "left" }
      },

      {
        field: "month_name",
        headerName: "Month",
        minWidth: 120,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "qty",
        headerName: "Qty",
        minWidth: 100,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "price",
        headerName: "Unit Price",
        minWidth: 120,
        cellStyle: { textAlign: "left" },
        valueFormatter: (params) => {
          const value = params.value;
          if (!value || value === '0') return "₹0";
          return `₹${Number(value).toLocaleString('en-IN')}`;
        },
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
        cellRenderer: (params: any) => {
          if (params.data?.type === 'customer') return null;
          return (
            <div className="flex items-center h-full">
               <StatusBadge status={params.value || 'pending'} />
            </div>
          );
        },
      },
      {
        field: "payment_status",
        headerName: "Customer Payment",
        minWidth: 140,
        cellStyle: { textAlign: "left" },
        cellRenderer: (params: any) => {
          if (params.data?.type === 'customer') return null;
          return (
            <div className="flex items-center h-full">
              <StatusBadge status={params.value || 'pending'} />
            </div>
          );
        }
      },
      {
        field: "payment_status_info.payment_status",
        headerName: "Admin Payment",
        minWidth: 140,
        cellStyle: { textAlign: "left" },
        cellRenderer: (params: any) => {
          if (params.data?.type === 'customer') return null;
          const paymentStatus = params.data.payment_status_info?.payment_status || 'no_payment';
          return (
            <div className="flex items-center h-full">
              <StatusBadge status={paymentStatus} />
            </div>
          );
        }
      },
      {
        field: "start_date",
        headerName: "Start Date",
        minWidth: 150,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "start_time",
        headerName: "Start Time",
        minWidth: 130,
        cellStyle: { textAlign: "left" },
        valueFormatter: (params) => {
          if (params.data?.type === 'customer') return '';
          return params.data?.product_listing_type_name === 'HOURLY' ? (params.value || '-') : '-';
        }
      },
      {
        field: "end_date",
        headerName: "End Date",
        minWidth: 150,
        cellStyle: { textAlign: "left" }
      },
      {
        field: "end_time",
        headerName: "End Time",
        minWidth: 130,
        cellStyle: { textAlign: "left" },
        valueFormatter: (params) => {
          if (params.data?.type === 'customer') return '';
          return params.data?.product_listing_type_name === 'HOURLY' ? (params.value || '-') : '-';
        }
      },
      {
        field: "razorpay_payment_link",
        headerName: "Payment Link",
        minWidth: 160,
        cellRenderer: (params: any) => {
          if (params.data?.type === 'customer') return null;
          const link = params.value;
          const isPaid = String(params.data?.payment_status || '').toLowerCase() === 'paid';

          if (!link) return <span className="text-gray-400">-</span>;

          if (isPaid) {
            return (
              <div className="flex items-center h-full">
                <span
                  className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full border border-gray-200 inline-block font-medium truncate max-w-[140px] cursor-not-allowed select-none"
                  title="Payment already completed"
                >
                  Copy Link
                </span>
              </div>
            );
          }

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
        width: 180,
        minWidth: 180,
        pinned: 'right',
        suppressHeaderMenuButton: true,

        cellRenderer: (params: any) => {
          if (params.data?.type === 'customer') return null;
          const status = params.data?.status?.toLowerCase();
          const isApproved = status === 'approval' || status === 'approved';
          const isRejected = status === 'reject' || status === 'rejected';
          const isCompleted = status === 'complete' || status === 'completed' || status === 'successful' || status === 'success';
          const isDelivery = status === 'delivery';
          const isDisabled = isApproved || isRejected || isCompleted || isDelivery;
          const isPaid = params.data?.payment_status?.toLowerCase() === 'paid';

          return (
            <div className="flex items-center justify-start gap-2 h-full">
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


             <button
              onClick={() => handleGenerateBill(params.data)}
              disabled={!(isPaid && isCompleted)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl shadow-sm transition-all duration-200
                ${
                  isPaid && isCompleted
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              title="Generate Bill"
              type="button"
            >
              <FaFileInvoice className="text-base" />
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
  }, [quoteData]);


  const handleGenerateBill = async (quote: Quote) => {
    const quoteId = quote._id;
    if (!quoteId) {
      toast.error('Quote ID is missing. Cannot generate bill.');
      return;
    }

    try {
      setInvoiceLoading(true);
      setShowInvoiceModal(true);

      // Fetch full quote details and vendor profile concurrently
      const [quoteRes, profileRes] = await Promise.all([
        api.get(`${endPointApi.getQuoteById}/${quoteId}`),
        vendorProfile ? Promise.resolve(null) : api.get(endPointApi.postFetchVendorKYCFormData as string)
      ]);
      console.log("quoteRes--", quoteRes);
      console.log("profileRes--", profileRes);
      if (quoteRes.data?.success) {
        const rawData = quoteRes.data.data;
        // Handle potential nesting in single-fetch response
        const quoteData = rawData?.quote || rawData?.data || rawData;
        setSelectedQuote(quoteData);
      } else {
        throw new Error(quoteRes.data?.message || 'Failed to fetch quote details');
      }

      if (profileRes && profileRes.data?.status == "200") {
        const data = profileRes.data.data;
        // Extract KYC details robustly (can be array or single object)
        const getFirstIfArray = (val: any) => Array.isArray(val) ? val[0] : val;
        
        const contact = getFirstIfArray(data.ContactDetails) || {};
        const identity = getFirstIfArray(data.Identity) || {};
        const documents = getFirstIfArray(data.Documents) || {};
        console.log("contact--", contact);
        console.log("identity--", identity);
        setVendorProfile({
          business_name: identity?.business_name  || data.business_name || data.businessName || '',
          gst_number: identity?.gst_number || data.gst_number || '',
          business_logo_image: documents?.business_logo_image || data.business_logo_image || '',
          address: contact?.address || data.address || '',
          city: contact?.city_name || data.city_name || data.city || '',
          state: contact?.state_name || data.state_name || data.state || '',
          pincode: contact?.pincode || data.pincode || '',
          mobile: contact.mobile || data.mobile || '',
          email: contact.email || data.email || ''
        });
      }
    } catch (error: any) {
      console.error('Error generating bill:', error);
      toast.error(error.message || 'Error generating bill. Please try again.');
      setShowInvoiceModal(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const getQuoteData = async (filterParams: any = {}) => {
    try {
      setLoading(true);
      // Build query params
      const params = { ...filterParams };

      const res = await api.get(endPointApi.postGetQuote, { params });

      if (res?.data?.success && res?.data?.data) {
        const transformedData = transformQuoteData(res.data.data);
        setQuoteData(transformedData);
      }
    } catch (error) {
      toast.error("Failed to fetch quotes");
    } finally {
      setLoading(false);
    }
  };

  // Remove unused getCategoriesData function

  const getDropdownData = async () => {
    try {
      const res = await api.post(endPointApi.postProductDropDownList);

      // Check for success flag instead of status
      if (res?.data?.success === true) {
        const data = res.data; // Data is at root level
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
    // If isNew is true -> Light Yellow 
    if (params.data?.isNew === true && String(params.data?.status || '').toLowerCase() === 'pending') {
      return { backgroundColor: 'rgba(253, 230, 138, 0.4)' }; 
    }

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
      const paymentStatus = String(params.data.payment_status || '').toLowerCase();
      const status = (params.data.status || '').toLowerCase();
      const isCompleted = status.includes('complet') || status.includes('success') || status.includes('return');

      // 2. If end_date is today -> Light Green
      if (endDate.getTime() === today.getTime() && paymentStatus === 'paid' && status.includes('delivery')) {
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)' }; // Light Green (Emerald)
      }

      // 3. If end_date < today AND status is not complete -> Light Red
      if (endDate.getTime() < today.getTime() && !isCompleted && status.includes('delivery')) {
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
              <ColorLegend />
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

                    {selectedQuotes.length > 0 && (
                      <button
                        onClick={handleBulkInvoiceDownload}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200"
                      >
                        <FaFileInvoice className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Download Invoices ({selectedQuotes.filter(q => q.type !== 'customer').length})</span>
                      </button>
                    )}
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
            rowData={rowDataFlat}
            treeData={true}
            getDataPath={(data: any) => data.path}
            autoGroupColumnDef={autoGroupColumnDef}
            groupDefaultExpanded={0}
            getRowId={(params: any) => params.data.type === 'customer' ? `cust-${params.data.id}` : `quote-${params.data._id || params.data.id}`}
            filter={false}
            tableName="Quotes"
            onSelectionChange={(selected) => setSelectedQuotes(selected)}
            rowHeight={60}
            showCheckboxes={true}
            loading={loading}
            height={"650px"}
            getRowStyle={getRowStyle}
            noRowsMessage="no Quote found"
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

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInvoiceModal(false);
              setIsBulkPrinting(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl my-8 cursor-default">
            {invoiceLoading ? (
              <div className="bg-white dark:bg-gray-800 p-20 rounded-xl flex flex-col items-center justify-center shadow-2xl relative">
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setIsBulkPrinting(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Loader className="w-10 h-10 text-blue-600 mb-4" />
                <p className="text-gray-900 dark:text-white font-medium">Preparing your quotation{isBulkPrinting ? 's' : ''}...</p>
              </div>
            ) : isBulkPrinting ? (
                <div className="space-y-8 relative">
                   <div className="sticky top-0 z-20 flex justify-end pr-4 pt-4 h-0">
                      <button
                        onClick={() => {
                          setShowInvoiceModal(false);
                          setIsBulkPrinting(false);
                        }}
                        className="bg-white rounded-full p-2 shadow-lg text-gray-400 hover:text-gray-600 transition-colors no-print"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                   </div>
                <div className="space-y-8">
                  {groupedQuotes.map((quote, idx) => (
                    <div key={idx} className="break-after-page mb-8">
                      <BillingInvoice 
                        data={quote} 
                        vendorProfile={vendorProfile} 
                        type="quote"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <BillingInvoice 
                  data={selectedQuote} 
                  vendorProfile={vendorProfile} 
                  type="quote"
                  onDownloadPdf={() => {
                    window.print();
                  }}
                  onClose={() => {
                    setShowInvoiceModal(false);
                    setIsBulkPrinting(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteTable;

const ColorLegend = () => (
  <div className="flex flex-wrap items-center text-xs sm:text-sm">
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-full">
      <span className="w-2.5 h-2.5 rounded-full bg-[#e1f4ee] border border-green-300  shadow-sm shadow-green-200"></span>
      <span className="text-gray-700 dark:text-gray-300 font-medium">Due Today</span>
    </div>
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-full">
      <span className="w-2.5 h-2.5 rounded-full bg-[#fef6d0] border border-yellow-300 shadow-sm shadow-yellow-200"></span>
      <span className="text-gray-700 dark:text-gray-300 font-medium">New Quote</span>
    </div>
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-full">
      <span className="w-2.5 h-2.5 rounded-full bg-[#fee3e7] border border-red-300 shadow-sm shadow-red-200"></span>
      <span className="text-gray-700 dark:text-gray-300 font-medium">Late Return</span>
    </div>
  </div>
);
