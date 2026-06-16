"use client";
import React, { useEffect, useState, useRef } from 'react';
import { ColDef } from 'ag-grid-community';
import AgGridTable from '@/components/tables/AgGridTable';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';
import { MdPayment, MdShoppingCart, MdDateRange, MdPending, MdCheckCircle, MdCancel, MdSearch, MdClose } from 'react-icons/md';
import { FaRupeeSign, FaUser, FaBox, FaEdit, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { FiRefreshCw, FiMoreVertical } from 'react-icons/fi';
import { CiFilter } from "react-icons/ci";
import ComponentCard from '@/components/common/ComponentCard';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown';
import Label from '@/components/form/Label';
import { HiOutlineEye } from 'react-icons/hi';
import ActionButtons from '@/components/common/ActionButtons';
import { useRouter } from 'next/navigation';
import StatusBadge from '../../components/common/StatusBadge';
import { exportOrdersToExcel, exportOrdersToPDF } from '@/utils/exportUtils';
import Loader from '@/components/common/Loader';
import { FaFileInvoice } from 'react-icons/fa';
import BillingInvoice from '@/components/invoice/BillingInvoice';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/*
interface PaymentOrder {
  order_id: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
  vendor_amount: number;
  payment_type: string;
  payment_status: string;
  paid_at: string | null;
  order_status: string;
  razorpay_payment_id: string;
}
*/

interface VendorOrder {
  _id?: string;
  id?: string;
  type?: string;
  order_id: string;
  delivery_type?: string;
  user_id: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product_id?: {
      name?: string;
      images?: Array<{
        url?: string;
        product_image_id?: string;
      }> | string[];
      sku?: string;
    };
    product_name?: string;
    name?: string;
    product_image?: string;
    image?: string;
    images?: string[];
    sku?: string;
    quantity: number;
    price?: number;
    product_price?: number;
  }>;
  total_amount: number;
  payment_type?: string;
  vendor_status?: string;
  order_status?: string;
  payment_status: string;
  createdAt: string;
  delivery_tracking?: {
    delivery_updates: Array<{
      status: string;
      message: string;
      timestamp: string;
    }>;
  };
}

