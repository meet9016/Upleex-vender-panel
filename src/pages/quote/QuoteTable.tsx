"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { MdDelete, MdModeEdit, MdFilterList, MdClose, MdSearch, MdKeyboardArrowDown, MdCheck } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import DatePicker from "@/components/common/DatePicker";
import { CiFilter } from "react-icons/ci";
import { toast } from "react-toastify";

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

  // Filter state
  const [filters, setFilters] = useState({
    product_type: '',
    listing_type: '',
    delivery_start_date: '',
    delivery_end_date: '',
    month: '',
    status: '',
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Transform API data to match table columns
  const transformQuoteData = (quotes: any[]): Quote[] => {
    return quotes.map(quote => {
      const product = quote.product_id || {};
      const month = months.find(m => m.id === quote.months_id);
      const fmt = (d?: any) => {
        if (!d) return '-';
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return '-';
        return dt.toLocaleDateString();
      };

      return {
        ...quote,
        // Flatten product fields for easy access in table
        product_name: product.product_name || '-',
        product_type_name: product.product_type_name || '-',
        product_listing_type_name: product.product_listing_type_name || '-',
        price: product.price || '0',
        product_main_image: product.product_main_image || '',
        total_price: quote.qty && product.price
          ? (parseInt(quote.qty) * parseFloat(product.price)).toString()
          : '0',
        month_name: month?.month_name || '-',
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
      width: 300,
      sortable: true,
      cellRenderer: (params: any) => {
        const imageUrl = params.data?.product_main_image;
        const productName = params.data?.product_name;

        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={productName}
                  className="w-14 h-14 object-cover rounded-lg border"
                  onError={(e: any) => {
                    e.target.src =
                      "https://via.placeholder.com/60x60?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded-lg border">
                  No Image
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 dark:text-white">
                {productName || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
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
      width: 180,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "product_listing_type_name",
      headerName: "Product Listing Type",
      width: 220,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "delivery_date",
      headerName: "Delivery Date",
      width: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "start_date",
      headerName: "Start Date",
      width: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "end_date",
      headerName: "End Date",
      width: 150,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "month_name",
      headerName: "Month",
      width: 120,
      cellStyle: { textAlign: "center" }
    },
    {
      field: "qty",
      headerName: "Qty",
      width: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_price",
      headerName: "Total",
      width: 120,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "center", fontWeight: "600" },
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        const status = params.value;
        let color = "text-gray-600";
        let bgColor = "bg-gray-100";

        switch (status?.toLowerCase()) {
          case 'pending':
            color = "text-yellow-700";
            bgColor = "bg-yellow-50";
            break;
          case 'active':
            color = "text-purple-700";
            bgColor = "bg-purple-50";
            break;
          case 'approval':
          case 'approved':
            color = "text-green-700";
            bgColor = "bg-green-50";
            break;
          case 'reject':
          case 'rejected':
            color = "text-red-700";
            bgColor = "bg-red-50";
            break;
          case 'complete':
          case 'completed':
            color = "text-blue-700";
            bgColor = "bg-blue-50";
            break;
        }

        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
            {(status || '').toString().toUpperCase() || 'N/A'}
          </span>
        );
      },
    },
    {
      headerName: "Actions",
      width: 330,
      cellRenderer: (params: any) => {
        const status = params.data?.status?.toLowerCase();
        const isApproved = status === 'approval' || status === 'approved';
        const isActive = status === 'active';
        const isRejected = status === 'reject' || status === 'rejected';
        const isCompleted = status === 'complete' || status === 'completed';

        return (
          <div className="flex items-center justify-center gap-2 h-full">
            {/* Approve */}
            <button
              onClick={() => handleApproval(params.data._id)}
              disabled={isRejected || isApproved || isActive || isCompleted}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
              ${isRejected || isApproved || isActive || isCompleted
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 shadow-sm hover:shadow"
                }`}
            >
              Approve
            </button>

            {/* Reject */}
            <button
              onClick={() => handleRejected(params.data._id)}
              disabled={isRejected || isApproved || isActive || isCompleted}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
              ${isRejected || isApproved || isActive || isCompleted
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 shadow-sm hover:shadow"
                }`}
            >
              Reject
            </button>

            {/* Edit */}
            <button
              onClick={() => router.push(`/quote/edit/${params.data._id}`)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border
              bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-300
              border-blue-200 dark:border-gray-600
              hover:bg-blue-50 dark:hover:bg-gray-700
              transition-all duration-200"
            >
              Edit
            </button>
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
      // Prefer ACTIVE if available, else APPROVED
      const statusActive = statusList.find((s: any) =>
        String(s.name || '').toLowerCase().includes('active')
      );
      const statusApproved = statusList.find((s: any) =>
        String(s.name || '').toLowerCase().includes('approve')
      );
      const targetStatus = statusActive || statusApproved;
      if (!targetStatus) return toast.error("Target status not found");

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', targetStatus.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success(`Status changed to ${String(targetStatus.name).toUpperCase()}`);
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
    setShowFilterModal(false);
  };

  useEffect(() => {
    const params: any = {};
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    getQuoteData();
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
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'product_type' ? null : 'product_type')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.product_type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('product_type') || 'Select Product Type'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'product_type' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'product_type' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('product_type', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>All Product Types</span>
                              {!filters.product_type && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {productTypes.map((type: any) => (
                              <div
                                key={type.id}
                                onClick={() => handleFilterChange('product_type', type.id)}
                                className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm"
                              >
                                <span>{type.product_type}</span>
                                {filters.product_type === type.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Listing Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Listing Type</label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'listing_type' ? null : 'listing_type')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.listing_type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('listing_type') || 'Select Listing Type'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'listing_type' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'listing_type' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('listing_type', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>All Listing Types</span>
                              {!filters.listing_type && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {listingTypes.map((type: any) => (
                              <div
                                key={type.id}
                                onClick={() => handleFilterChange('listing_type', type.id)}
                                className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm"
                              >
                                <span>{type.name}</span>
                                {filters.listing_type === type.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
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
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.month ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('month') || 'Select Month'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'month' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('month', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>All Months</span>
                              {!filters.month && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {months.map((month: any) => (
                              <div key={month.id} onClick={() => handleFilterChange('month', month.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{month.month_name}</span>
                                {filters.month === month.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.status ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('status') || 'Select Status'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'status' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('status', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>All Statuses</span>
                              {!filters.status && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {statusList.map((status: any) => (
                              <div key={status.id} onClick={() => handleFilterChange('status', status.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{status.name}</span>
                                {filters.status === status.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
        </div>
      </div>

      <AgGridTable
        columns={columns}
        rowData={quoteData}
        filter={true}
        tableName="Quotes"
      />
    </div>
  );
};

export default QuoteTable;