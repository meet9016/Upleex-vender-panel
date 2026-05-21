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
    const activeStatus = searchParams ? (searchParams.get('status') || 'released') : 'released';

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
    const [dataCache, setDataCache] = useState<{
        [key: string]: { payments: PayoutRecord[], pagination: any } | null
    }>({});
    const [currentDataTab, setCurrentDataTab] = useState(activeTab);
    const [currentStatus, setCurrentStatus] = useState(activeStatus);
    const [counts, setCounts] = useState<{ [key: string]: number }>({});

    const fetchPayouts = useCallback(async (isInitial = false) => {
        const cacheKey = `${activeTab}-${activeStatus}`;
        
        // Check cache first if no explicit refresh is needed
        if (dataCache[cacheKey] && !isInitial) {
            const cached = dataCache[cacheKey]!;
            setPayouts(cached.payments);
            setPagination(prev => ({ ...prev, ...cached.pagination }));
            setCurrentDataTab(activeTab);
            setCurrentStatus(activeStatus);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Only clear if no cache to show, otherwise keep old data under loader
        if (!dataCache[cacheKey]) {
            setPayouts([]);
        }

        try {
            // Fetch both rent and sell data for the current status to get counts
            const [rentResponse, sellResponse, activeTabResponse] = await Promise.all([
                api.get(endPointApi.getVendorPaymentHistory, {
                    params: { page: 1, limit: 1, type: 'rent', status: activeStatus }
                }),
                api.get(endPointApi.getVendorPaymentHistory, {
                    params: { page: 1, limit: 1, type: 'sell', status: activeStatus }
                }),
                api.get(endPointApi.getVendorPaymentHistory, {
                    params: {
                        page: pagination.page,
                        limit: pagination.limit,
                        type: activeTab,
                        status: activeStatus
                    }
                })
            ]);

            // Update counts
            const newCounts = {
                [`rent-${activeStatus}`]: rentResponse.data.data.pagination?.total || 0,
                [`sell-${activeStatus}`]: sellResponse.data.data.pagination?.total || 0
            };
            setCounts(prev => ({ ...prev, ...newCounts }));

            if (activeTabResponse.data.success) {
                const payments = activeTabResponse.data.data.payments || [];
                const pag = activeTabResponse.data.data.pagination;
                
                setPayouts(payments);
                setPagination(prev => ({ ...prev, ...pag }));
                setCurrentDataTab(activeTab);
                setCurrentStatus(activeStatus);
                
                // Update cache
                setDataCache(prev => ({
                    ...prev,
                    [cacheKey]: { payments, pagination: pag }
                }));
            }
        } catch (error) {
            console.error("Error fetching payouts:", error);
            toast.error("Failed to fetch payout history");
        } finally {
            setLoading(false);
        }
    }, [activeTab, activeStatus, pagination.page, pagination.limit, dataCache]);

    const [tabStats, setTabStats] = useState<any>(null);
    const [totalStats, setTotalStats] = useState<any>(null);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const [totalResponse, tabResponse] = await Promise.all([
                api.get(endPointApi.getVendorPaymentStats),
                api.get(endPointApi.getVendorPaymentStats, {
                    params: { type: activeTab }
                })
            ]);
            if (totalResponse.data.success) {
                setTotalStats(totalResponse.data.data.stats);
            }
            if (tabResponse.data.success) {
                setTabStats(tabResponse.data.data.stats);
                setStats(tabResponse.data.data.stats);
            }
        } finally {
            setStatsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchPayouts();
        fetchStats();
    }, [activeTab, activeStatus, pagination.page, pagination.limit]);

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        params.set('type', tab);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        params.set('status', status);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleUpcomingClick = () => {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        params.set('status', 'pending');
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const rowDataFlat = useMemo(() => {
        const flat: any[] = [];
        const groups: { [key: string]: any } = {};

        payouts.forEach((payout) => {
            let customerName = 'Unknown';
            if (currentDataTab === 'sell') {
                customerName = payout.order_id?.user_name || 'Unknown';
            } else {
                customerName = payout.quote_id?.user_id?.name || payout.quote_id?.user_id?.first_name || 'Unknown';
            }

            const customerId = customerName;

            if (!groups[customerId]) {
                groups[customerId] = {
                    id: customerId,
                    type: 'customer',
                    name: customerName,
                    path: [customerId.toString()]
                };
                flat.push(groups[customerId]);
            }

            flat.push({
                ...payout,
                type: 'payout',
                path: [customerId.toString(), payout._id.toString()]
            });
        });

        return flat;
    }, [payouts, currentDataTab]);

    const autoGroupColumnDef = useMemo(() => ({
        headerName: currentDataTab === 'rent' ? "Customer / Quote ID" : "Customer / Order ID",
        field: "name",
        cellRendererParams: {
            suppressCount: true,
            innerRenderer: (props: any) => {
                const { data } = props;
                if (data?.type === "customer") {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">
                                    {data.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 leading-none">{data.name}</div>
                        </div>
                    );
                }
                
                const rawId = currentDataTab === 'sell' ? data?.order_id?.order_id : data?.quote_id?._id;
                const displayId = currentDataTab === 'sell' ? rawId : (rawId ? `Q#${rawId.slice(-6).toUpperCase()}` : 'N/A');

                return (
                    <div className="font-mono text-blue-600 font-semibold ml-2">
                        #{displayId || '-'}
                    </div>
                );
            },
        },
        minWidth: 350,
    }), [currentDataTab]);

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: "Total Amount",
            field: "totalAmount",
            valueGetter: (params) => {
                if (params.data?.type === 'customer') return null;
                const amount = currentDataTab === 'sell' ? params.data.order_id?.total_amount : params.data.quote_id?.calculated_price;
                return `₹${(amount || 0).toLocaleString('en-IN')}`;
            },
            flex: 1,
            minWidth: 130,
            cellStyle: { color: '#059669', fontWeight: '600' }
        },
        {
            headerName: "Your Payout",
            field: "vendor_amount",
            valueFormatter: (params) => {
                if (params.data?.type === 'customer') return '';
                return `₹${(params.value || 0).toLocaleString('en-IN')}`;
            },
            flex: 1,
            minWidth: 130,
            cellStyle: { color: '#7c3aed', fontWeight: '700' }
        },
        {
            headerName: "Status",
            field: "payment_status",
            cellRenderer: (params: any) => {
                if (params.data?.type === 'customer') return null;
                return <StatusBadge status={params.value} />;
            },
            flex: 1,
            minWidth: 120,
        },
        {
            headerName: currentStatus === 'pending' ? "Scheduled Release Date" : "Release Date",
            field: currentStatus === 'pending' ? "release_date" : "released_at",
            valueFormatter: (params) => {
                if (params.data?.type === 'customer') return '';
                const date = currentStatus === 'pending' ? params.data.release_date : params.data.released_at;
                return date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
            },
            flex: 1,
            minWidth: 120,
        }
    ], [currentDataTab, currentStatus]);

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

                <div 
                    className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md ${activeStatus === 'pending' ? 'ring-2 ring-orange-500' : ''}`}
                    onClick={handleUpcomingClick}
                >
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
            <div className="flex justify-between">
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
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
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'rent' 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {counts[`rent-${activeStatus}`] || 0}
                    </span>
                </button>
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
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'sell' 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {counts[`sell-${activeStatus}`] || 0}
                    </span>
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => handleStatusChange('released')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                        activeStatus === 'released'
                            ? "bg-white dark:bg-gray-800 text-green-600 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <CheckCircle size={16} />
                    Released
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        activeStatus === 'released' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {stats?.released?.count || 0}
                    </span>
                </button>
                <button
                    onClick={() => handleStatusChange('pending')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                        activeStatus === 'pending'
                            ? "bg-white dark:bg-gray-800 text-orange-600 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <Clock size={16} />
                    Pending
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        activeStatus === 'pending' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {stats?.pending?.count || 0}
                    </span>
                </button>
            </div>
            </div>
            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl shadow-gray-200/20 dark:shadow-none">
                <AgGridTable
                    rowData={rowDataFlat}
                    treeData={true}
                    getDataPath={(data: any) => data.path}
                    autoGroupColumnDef={autoGroupColumnDef}
                    groupDefaultExpanded={0}
                    getRowId={(params: any) => params.data.type === 'customer' ? `cust-${params.data.id}` : `payout-${params.data._id}`}
                    columns={columnDefs}
                    loading={loading}
                    height={500}
                    showCheckboxes={false}
                    noRowsMessage={activeStatus === 'pending' 
                        ? (activeTab === 'sell' ? "No pending sell payouts found" : "No pending rent payouts found")
                        : (activeTab === 'sell' ? "No released sell payouts found" : "No released rent payouts found")}
                />
            </div>
        </div>
    );
};

export default PayoutHistory;