interface OrderStats {
  total_orders: number;
  total_earnings: number;
  pending_payments: number;
  completed_payments: number;
  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

interface StatusOption {
  value: string;
  label: string;
}

const OrderList = () => {
  const router = useRouter();
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    total_earnings: 0,
    pending_payments: 0,
    completed_payments: 0,
    pending_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<VendorOrder[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 600);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);
  const filterModalRef = React.useRef<HTMLDivElement>(null);
  const filterButtonRef = React.useRef<HTMLButtonElement>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: '',
    product_name: '',
    sku: '',
    status: [] as string[],
  });

  const [pendingFilters, setPendingFilters] = useState({
    customer_name: '',
    product_name: '',
    sku: '',
    status: [] as string[],
  });

  const activeFilterCount = Object.values(filters).filter(v => 
    Array.isArray(v) ? v.length > 0 : v && v.trim() !== ''
  ).length;

  const editStatusOptions = statusOptions
    .map((opt: StatusOption) => {
      // Map labels as requested
      if (opt.value.toLowerCase() === 'accepted') return { ...opt, label: 'Approve' };
      if (opt.value.toLowerCase() === 'delivered') return { ...opt, label: 'Delivery' };
      return opt;
    });

  // Face to Face orders: only show Pending, Approve (accepted), Complete
  const FACE_TO_FACE_ONLY_STATUSES = ['pending', 'accepted', 'completed'];

  // Shipping orders: hide Pending/Approve/Complete — show rest but all disabled
  const SHIPPING_HIDDEN_STATUSES = ['pending', 'accepted', 'completed'];

  const getStatusOptionsForModal = (order: VendorOrder | null) => {
    const isShipping = order?.delivery_type === 'shipping';

    if (!isShipping) {
      // Face to Face: show ONLY pending, accepted (Approve), completed
      return editStatusOptions
        .filter((opt) => FACE_TO_FACE_ONLY_STATUSES.includes(opt.value.toLowerCase()))
        .map((opt) => ({ ...opt, disabled: false }));
    } else {
      // Shipping: hide pending/accepted/completed, show rest but all disabled
      return editStatusOptions
        .filter((opt) => !SHIPPING_HIDDEN_STATUSES.includes(opt.value.toLowerCase()))
        .map((opt) => ({ ...opt, disabled: true }));
    }
  };

  const getCurrentParams = () => {
    const params: any = {};
    if (filters.status && filters.status.length > 0) {
      params.status = filters.status.join(',');
    }
    if (filters.customer_name && filters.customer_name.trim() !== '') {
      params.customer_name = filters.customer_name.trim();
    }
    if (filters.product_name && filters.product_name.trim() !== '') {
      params.product_name = filters.product_name.trim();
    }
    if (filters.sku && filters.sku.trim() !== '') {
      params.sku = filters.sku.trim();
    }
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }
    return params;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready_for_pickup':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'picked_up':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Payment History Columns



  /*
  const paymentColumns: ColDef[] = [
    {
      headerName: "Order ID",
      field: "order_id",
      minWidth: 150,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="font-mono text-blue-600 font-semibold">
          #{params.value}
        </div>
      ),
    },
    {
      headerName: "Customer",
      field: "customer_name",
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: any) => (
        <div className="flex flex-col justify-center h-full leading-tight py-0.5">
          <span className="text-[13px] font-medium text-gray-800 dark:text-white truncate block">
            {params.data?.customer_name || '-'}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block mt-0.5">
            {params.data?.customer_email || '-'}
          </span>
        </div>
      ),
    },
    {
      headerName: "Items",
      field: "items_count",
      minWidth: 100,
      flex: 0.8,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {params.value}
          </span>
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Amount",
      field: "vendor_amount",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="font-semibold text-green-600 text-center">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Payment Status",
      field: "payment_status",
      minWidth: 140,
      flex: 1,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Paid On",
      field: "paid_at",
      minWidth: 120,
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '-';
      },
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Date",
      field: "order_date",
      minWidth: 120,
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '-';
      },
      cellStyle: { textAlign: "center" }
    },
  ];
  */

  // Flatten Data for Tree Data Structure
  const rowDataFlat = React.useMemo(() => {
    const flat: any[] = [];
    const groups: { [key: string]: any } = {};

    vendorOrders.forEach((order: any) => {
      const customer = typeof order.user_id === 'object' && order.user_id !== null ? order.user_id : {};
      const customerId = customer._id || customer.id || (typeof order.user_id === 'string' ? order.user_id : 'unknown');
      const customerName = customer.name || 'Unknown Customer';
      const customerEmail = customer.email || '';

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
        ...order,
        type: 'order',
        path: [customerId.toString(), (order._id || order.id || '').toString()]
      });
    });

    return flat;
  }, [vendorOrders]);

  const autoGroupColumnDef = React.useMemo(() => ({
    headerName: "Customer / Order ID",
    field: "name",
    minWidth: 280,
    cellStyle: { textAlign: "left" },
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (props: any) => {
        const { data } = props;
        if (data?.type === "customer") {
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 ">
                <span className="text-indigo-600 font-bold text-sm">
                  {data.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col justify-center leading-tight py-0.5">
                <div className="text-[13px] font-bold text-gray-900 leading-tight dark:text-white ">{data.name}</div>
                <div className="text-[11px] text-gray-500 font-medium">{data.email}</div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="font-mono text-blue-600 font-semibold ml-2">
            #{data?.order_id || '-'}
          </div>
        );
      },
    },
  }), []);

  // Vendor Orders Columns
  const vendorColumns: ColDef[] = [
    {
      headerName: "Items",
      field: "items",
      minWidth: 80,
      flex: 0.2,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        return (
          <div className="flex items-center h-full">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {params.value?.length || 0}
            </span>
          </div>
        );
      },
    },
    {
      headerName: "Product Name",
      field: "items",
      minWidth: 200,
      flex: 1.5,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        const items = params.value || [];
        const productNames = items.map((item: any) => item.product_id?.name || item.product_name || item.name || '-').join(', ');
        return (
          <div className="text-gray-800 dark:text-white text-sm">
            {productNames || '-'}
          </div>
        );
      },
    },
    {
      headerName: "SKU",
      field: "items",
      minWidth: 150,
      flex: 1,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        const items = params.value || [];
        const skus = items.map((item: any) => item.product_id?.sku || item.sku || '-').join(', ');
        return (
          <div className="font-mono text-gray-800 dark:text-white text-sm">
            {skus || '-'}
          </div>
        );
      },
    },
    {
      headerName: "Amount",
      field: "total_amount",
      minWidth: 100,
      flex: 1,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        return (
          <div className="font-semibold text-green-600">
            ₹{Number(params.value || 0).toLocaleString('en-IN')}
          </div>
        );
      },
    },
    {
      headerName: "Order Status",
      field: "vendor_status",
      minWidth: 120,
      flex: 1.2,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        return <StatusBadge status={params.value} />;
      },
    },
    {
      headerName: "Customer Payment",
      field: "payment_status",
      minWidth: 150,
      flex: 1,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        return <StatusBadge status={params.value} />;
      },
    },
    {
      headerName: "Admin Payment",
      field: "payment_status_info.payment_status",
      minWidth: 120,
      flex: 1,
      cellStyle: { textAlign: "left" },
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        const paymentStatus = params.data.payment_status_info?.payment_status || '-';
        return <StatusBadge status={paymentStatus} />;
      },
    },
    {
      headerName: "Date",
      field: "createdAt",
      minWidth: 120,
      flex: 1,
      cellStyle: { textAlign: "left" },
      valueFormatter: (params) => {
        if (params.data?.type === 'customer') return '';
        return params.value ? new Date(params.value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '';
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 140,
      maxWidth: 140,
      suppressSizeToFit: true,
      pinned: "right",
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        if (params.data?.type === 'customer') return null;
        const isPaid = params.data.payment_status?.toLowerCase() === 'paid';
        const isCompleted = params.data.vendor_status?.toLowerCase() === 'delivered' || params.data.vendor_status?.toLowerCase() === 'completed';
        
        return (
          <div className="flex items-center justify-left gap-2 h-full">
            <button
              onClick={() => {
                handleViewOrder(params.data);
              }}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
              title="View Details"
              type="button"
            >
              <HiOutlineEye size={17} />
            </button>

            <button
              onClick={() => {
                if (isPaid && isCompleted) {
                  handleDownloadInvoice(params.data);
                }
              }}
              disabled={!isPaid || !isCompleted}
              className={`p-1.5 rounded-lg border shadow-sm transition-all ${
                isPaid && isCompleted 
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" 
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
              }`}
              title={isPaid && isCompleted ? "Generate Bill" : "Bill available after Payment & Delivery"}
              type="button"
            >
              <FaFileInvoice size={17} />
            </button>

            <ActionButtons
              onEdit={() => handleUpdateStatus(params.data)}
            />
          </div>
        );
      },
    }
  ];



  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      const filterParams = getCurrentParams();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filterParams
      });

      const response = await api.get(`${endPointApi.getVendorOrders}?${params}`);

      if (response.data.success) {
        setVendorOrders(response.data.data.orders || []);
        setTotalPages(response.data.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await api.get(endPointApi.getVendorOrderStatusOptions);
      if (response.data.success) {
        setStatusOptions(response.data.data.statusOptions || []);
      }
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  };


  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [groupedOrders, setGroupedOrders] = useState<any[]>([]);

  const handleBulkDownloadPdf = async () => {
    try {
      setInvoiceLoading(true);
      
      // Filter only Paid & Completed orders for bulk download
      const validOrders = groupedOrders.filter(order => {
        const isPaid = order?.payment_status?.toLowerCase() === 'paid';
        const isCompleted = order?.vendor_status?.toLowerCase() === 'delivered' || order?.vendor_status?.toLowerCase() === 'completed';
        return isPaid && isCompleted;
      });

      if (validOrders.length === 0) {
        toast.warning('No valid Paid & Completed orders selected');
        setInvoiceLoading(false);
        return;
      }

      // Download each invoice separately via backend
      for (const order of validOrders) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/invoice/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            data: order,
            vendorProfile,
            type: 'order'
          })
        });
        
        if (!response.ok) throw new Error('Failed to generate PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const orderId = order.order_id || order._id || 'invoice';
        link.download = `Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('All invoices downloaded successfully!');
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      toast.error('Failed to generate bulk PDF');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleBulkInvoiceDownload = async () => {
    // Filter only Paid & Completed orders from selection
    const validSelection = selectedOrders.filter(order => {
      if (order?.type === 'customer') return false; 
      const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid';
      const isCompleted = ['delivered', 'completed'].includes(String(order?.vendor_status || order?.order_status || '').toLowerCase());
      return isPaid && isCompleted;
    });

    if (validSelection.length === 0) {
      toast.warning('No valid Paid & Completed orders in selection');
      return;
    }
    
    try {
      setInvoiceLoading(true);
      setIsBulkPrinting(true);
      
      // Fetch vendor profile if not already fetched
      if (!vendorProfile) {
        const profileRes = await api.get(endPointApi.postFetchVendorKYCFormData as string);
        if (profileRes.data?.status == "200") {
          const data = profileRes.data.data;
          const getFirstIfArray = (val: any) => Array.isArray(val) ? val[0] : val;
          const contact = getFirstIfArray(data.ContactDetails) || {};
          const identity = getFirstIfArray(data.Identity) || {};
          const documents = getFirstIfArray(data.Documents) || {};
          
          setVendorProfile({
            business_name: identity.business_name || data.business_name || '',
            gst_number: identity.gst_number || data.gst_number || '',
            business_logo_image: documents.business_logo_image || data.business_logo_image || '',
            address: contact.address || data.address || '',
            city: contact.city_name || data.city_name || '',
            state: contact.state_name || data.state_name || '',
            pincode: contact.pincode || data.pincode || '',
            mobile: contact.mobile || data.mobile || '',
            email: contact.email || data.email || ''
          });
        }
      }

      // We need full details for each order to show in invoice
      const detailedOrders = await Promise.all(
        validSelection.map(async (order) => {
          const orderId = order?._id || order?.id;
          const res = await api.get(`${endPointApi.getVendorOrderDetails}/${orderId}`);
          return res.data?.success ? (res.data.data?.order || res.data.data) : order;
        })
      );

      // re-filter detailed orders just in case fresh data changed
      const finalOrdersToProcess = detailedOrders.filter(order => {
        const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid';
        const isCompleted = ['delivered', 'completed'].includes(String(order?.vendor_status || order?.order_status || '').toLowerCase());
        return isPaid && isCompleted;
      });

      if (finalOrdersToProcess.length === 0) {
        toast.warning('None of the fetched orders are currently Paid & Completed');
        setInvoiceLoading(false);
        setIsBulkPrinting(false);
        return;
      }

      // Group orders by user_id
      const groups: { [key: string]: any } = {};
      finalOrdersToProcess.forEach((order: any) => {
        const userId = order.user_id?._id || order.user_id?.id || order.user_id || 'unknown';
        if (!groups[userId]) {
          groups[userId] = {
            ...order,
            items: [...(order.items || [])],
            total_amount: Number(order.total_amount || 0)
          };
          // If it's a grouped order, we might want to clear specific order IDs or show multiple
          groups[userId].order_id = order.order_id; 
        } else {
          // Append items to existing group
          groups[userId].items = [...groups[userId].items, ...(order.items || [])];
          groups[userId].total_amount += Number(order.total_amount || 0);
          // Combine order IDs if they are different
          if (!groups[userId].order_id.includes(order.order_id)) {
            groups[userId].order_id += `, ${order.order_id}`;
          }
        }
      });

      const finalGroupedOrders = Object.values(groups);
      setGroupedOrders(finalGroupedOrders);
      setShowInvoiceModal(true);
      
      // We don't trigger print automatically now, user can see preview first
      setTimeout(() => {
        setInvoiceLoading(false);
      }, 500);

    } catch (error) {
      console.error('Error in bulk download:', error);
      toast.error('Failed to prepare bulk invoices');
      setIsBulkPrinting(false);
      setInvoiceLoading(false);
    }
  };

  const handleDownloadInvoice = async (order: VendorOrder) => {
    const orderId = order._id || order.id;
    if (!orderId) {
      toast.error('Order ID is missing. Cannot generate bill.');
      return;
    }

    try {
      setInvoiceLoading(true);
      setShowInvoiceModal(true); // Show modal immediately with loading state

      // Fetch full order details and vendor profile concurrently
      const [orderRes, profileRes] = await Promise.all([
        api.get(`${endPointApi.getVendorOrderDetails}/${orderId}`),
        vendorProfile ? Promise.resolve(null) : api.get(endPointApi.postFetchVendorKYCFormData as string)
      ]);
      if (orderRes.data?.success) {
        const rawData = orderRes.data.data;
        // Handle potential nesting in single-fetch response
        const orderData = rawData?.order || rawData?.data || rawData;
        setSelectedOrder(orderData);
      } else {
        throw new Error(orderRes.data?.message || 'Failed to fetch order details');
      }

      if (profileRes && profileRes.data?.status == "200") {
        const data = profileRes.data.data;
        // Extract KYC details robustly (can be array or single object)
        const getFirstIfArray = (val: any) => Array.isArray(val) ? val[0] : val;
        
        const contact = getFirstIfArray(data.ContactDetails) || {};
        const identity = getFirstIfArray(data.Identity) || {};
        const documents = getFirstIfArray(data.Documents) || {};
        
        setVendorProfile({
          business_name: identity.business_name  || data.business_name || '',
          gst_number: identity.gst_number || data.gst_number || '',
          business_logo_image: documents.business_logo_image || data.business_logo_image || '',
          address: contact.address || data.address || '',
          city: contact.city_name || data.city_name || '',
          state: contact.state_name || data.state_name || '',
          pincode: contact.pincode || data.pincode || '',
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

  const handleViewOrder = (order: VendorOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateStatus = (order: VendorOrder) => {

    if (!order) {
      toast.error('Order data is missing');
      return;
    }

    // Check for both _id and id fields
    const orderId = order._id || order.id;
    if (!orderId) {
      toast.error('Order ID is missing');
      return;
    }

    // Create normalized order with _id
    const normalizedOrder = {
      ...order,
      _id: orderId
    };

    setSelectedOrder(normalizedOrder);
    setNewStatus(order.vendor_status || order.order_status || 'pending');
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      toast.error('Order or status not selected');
      return;
    }

    if (!selectedOrder._id) {
      toast.error('Order ID is missing');
      return;
    }



    try {
      setLoading(true);

      // Make sure the URL is correct
      const response = await api.put(`${endPointApi.updateVendorOrderStatus}/${selectedOrder._id}/status`, {
        status: newStatus,
        notes: statusNotes
      });

      if (response.data.success) {
        toast.success('Order status updated successfully');
        setShowStatusModal(false);
        fetchVendorOrders(); // Refresh the orders list
        fetchStats(); // Refresh stats
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [paymentResponse, ordersResponse] = await Promise.all([
        api.get(`${endPointApi.getVendorPaymentHistory}?page=1&limit=100`),
        api.get(`${endPointApi.getVendorOrders}?page=1&limit=100`)
      ]);

      const paymentData = paymentResponse.data.data.payment_history || [];
      const ordersData = ordersResponse.data.data.orders || [];

      const totalEarnings = paymentResponse.data.data.total_earnings || 0;
      const completedPayments = paymentData.filter((order: any) => order.payment_status === 'paid').length;
      const pendingPayments = paymentData.filter((order: any) => order.payment_status === 'pending').length;

      const pendingOrders = ordersData.filter((order: VendorOrder) => order.vendor_status === 'pending').length;
      const deliveredOrders = ordersData.filter((order: VendorOrder) => order.vendor_status === 'delivered').length;
      const cancelledOrders = ordersData.filter((order: VendorOrder) => order.vendor_status === 'cancelled').length;

      setStats({
        total_orders: ordersData.length,
        total_earnings: totalEarnings,
        pending_payments: pendingPayments,
        completed_payments: completedPayments,
        pending_orders: pendingOrders,
        delivered_orders: deliveredOrders,
        cancelled_orders: cancelledOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrders = async () => {
    await fetchVendorOrders();
  };

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = getCurrentParams();
      /* if (activeTab === 'orders') { */
        await exportOrdersToExcel(params);
        toast.success('Orders exported to Excel successfully!');
      /* } else {
        await exportPaymentsToExcel(params);
        toast.success('Payments exported to Excel successfully!');
      } */
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = getCurrentParams();
      /* if (activeTab === 'orders') { */
        await exportOrdersToPDF(params);
        toast.success('Orders exported to PDF successfully!');
      /* } else {
        await exportPaymentsToPDF(params);
        toast.success('Payments exported to PDF successfully!');
      } */
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export to PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchStatusOptions();
  }, [page, filters, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statsCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: MdShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Earnings',
      value: `₹${stats.total_earnings.toLocaleString('en-IN')}`,
      icon: FaRupeeSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: /* activeTab === 'payments' ? 'Completed Payments' : */ 'Delivered Orders',
      value: /* activeTab === 'payments' ? stats.completed_payments : */ stats.delivered_orders,
      icon: /* activeTab === 'payments' ? MdPayment : */ MdCheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: /* activeTab === 'payments' ? 'Pending Payments' : */ 'Pending Orders',
      value: /* activeTab === 'payments' ? stats.pending_payments : stats.pending_orders */ stats.pending_orders,
      icon: /* activeTab === 'payments' ? MdDateRange : */ MdPending,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className=" sm:space-y-4  sm:p-0">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
            Orders Management
          </h1>
           <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your orders and track payment history
          </p> 
        </div>

      </div> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>

                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Section */}
      <div className="">
        {/* Header with Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2  ">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            {/* <button
             
              onClick={() => {
                setActiveTab('orders');
                setPage(1);
              }}
              
              className={`px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700`}
            >
              Orders
            </button> */}
             {/*
            <button
              onClick={() => {
                setActiveTab('payments');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200`}
            >
              Payments
            </button>
            */}
          </div>

          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto sm:flex-initial">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white flex-1 sm:w-64 min-w-[120px] text-sm h-10 w-full"
              />
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose size={18} />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => {
                  setPendingFilters(filters);
                  setShowFilterModal(!showFilterModal);
                }}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300"
              >
                <CiFilter size={20} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Modal */}
              {showFilterModal && (
                <div
                  ref={filterModalRef}
                  className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-24 sm:top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl w-auto sm:w-[320px] z-50 border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-140px)] overflow-y-auto transform origin-top-right transition-all duration-200 animate-in zoom-in-95"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4 pb-1 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Filter Orders
                      </h3>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <MdClose size={18} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Customer Name Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Customer Name</Label>
                        <input
                          type="text"
                          value={pendingFilters.customer_name}
                          onChange={(e) => setPendingFilters(prev => ({ ...prev, customer_name: e.target.value }))}
                          placeholder="Search customer..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Product Name Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Product Name</Label>
                        <input
                          type="text"
                          value={pendingFilters.product_name}
                          onChange={(e) => setPendingFilters(prev => ({ ...prev, product_name: e.target.value }))}
                          placeholder="Search product..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                          {/* Order Status Multi-select */}
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Order Status</Label>
                        <MultiSelectDropdown
                          options={statusOptions}
                          selectedValues={pendingFilters.status}
                          onChange={(values) => setPendingFilters(prev => ({ ...prev, status: values }))}
                          placeholder="Select Status"
                        />
                      </div>
                      {/* SKU Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">SKU</Label>
                        <input
                          type="text"
                          value={pendingFilters.sku}
                          onChange={(e) => setPendingFilters(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="Search SKU..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Status</Label>
                        <MultiSelectDropdown
                          options={statusOptions.map(s => ({ label: s.label, value: s.value }))}
                          selectedValues={pendingFilters.status}
                          onChange={(vals) => setPendingFilters(prev => ({ ...prev, status: vals }))}
                          placeholder="Select Status"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setPendingFilters({ customer_name: '', product_name: '', sku: '', status: [] });
                          setFilters({ customer_name: '', product_name: '', sku: '', status: [] });
                          setShowFilterModal(false);
                          setPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => {
                          setFilters(pendingFilters);
                          setShowFilterModal(false);
                          setPage(1);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={fetchVendorOrders}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300"
              title="Refresh"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Actions Menu (3-dots) */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setShowActionsMenu((v) => !v)}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300"
                title="Export options"
              >
                <FiMoreVertical className="text-xl" />
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 top-full mt-3 w-56 sm:w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top-right">

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

                    {selectedOrders.length > 0 && (
                      <button
                        onClick={handleBulkInvoiceDownload}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200"
                      >
                        <FaFileInvoice className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Download Invoices ({selectedOrders.filter(o => o.type !== 'customer' && String(o.payment_status || '').toLowerCase() === 'paid' && ['delivered', 'completed'].includes(String(o.vendor_status || o.order_status || '').toLowerCase())).length})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden sm:block overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <AgGridTable
              columns={vendorColumns}
              rowData={rowDataFlat}
              treeData={true}
              getDataPath={(data: any) => data.path}
              autoGroupColumnDef={autoGroupColumnDef}
              groupDefaultExpanded={0}
              getRowId={(params: any) => params.data?.type === 'customer' ? `cust-${params.data?.id}` : `order-${params.data?._id || params.data?.id}`}
              loading={loading}
              height={"580px"}
              tableName={'Orders'}
              filter={false}
              showCheckboxes={true}
              onSelectionChange={(selected) => setSelectedOrders(selected)}
              rowHeight={55}
              noRowsMessage='No orders found'
            />
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : vendorOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No orders found</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {vendorOrders.map((order: any) => {
                const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
                const isCompleted = ['delivered','completed'].includes((order.vendor_status || '').toLowerCase());
                const items = order.items || [];
                const productName = items.map((i: any) => i.product_id?.name || i.product_name || i.name || '-').join(', ');
                const productImg = items[0]?.product_image || items[0]?.image || '';
                const skus = items.map((i: any) => i.product_id?.sku || i.sku || '').filter(Boolean).join(', ');
                const adminPayment = order.payment_status_info?.payment_status || 'no_payment';
                return (
                  <div key={order._id || order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start gap-3 p-3">
                      {productImg ? (
                        <img src={productImg} alt={productName} className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0" onError={(e: any) => { e.target.src = ''; }} />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">No Img</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate flex-1">{productName}</p>
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">#{order.order_id}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5"><b>{order.user_id?.name || 'Customer'} </b>({order.user_id?.email || 'N/A'})</p>
                        {skus && <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {skus}</p>}
                      </div>
                    </div>

                    {/* Status Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-medium">Order:</span>
                        <StatusBadge status={order.vendor_status || 'pending'} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-medium">Payment:</span>
                        <StatusBadge status={order.payment_status || 'pending'} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-medium">Admin:</span>
                        <StatusBadge status={adminPayment} />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Amount</p>
                        <p className="text-[12px] font-bold text-green-600">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Items</p>
                        <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{items.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Date</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '-'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                      <button onClick={() => handleViewOrder(order)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100"><HiOutlineEye size={15} /></button>
                      <button onClick={() => { if (isPaid && isCompleted) handleDownloadInvoice(order); }} disabled={!isPaid || !isCompleted} className={`w-8 h-8 flex items-center justify-center rounded-lg border ${isPaid && isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'}`} title="Generate Bill"><FaFileInvoice size={13} /></button>
                      <button onClick={() => handleUpdateStatus(order)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100"><FaEdit size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-6 space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-9999 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrderModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Order Details : {selectedOrder.order_id}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Order Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
                    <StatusBadge status={selectedOrder.vendor_status || selectedOrder.order_status || 'pending'} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                    <div className="flex  gap-1">
                      <StatusBadge status={selectedOrder.payment_status || 'pending'} />
                      {/* {selectedOrder.payment_status === 'hold' && (
                        <p className="text-[10px] text-amber-600 font-bold leading-tight">
                          Restricted: Advance Paid (30%). Complete payment required for delivery.
                        </p>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => {
                    const productName = item.product_id?.name || item.product_name || item.name;
                    const productImage = item.product_image;
                    const itemPrice = item.price || item.product_price || 0;
                    const itemQuantity = item.quantity || 1;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                            
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gray-200 dark:bg-gray-500 rounded flex items-center justify-center ${productImage ? 'hidden' : 'flex'}`}>
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{productName || 'Unknown Product'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {itemQuantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">₹{Number(itemPrice * itemQuantity).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(selectedOrder.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 border-1 rounded-xl "
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadInvoice(selectedOrder);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
              >
                <FaFileInvoice size={16} />
                Generate Bill
              </button>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  handleUpdateStatus(selectedOrder);
                }}
                className="px-4 py-2 btn-primary"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInvoiceModal(false);
              setIsBulkPrinting(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl my-8">
            {invoiceLoading ? (
              <div className="bg-white dark:bg-gray-800 p-20 rounded-xl flex flex-col items-center justify-center relative">
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
                <p className="text-gray-600 dark:text-gray-400">Preparing your invoice{isBulkPrinting ? 's' : ''}...</p>
              </div>
            ) : isBulkPrinting ? (
              <div className="space-y-8 bg-gray-100 p-4 rounded-xl relative">
                <div className="sticky top-4 right-4 z-20 flex justify-end mb-4 h-0">
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
                <div className="flex justify-center mb-4 no-print">
                  <button 
                    onClick={handleBulkDownloadPdf}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
                  >
                    <FaFileInvoice size={18} />
                    Download All Invoices (PDF)
                  </button>
                </div>
                <div className="space-y-8">
                  {groupedOrders
                    .filter(order => {
                      const isPaid = order.payment_status?.toLowerCase() === 'paid';
                      const isCompleted = order.vendor_status?.toLowerCase() === 'delivered' || order.vendor_status?.toLowerCase() === 'completed';
                      return isPaid && isCompleted;
                    })
                    .map((order, idx) => (
                    <div key={idx} className="break-after-page mb-8">
                      <BillingInvoice 
                        data={order} 
                        vendorProfile={vendorProfile} 
                        type="order"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <BillingInvoice 
                  data={selectedOrder} 
                  vendorProfile={vendorProfile} 
                  type="order"
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

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-9999 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Update Order Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order ID: #{selectedOrder?.order_id}
                </label>
              </div>

              <div>
                <SearchableDropdown
                  value={newStatus || ''}
                  options={getStatusOptionsForModal(selectedOrder)}
                  placeholder="Select status"
                  searchable
                  usePortal
                  onChange={(val) => setNewStatus(val)}
                  disabled={loading}
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Add notes..."
                />
              </div> */}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border-1 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={loading}
                className="px-4 py-2 btn-primary disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
