"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit, MdClose, MdSearch } from "react-icons/md";
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import { CiFilter } from "react-icons/ci";
import { toast } from 'react-toastify';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import Label from '@/components/form/Label';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type Product = {
  id: string;
  product_name: string;
  category_name: string;
  sub_category_name: string;
  product_type_name: string;
  cancel_price: string;
  product_listing_type_name: string;
  price: number;
};

type Category = {
  _id?: string;
  id?: string;
  categories_id?: string;
  categories_name?: string;
  name?: string;
  subcategories?: Array<{
    subcategory_id: string;
    subcategory_name: string;
  }>;
};

type Option = {
  label: string;
  value: string;
};

const ProductTable = () => {
  const router = useRouter();
  const [productData, setProductData] = useState<Product[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [searchText, setSearchText] = useState('');
  
  // Filter dropdown data
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<Option[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [listingTypes, setListingTypes] = useState<any[]>([]);
  
  // Filter state - matching backend parameters (these are the applied filters)
  const [appliedFilters, setAppliedFilters] = useState({
    category_id: '',
    sub_category_id: '',
    filter_rent_sell: '', // 1 for Rent, 2 for Sell
    filter_tenure: '', // listing type id for Daily/Monthly/Hourly
  });

  // Temporary filter state for modal (changes before apply)
  const [tempFilters, setTempFilters] = useState({
    category_id: '',
    sub_category_id: '',
    filter_rent_sell: '',
    filter_tenure: '',
  });

  // Selected values for dropdowns in modal
  const [tempSelectedCategory, setTempSelectedCategory] = useState<string>('');
  const [tempSelectedSubCategory, setTempSelectedSubCategory] = useState<string>('');

  const debouncedSearch = useDebounce(searchText, 600);
  
  // Count active filters (excluding empty strings)
  const activeFilterCount = Object.values(appliedFilters).filter(v => v !== '').length;

  const columns: ColDef[] = [
    { 
      field: "product_name", 
      headerName: "Product Name", 
      minWidth: 200, 
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "category_name", 
      headerName: "Category", 
      minWidth: 180, 
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "sub_category_name", 
      headerName: "Sub Category", 
      minWidth: 180, 
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "product_type_name", 
      headerName: "Type", 
      minWidth: 120, 
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "price", 
      headerName: "Price", 
      minWidth: 120,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toFixed(2)}` : '₹0.00';
      },
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "cancel_price", 
      headerName: "Cancel Price", 
      minWidth: 120,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toFixed(2)}` : '₹0.00';
      },
      cellStyle: { textAlign: "center" } 
    },
    { 
      field: "product_listing_type_name", 
      headerName: "Listing Type", 
      minWidth: 150, 
      cellStyle: { textAlign: "center" } 
    },
    {
      headerName: "Action",
      minWidth: 120,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        const id = params.data._id || params.data.id;
        return (
          <div className="flex items-center justify-center gap-3 w-full h-full">
            <button
              onClick={() => router.push(`/product/addProduct?id=${id}`)}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white transition"
              title="Edit"
            >
              <MdModeEdit className="text-base" />
            </button>
            <button
              onClick={() => openDeletePopup(id)}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
              title="Delete"
            >
              <MdDelete className="text-base" />
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch products with filters
  const getProductData = async (filterParams = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add all non-empty filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString 
        ? `${endPointApi.postAllVendorProductList}?${queryString}` 
        : endPointApi.postAllVendorProductList;
      
      console.log("Fetching products with URL:", url);
      
      const res = await api.get(url);
      const products = res?.data?.data || [];
      
      // Normalize product data
      const normalized = products.map((p: any) => {
        let price = p.price;
        let cancel_price = p.cancel_price;
        
        // Handle rent products with monthly pricing
        if (
          p.product_type_name?.toLowerCase() === 'rent' &&
          p.product_listing_type_name?.toLowerCase() === 'monthly' &&
          Array.isArray(p.month_arr) &&
          p.month_arr.length
        ) {
          const first = p.month_arr[0];
          price = first?.price ?? price;
          cancel_price = first?.cancel_price ?? cancel_price;
        }
        
        return { 
          ...p, 
          price, 
          cancel_price, 
          id: p._id || p.id 
        };
      });
      
      setProductData(normalized);
    } catch (error) {
      console.log("fetch error", error);
      toast.error("Failed to fetch products");
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get(endPointApi.postCategoryList);
      if (res?.data?.data) {
        const list = res.data.data || [];
        setCategoriesData(list);
        
        // Create options for SearchableDropdown without images
        const options = list.map((item: any) => ({
          label: item.categories_name || item.name,
          value: String(item.categories_id || item.id || item._id),
        }));
        setCategoryOptions(options);
      }
    } catch (error) {
      console.log("Error fetching categories", error);
    }
  };

  // Fetch product dropdown data
  const fetchDropdownData = async () => {
    try {
      const productDropdownRes = await api.post(endPointApi.postProductDropDownList);
      const dropdownData = productDropdownRes?.data?.data || productDropdownRes?.data;
      
      // Set product types
      if (dropdownData?.products_type) {
        setProductTypes(dropdownData.products_type);
      } else if (dropdownData?.product_type) {
        setProductTypes(dropdownData.product_type);
      }
      
      // Set listing types
      if (dropdownData?.products_listing_type) {
        setListingTypes(dropdownData.products_listing_type);
      } else if (dropdownData?.listing_type) {
        setListingTypes(dropdownData.listing_type);
      }
    } catch (error) {
      console.log("fetch dropdown error", error);
      toast.error("Failed to load filter options");
    }
  };

  // Update subcategories when temp category changes
  useEffect(() => {
    if (!tempSelectedCategory) {
      setSubCategoryOptions([]);
      setTempSelectedSubCategory('');
      setTempFilters(prev => ({ ...prev, sub_category_id: '' }));
      return;
    }

    const cat = categoriesData.find((c: any) => 
      String(c.categories_id || c.id || c._id) === String(tempSelectedCategory)
    );
    
    const subcats = (cat?.subcategories || []).map((item: any) => ({
      value: String(item.subcategory_id || item.id),
      label: item.subcategory_name || item.name,
    }));

    setSubCategoryOptions(subcats);
    
    // Reset subcategory filter when category changes
    setTempSelectedSubCategory('');
    setTempFilters(prev => ({ ...prev, sub_category_id: '' }));
  }, [tempSelectedCategory, categoriesData]);

  // Handle category change in modal
  const handleTempCategoryChange = (value: string) => {
    setTempSelectedCategory(value);
    setTempFilters(prev => ({ ...prev, category_id: value }));
  };

  // Handle subcategory change in modal
  const handleTempSubCategoryChange = (value: string) => {
    setTempSelectedSubCategory(value);
    setTempFilters(prev => ({ ...prev, sub_category_id: value }));
  };

  // Handle product type change in modal
  const handleTempProductTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setTempFilters(prev => ({ ...prev, filter_rent_sell: value }));
  };

  // Handle listing type change in modal
  const handleTempListingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setTempFilters(prev => ({ ...prev, filter_tenure: value }));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Apply filters when search debounce changes (only search applies on typing)
  useEffect(() => {
    const params: any = {};
    
    // Add search parameter if exists
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }
    
    // Add applied filters (these are from the Apply button)
    if (appliedFilters.category_id) {
      params.category_id = appliedFilters.category_id;
    }
    
    if (appliedFilters.sub_category_id) {
      params.sub_category_id = appliedFilters.sub_category_id;
    }
    
    if (appliedFilters.filter_rent_sell) {
      params.filter_rent_sell = appliedFilters.filter_rent_sell;
    }
    
    if (appliedFilters.filter_tenure) {
      params.filter_tenure = appliedFilters.filter_tenure;
    }
    
    console.log("Applying filters:", params);
    getProductData(params);
  }, [debouncedSearch, appliedFilters]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node) &&
          filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial data fetch
  useEffect(() => {
    getProductData();
    fetchCategories();
    fetchDropdownData();
  }, []);

  // Open filter modal and set temp values to current applied filters
  const openFilterModal = () => {
    setTempFilters({ ...appliedFilters });
    setTempSelectedCategory(appliedFilters.category_id);
    setTempSelectedSubCategory(appliedFilters.sub_category_id);
    setShowFilterModal(true);
  };

  // Apply filters from modal
  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setShowFilterModal(false);
  };

  // Open delete confirmation modal
  const openDeletePopup = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  // Delete product by ID
  const deleteById = async (id: string | number) => {
    try {
      const res = await api.delete(`${endPointApi.postDeleteVendorProductList}/${id}`);
      toast.success("Deleted successfully");
      getProductData();
    } catch (error) {
      console.log("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteById(deleteId);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setTempSelectedCategory('');
    setTempSelectedSubCategory('');
    setTempFilters({ 
      category_id: '', 
      sub_category_id: '', 
      filter_rent_sell: '', 
      filter_tenure: '' 
    });
    setSubCategoryOptions([]);
  };

  // Reset all filters (from clear all button)
  const resetAllFilters = () => {
    setAppliedFilters({ 
      category_id: '', 
      sub_category_id: '', 
      filter_rent_sell: '', 
      filter_tenure: '' 
    });
    setSearchText('');
    setShowFilterModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Products</h2>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={openFilterModal}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 relative"
            >
              <CiFilter size={20} />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Modal */}
            {showFilterModal && (
              <div 
                ref={filterModalRef} 
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 z-50 border border-gray-200 dark:border-gray-700"
              >
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filter Products</h3>
                    <button 
                      onClick={() => setShowFilterModal(false)} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <MdClose size={18} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div>
                      <Label className="font-semibold mb-2">Category</Label>
                      <SearchableDropdown
                        searchable
                        options={categoryOptions}
                        value={tempSelectedCategory}
                        placeholder="Select category"
                        onChange={handleTempCategoryChange}
                      />
                    </div>

                    {/* Sub Category Filter */}
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Sub Category
                      </Label>
                      <SearchableDropdown
                        searchable
                        options={subCategoryOptions}
                        value={tempSelectedSubCategory}
                        placeholder={tempSelectedCategory ? "Search sub category..." : "Select category first"}
                        error={!tempSelectedCategory}
                        onChange={handleTempSubCategoryChange}
                        disabled={!tempSelectedCategory}
                      />
                      {!tempSelectedCategory && (
                        <p className="text-gray-500 text-xs mt-1">Please select a category first</p>
                      )}
                    </div>

                    {/* Product Type Filter (Rent/Sell) */}
                    <div>
                      <Label className="font-semibold mb-2">Product Type</Label>
                      <select
                        value={tempFilters.filter_rent_sell}
                        onChange={handleTempProductTypeChange}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="1">Rent</option>
                        <option value="2">Sell</option>
                      </select>
                    </div>

                    {/* Listing Type Filter (Tenure) */}
                    <div>
                      <Label className="font-semibold mb-2">Listing Type</Label>
                      <select
                        value={tempFilters.filter_tenure}
                        onChange={handleTempListingTypeChange}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Listing Types</option>
                        {listingTypes.map((type: any) => (
                          <option key={type.id || type._id} value={type.id || type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={clearFilters}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => router.push('/product/addProduct')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <AgGridTable
        columns={columns}
        rowData={productData}
        filter={false}
        tableName="Products"
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ProductTable