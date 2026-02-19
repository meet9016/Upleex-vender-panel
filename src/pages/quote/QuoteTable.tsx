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
  no: string;
  quote_id: string;
  product_name: string;
  product_type_name: string;
  product_listing_type_name: string;
  delivery_date: string;
  month_name: string;
  qty: string;
  price: string;
  total_price: string;
  status_text: string;
  created_at: string;
};

const QuoteTable = () => {
  const router = useRouter();
  const gridRef = useRef<any>(null);
  const [quoteData, setQuoteData] = useState<Quote[]>([]);
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
  // Filter state with exact keys you want in payload
  const [filters, setFilters] = useState({
    product_type: '',
    listing_type: '', // Changed from product_listing_type_name to listing_type
    delivery_start_date: '',
    delivery_end_date: '',
    month: '',
    status: '',
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const columns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      width: 240,
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
            </div>
          </div>
        );
      },
    },
    { field: "product_type_name", headerName: "Product Type", width: 180, cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Product Listing Type", width: 220, cellStyle: { textAlign: "center" } },
    { field: "delivery_date", headerName: "Delivery Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "start_date", headerName: "Start Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "end_date", headerName: "End Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "month_name", headerName: "Month", width: 120, cellStyle: { textAlign: "center" } },
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
      field: "status_text",
      headerName: "Status",
      width: 130,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        const status = params.value;
        let color =
          status === "Pending"
            ? "text-yellow-600"
            : status === "Approved"
              ? "text-green-600"
              : status === "Rejected"
                ? "text-red-600"
                : "text-gray-600";

        return <span className={`font-medium ${color}`}>{status}</span>;
      },
    },
{
  headerName: "Actions",
  width: 330,
  cellRenderer: (params: any) => {
    const status = params.data?.status_text;
    const isApproved = status === "Approved";
    const isRejected = status === "Rejected";

    return (
      <div className="flex items-center justify-center gap-2 h-full">

        {/* Approve */}
        <button
          onClick={() => handleApproval(params.data.quote_id)}
          disabled={isApproved}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
          ${
            isApproved
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 shadow-sm hover:shadow"
          }`}
        >
          Approve
        </button>

        {/* Reject */}
        <button
          onClick={() => handleRejected(params.data.quote_id)}
          disabled={isRejected}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
          ${
            isRejected
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
              : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 shadow-sm hover:shadow"
          }`}
        >
          Reject
        </button>

        {/* Edit */}
        <button
          onClick={() => router.push(`/quote/edit/${params.data.quote_id}`)}
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

  const getQuoteData = async (filterParams = {}) => {
    try {
      const formData = new FormData();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) formData.append(key, String(value));
      });

      const res = await api.post(endPointApi.postGetQuote, formData);

      if (res?.data?.status === 200) {
        setQuoteData(res.data.data || []);
      }
    } catch (error) {
      console.log("fetch quotes error:", error);
    }
  };

  const getDropdownData = async () => {
    try {
      const res = await api.post(endPointApi.postProductDropDownList);
      if (res?.data?.status === 200) {
        const data = res.data.data;
        setProductTypes(data.products_type || []);
        setListingTypes(data.products_listing_type || []);
        setMonths(data.products_months || []);
      }
    } catch (error) {
      console.log("fetch dropdown error:", error);
    }
  };

  const getStatusList = async () => {
    try {
      const res = await api.post(endPointApi.getStatus);
      if (res?.data?.status === 200) {
        setStatusList(res.data.data || []);
      }
    } catch (error) {
      console.log("fetch status error:", error);
    }
  };

  const handleApproval = async (quoteId: string) => {
    try {
      const approvedStatus = statusList.find(s => s.name === 'Approved');
      if (!approvedStatus) return;

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', approvedStatus.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
        toast.success("Quote approved successfully");
        getQuoteData();
      }
    } catch (error) {
      console.log('Approval error:', error);
       toast.error("Failed to approve quote");
    }
  };

  const handleRejected = async (quoteId: string) => {
    try {
      const rejectedStatus = statusList.find(s => s.name === 'Rejected');
      if (!rejectedStatus) return;

      const formData = new FormData();
      formData.append('quote_id', quoteId);
      formData.append('status', rejectedStatus.id);

      const res = await api.post(endPointApi.changeStatus, formData);

      if (res?.data?.status === 200) {
         toast.success("Quote rejected successfully");
        getQuoteData();
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

  // Apply filters with exact payload structure you want
  const applyFilters = () => {
    const params: any = {
      product_type: filters.product_type,
      listing_type: filters.listing_type, // This is the key you want
      delivery_start_date: filters.delivery_start_date,
      delivery_end_date: filters.delivery_end_date,
      month: filters.month,
      status: filters.status
    };

    if (searchText) params.search = searchText;
    getQuoteData(params);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilters({
      product_type: '',
      listing_type: '', // Changed to listing_type
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
    <div>
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
              <CiFilter  size={20} />
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
                            {getSelectedLabel('product_type') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'product_type' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'product_type' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('product_type', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Product Type</span>
                              {!filters.product_type && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {productTypes.map((type: any) => (
                              <div key={type.id} onClick={() => handleFilterChange('product_type', type.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{type.product_type}</span>
                                {filters.product_type === type.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Listing Type - Now using 'listing_type' key */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Listing Type</label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'listing_type' ? null : 'listing_type')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.listing_type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('listing_type') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'listing_type' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'listing_type' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('listing_type', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Listing Type</span>
                              {!filters.listing_type && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {listingTypes.map((type: any) => (
                              <div key={type.id} onClick={() => handleFilterChange('listing_type', type.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
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
                        // label="Start Date"
                        value={filters.delivery_start_date}
                        onChange={(date) =>
                          handleFilterChange("delivery_start_date", date)
                        }
                      />
                    </div>

                    {/* End Date */}
                    <div>
                       <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <DatePicker
                        label="End Date"
                        value={filters.delivery_end_date}
                        min={filters.delivery_start_date} // 👈 optional (end date start se pehle na ho)
                        onChange={(date) =>
                          handleFilterChange("delivery_end_date", date)
                        }
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
                            {getSelectedLabel('month') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'month' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('month', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Month</span>
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
                            {getSelectedLabel('status') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'status' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('status', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Status</span>
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
                    <button onClick={applyFilters} className="flex-1 px-3 py-1.5 btn-primary text-white rounded-lg text-sm font-medium">
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