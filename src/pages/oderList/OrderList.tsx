"use client";
import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import AgGridTable from '@/components/tables/AgGridTable';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';
import { MdPayment, MdShoppingCart, MdDateRange, MdPending, MdCheckCircle, MdCancel } from 'react-icons/md';
import { FaRupeeSign, FaUser, FaBox, FaEdit, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { FiRefreshCw, FiMoreVertical } from 'react-icons/fi';
import ComponentCard from '@/components/common/ComponentCard';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { HiOutlineEye } from 'react-icons/hi';
import ActionButtons from '@/components/common/ActionButtons';
import { useRouter } from 'next/navigation';
import StatusBadge from '../../components/common/StatusBadge';
import { exportOrdersToExcel, exportOrdersToPDF, exportPaymentsToExcel, exportPaymentsToPDF } from '@/utils/exportUtils';
import Loader from '@/components/common/Loader';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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

interface VendorOrder {
  _id?: string;
  id?: string;
  order_id: string;
  user_id: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product_id?: {
      name?: string;
      images?: string[];
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
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'orders'>('orders');
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 600);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = React.useRef<HTMLDivElement>(null);

  const getCurrentParams = () => {
    const params: any = {};
    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter;
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
      headerName: "Type",
      field: "payment_type",
      minWidth: 120,
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

  // Vendor Orders Columns
  const vendorColumns: ColDef[] = [
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
      field: "user_id",
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: any) => (
        <div className="flex flex-col justify-center h-full leading-tight py-0.5">
          <span className="text-[13px] font-medium text-gray-800 dark:text-white truncate block">
            {params.value?.name || '-'}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block mt-0.5">
            {params.value?.email || '-'}
          </span>
        </div>
      ),
    },
    {
      headerName: "Items",
      field: "items",
      minWidth: 80,
      flex: 0.2,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {params.value?.length || 0}
          </span>
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Product Name",
      field: "items",
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: any) => {
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
      cellRenderer: (params: any) => {
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
      cellRenderer: (params: any) => (
        <div className="font-semibold text-green-600 text-center">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Order Status",
      field: "vendor_status",
      minWidth: 120,
      flex: 1.2,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Customer Payment",
      field: "payment_status",
      minWidth: 150,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex flex-col gap-1 items-center">
          <StatusBadge status={params.value} />
          {params.data.payment_type && <StatusBadge status={params.data.payment_type} />}
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Admin Payment",
      field: "payment_status_info.payment_status",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => {
        const paymentStatus = params.data.payment_status_info?.payment_status || '-';
        return <StatusBadge status={paymentStatus} />;
      },
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Date",
      field: "createdAt",
      minWidth: 120,
      flex: 1,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      },
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 90,
      maxWidth: 90,
      suppressSizeToFit: true,
      pinned: "right",
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center justify-left gap-2 h-full">
            <button
              onClick={() => {
                console.log('View order:', params.data);
                handleViewOrder(params.data);
              }}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
              title="View Details"
              type="button"
            >
              <HiOutlineEye size={17} />
            </button>

            <ActionButtons
              onEdit={() => handleUpdateStatus(params.data)}
            />
          </div>
        );
      },
    }
  ];

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${endPointApi.getVendorPaymentHistory}?page=${page}&limit=20`);

      if (response.data.success) {
        const paymentHistory = response.data.data.payment_history || [];
        setPaymentOrders(paymentHistory);
        setTotalPages(response.data.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      // Add status filter if selected
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get(`${endPointApi.getVendorOrders}?${params}`);

      if (response.data.success) {
        setVendorOrders(response.data.data.orders || []);
        setTotalPages(response.data.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching vendor orders:', error);
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

  const handleViewOrder = (order: VendorOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateStatus = (order: VendorOrder) => {
    console.log('Selected order for status update:', order);

    if (!order) {
      toast.error('Order data is missing');
      console.error('Order is null or undefined');
      return;
    }

    // Check for both _id and id fields
    const orderId = order._id || order.id;
    if (!orderId) {
      toast.error('Order ID is missing');
      console.error('Order object missing both _id and id:', order);
      return;
    }

    if (!order.order_id) {
      console.warn('Order missing order_id:', order);
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
      console.error('Order object:', selectedOrder);
      return;
    }

    // Restriction: Cannot update to delivery-related statuses if payment is on hold
    const deliveryStatuses = ['picked_up', 'out_for_delivery', 'delivered'];
    if (selectedOrder.payment_status === 'hold' && deliveryStatuses.includes(newStatus)) {
      toast.error('Cannot proceed with delivery. Customer has only paid 30% advance. Remaining payment is pending.');
      return;
    }

    try {
      setLoading(true);
      console.log('Updating order:', selectedOrder._id, 'to status:', newStatus);

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
      console.error('Error updating status:', error);
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
      const completedPayments = paymentData.filter((order: PaymentOrder) => order.payment_status === 'paid').length;
      const pendingPayments = paymentData.filter((order: PaymentOrder) => order.payment_status === 'pending').length;

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
    if (activeTab === 'payments') {
      await fetchPaymentHistory();
    } else {
      await fetchVendorOrders();
    }
  };

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = getCurrentParams();
      if (activeTab === 'orders') {
        await exportOrdersToExcel(params);
        toast.success('Orders exported to Excel successfully!');
      } else {
        await exportPaymentsToExcel(params);
        toast.success('Payments exported to Excel successfully!');
      }
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
      if (activeTab === 'orders') {
        await exportOrdersToPDF(params);
        toast.success('Orders exported to PDF successfully!');
      } else {
        await exportPaymentsToPDF(params);
        toast.success('Payments exported to PDF successfully!');
      }
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
    if (activeTab === 'orders') {
      fetchStatusOptions();
    }
  }, [page, statusFilter, activeTab, debouncedSearch]);

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
      title: activeTab === 'payments' ? 'Completed Payments' : 'Delivered Orders',
      value: activeTab === 'payments' ? stats.completed_payments : stats.delivered_orders,
      icon: activeTab === 'payments' ? MdPayment : MdCheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: activeTab === 'payments' ? 'Pending Payments' : 'Pending Orders',
      value: activeTab === 'payments' ? stats.pending_payments : stats.pending_orders,
      icon: activeTab === 'payments' ? MdDateRange : MdPending,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
             {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-fit">
          <button
            onClick={() => {
              setActiveTab('orders');
              setPage(1);
              setStatusFilter('');
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'orders'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            Orders
          </button>
          <button
            onClick={() => {
              setActiveTab('payments');
              setPage(1);
              setStatusFilter('');
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payments'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            Payments
          </button>
        </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-10 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full sm:w-64"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {activeTab === 'orders' && (
              <div className="w-full sm:w-52">
                <SearchableDropdown
                  value={statusFilter || ''}
                  options={[{ value: '', label: 'All Status' }, ...statusOptions]}
                  placeholder="All Status"
                  searchable
                  onChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                />
              </div>
            )}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="w-full sm:w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md border-gray-300 border-1 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
              title="Refresh"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Actions Menu (3-dots) */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setShowActionsMenu((v) => !v)}
                className="w-full sm:w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
                title="Export options"
              >
                <FiMoreVertical className="text-xl" />
              </button>

              {showActionsMenu && (
                <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-3 w-auto sm:w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                
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

        {/* Table */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <AgGridTable
              columns={activeTab === 'orders' ? vendorColumns : paymentColumns}
              rowData={activeTab === 'orders' ? vendorOrders : paymentOrders}
              loading={loading}
              height={"580px"}
              tableName={activeTab === 'orders' ? 'Orders' : 'Payments'}
              filter={false}
              showCheckboxes={false}
              rowHeight={55 }
            />
          </div>
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrderModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
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
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.vendor_status || selectedOrder.order_status || 'pending')}`}>
                      {(selectedOrder.vendor_status || selectedOrder.order_status || 'pending').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-600' : (selectedOrder.payment_status === 'hold' ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600')}`}>
                        {(selectedOrder.payment_status || 'pending').toUpperCase()}
                      </span>
                      {selectedOrder.payment_status === 'hold' && (
                        <p className="text-[10px] text-amber-600 font-bold leading-tight">
                          Restricted: Advance Paid (30%). Complete payment required for delivery.
                        </p>
                      )}
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
                    const productImage = item.product_id?.images?.[0] || item.product_image;
                    const itemPrice = item.price || item.product_price || 0;
                    const itemQuantity = item.quantity || 1;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <img src={productImage} alt={productName} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-500 rounded"></div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{productName}</p>
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

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Status
                </label>
                <SearchableDropdown
                  value={newStatus || ''}
                  options={statusOptions}
                  placeholder="Select status"
                  searchable
                  onChange={(val) => setNewStatus(val)}
                  disabled={loading}
                />
              </div>

              <div>
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
              </div>
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
