"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import StatusBadge from "@/components/common/StatusBadge";
import { ShoppingBag, FileText, CheckCircle, Clock, XCircle, DollarSign, Package } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";

interface PayoutRecord {
    _id: string;
    order_id?: {
        order_id: string;
        user_name: string;
        total_amount: number;
    };
    quote_id?: {
        _id: string;
        calculated_price: number;
        user_id: {
            name: string;
            first_name: string;
        };
    };
    vendor_amount: number;
    payment_status: string;
    release_date: string;
    released_at?: string;
    delivered_at?: string;
}

const PayoutHistory: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = searchParams ? (searchParams.get('type') || 'sell') : 'sell';

    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        setPayouts([]); // Clear old data to prevent "N/A" with new columns
        try {
            const response = await api.get(endPointApi.getVendorPaymentHistory, {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    type: activeTab,
                    status: 'released' // We only show released data per user request
                }
            });

            if (response.data.success) {
                setPayouts(response.data.data.payments || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.data.pagination
                }));
            }
        } catch (error) {
            console.error("Error fetching payouts:", error);
            toast.error("Failed to fetch payout history");
        } finally {
            setLoading(false);
        }
    }, [activeTab, pagination.page, pagination.limit]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await api.get(endPointApi.getVendorPaymentStats, {
                params: { type: activeTab }
            });
            if (response.data.success) {
                setStats(response.data.data.stats);
            }
        } finally {
            setStatsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchPayouts();
        fetchStats();
    }, [fetchPayouts, fetchStats]);

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        params.set('type', tab);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: activeTab === 'rent' ? "Quote ID" : "Order ID",
            field: "id",
            valueGetter: (params) => {
                if (activeTab === 'sell') return params.data.order_id?.order_id || 'N/A';
                return params.data.quote_id?._id ? `Q#${params.data.quote_id._id.slice(-6).toUpperCase()}` : 'N/A';
            },
            width: 150,
        },
        {
            headerName: "Customer",
            field: "customerName",
            valueGetter: (params) => {
                if (activeTab === 'sell') return params.data.order_id?.user_name || 'Unknown';
                return params.data.quote_id?.user_id?.name || params.data.quote_id?.user_id?.first_name || 'Unknown';
            },
            width: 180,
        },
        {
            headerName: "Total Amount",
            field: "totalAmount",
            valueGetter: (params) => {
                const amount = activeTab === 'sell' ? params.data.order_id?.total_amount : params.data.quote_id?.calculated_price;
                return `₹${(amount || 0).toLocaleString('en-IN')}`;
            },
            width: 150,
            cellStyle: { color: '#059669', fontWeight: '600' }
        },
        {
            headerName: "Your Payout",
            field: "vendor_amount",
            valueFormatter: (params) => `₹${(params.value || 0).toLocaleString('en-IN')}`,
            width: 150,
            cellStyle: { color: '#7c3aed', fontWeight: '700' }
        },
        {
            headerName: "Status",
            field: "payment_status",
            cellRenderer: (params: any) => <StatusBadge status={params.value} />,
            width: 140,
        },
        {
            headerName: "Release Date",
            field: "released_at",
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A',
            width: 140,
        }
    ], [activeTab]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Release History</h2>
                <p className="text-sm text-gray-500 mt-1">Track your released payments for Rent and Sell transactions</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between relative overflow-hidden">
                    {statsLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Released</p>
                        <p className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300 ${statsLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            ₹{(stats?.released?.amount || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <DollarSign className="text-green-600 h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between relative overflow-hidden">
                    {statsLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Transactions</p>
                        <p className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300 ${statsLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            {stats?.released?.count || 0}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Package className="text-blue-600 h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between relative overflow-hidden">
                    {statsLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-orange-600">Upcoming Payouts</p>
                        <p className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300 ${statsLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            ₹{(stats?.pending?.amount || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                        <Clock className="text-orange-600 h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => handleTabChange('sell')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                        activeTab === 'sell'
                            ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <ShoppingBag size={16} />
                    Sell
                </button>
                <button
                    onClick={() => handleTabChange('rent')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                        activeTab === 'rent'
                            ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <FileText size={16} />
                    Rent
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl shadow-gray-200/20 dark:shadow-none">
                <AgGridTable
                    rowData={payouts}
                    columns={columnDefs}
                    loading={loading}
                    height={500}
                    showCheckboxes={false}
                    noRowsMessage={activeTab === 'sell' ? "No sell payouts found" : "No rent payouts found"}
                />
            </div>
        </div>
    );
};

export default PayoutHistory;
