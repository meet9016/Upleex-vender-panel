"use client";
import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import AgGridTable from '@/components/tables/AgGridTable';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';
import { MdPayment, MdShoppingCart, MdDateRange, MdPending, MdCheckCircle, MdCancel } from 'react-icons/md';
import { FaRupeeSign, FaUser, FaBox, FaEdit } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import ComponentCard from '@/components/common/ComponentCard';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { HiOutlineEye } from 'react-icons/hi';
import ActionButtons from '@/components/common/ActionButtons';
import { useRouter } from 'next/navigation';

interface PaymentOrder {
  order_id: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
  vendor_amount: number;
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
    };
    product_name?: string;
    name?: string;
    product_image?: string;
    image?: string;
    images?: string[];
    quantity: number;
    price?: number;
    product_price?: number;
  }>;
  total_amount: number;
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
    {
      headerName: "Customer",
      field: "customer_name",
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 dark:text-white">
            {params.data.customer_name || 'N/A'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {params.data.customer_email || 'N/A'}
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
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
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
      cellRenderer: (params: any) => {
        const status = params.value;
        return (
          <div className="flex items-center justify-center h-full">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
              {status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        );
      },
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
      headerName: "Customer",
      field: "user_id",
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 dark:text-white">
            {params.value?.name || 'N/A'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {params.value?.email || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      headerName: "Items",
      field: "items",
      minWidth: 100,
      flex: 0.8,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
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
        const productNames = items.map((item: any) => item.product_id?.name || item.product_name || item.name || 'N/A').join(', ');
        return (
          <div className="text-gray-800 dark:text-white text-sm">
            {productNames || 'N/A'}
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
        const skus = items.map((item: any) => item.product_id?.sku || item.sku || 'N/A').join(', ');
        return (
          <div className="font-mono text-gray-800 dark:text-white text-sm">
            {skus || 'N/A'}
          </div>
        );
      },
    },
    {
      headerName: "Amount",
      field: "total_amount",
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
      headerName: "Order Status",
      field: "vendor_status",
      minWidth: 150,
      flex: 1.2,
      cellRenderer: (params: any) => {
        const status = params.value || params.data.order_status || 'pending';
        return (
          <div className="flex items-center justify-center h-full">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
              {status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        );
      },
      cellStyle: { textAlign: "center" }
    },
    {
      headerName: "Payment",
      field: "payment_status",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value || 'pending';
        return (
          <div className={`font-medium text-center ${status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
            {status.toUpperCase()}
          </div>
        );
      },
      cellStyle: { textAlign: "center" }
    },
    {
        headerName: "Actions",
        field: "actions",
        minWidth: 150,
        flex: 1,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center justify-center gap-2 h-full">
              <button
                onClick={() => {
                  console.log('View order:', params.data);
                  handleViewOrder(params.data);
                }}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
                title="View Details"
                type="button"
              >
                <HiOutlineEye  size={17} />
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
        limit: '20',
        ...(statusFilter && { status: statusFilter })
      });
      
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

  useEffect(() => {
    fetchOrders();
    fetchStats();
    if (activeTab === 'orders') {
      fetchStatusOptions();
    }
  }, [page, statusFilter, activeTab]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Orders Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your orders and track payment history
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => {
            setActiveTab('orders');
            setPage(1);
            setStatusFilter('');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Order Management
        </button>
        <button
          onClick={() => {
            setActiveTab('payments');
            setPage(1);
            setStatusFilter('');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <ComponentCard key={index} title={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </ComponentCard>
          );
        })}
      </div>

      {/* Orders Table */}
      <ComponentCard title={activeTab === 'orders' ? 'Order Management' : 'Payment History'}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FaBox className="text-blue-600" />
              {activeTab === 'orders' ? 'Order Management' : 'Payment History'}
            </h2>
            <div className="flex items-center gap-4">
              {activeTab === 'orders' && (
                <div className="w-52">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <AgGridTable
            columns={activeTab === 'orders' ? vendorColumns : paymentColumns}
            rowData={activeTab === 'orders' ? vendorOrders : paymentOrders}
            loading={loading}
            autoHeight
            tableName={activeTab === 'orders' ? 'VendorOrders' : 'PaymentHistory'}
            filter={false}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrderModal(false);
            }
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
        >
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-[100000]">                <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Order Details - #{selectedOrder.order_id}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.user_id?.phone || 'N/A'}</p>
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
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                      {(selectedOrder.payment_status || 'pending').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => {
                    const productName = item.product_id?.name || item.product_name || item.name || 'Product Name';
                    const productImage = item.product_id?.images?.[0] || item.product_image || item.image || item.images?.[0];
                    const itemPrice = item.price || item.product_price || 0;
                    const itemQuantity = item.quantity || 1;
                    const productSku = item.product_id?.sku || item.sku || 'N/A';
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={productName}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {productName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              SKU: {productSku}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Quantity: {itemQuantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 dark:text-white">
                            ₹{Number(itemPrice).toLocaleString('en-IN')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total: ₹{Number(itemPrice * itemQuantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  }) || (
                    <p className="text-gray-600 dark:text-gray-400">No items found</p>
                  )}
                </div>
              </div>

              {/* Order Total */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Total Amount</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Delivery Updates */}
              {selectedOrder.delivery_tracking?.delivery_updates && selectedOrder.delivery_tracking.delivery_updates.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Delivery Updates</h4>
                  <div className="space-y-2">
                    {selectedOrder.delivery_tracking.delivery_updates.map((update, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{update.status}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{update.message}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(update.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  handleUpdateStatus(selectedOrder);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusModal(false);
            }
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
        >
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl relative z-[100000]">            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Update Order Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order ID: #{selectedOrder?.order_id}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Order ID: {selectedOrder?._id || 'Not available'}
                </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this status update..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
