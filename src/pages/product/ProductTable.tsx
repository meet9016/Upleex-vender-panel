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
// ADD THIS at the top of your file (after imports)
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
type Product = {
  id: string;
  product_name: string;
  category_name: string;
  sub_category_name: string;
  product_type_name: string;
  cancel_price: string;
  product_listing_type_name: string;
  price: number;
  product_main_image?: string;  // ADD THIS
  image?: string;         
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
  // ADD THESE helper functions inside your component, before the columns definition
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('data:image') ||
         url.startsWith('/');
};

const getImageUrl = (product: any): string => {
  const imageUrl = product?.product_main_image || product?.image || '';
  return isValidImageUrl(imageUrl) ? imageUrl : DEFAULT_PLACEHOLDER;
};
  // Filter state - matching backend parameters
  const [filters, setFilters] = useState({
    category_id: '',
    sub_category_id: '',
    filter_rent_sell: '', // 1 for Rent, 2 for Sell
    filter_tenure: '', // listing type id for Daily/Monthly/Hourly
  });

  // Selected values for dropdowns
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  const debouncedSearch = useDebounce(searchText, 600);
  
  // Count active filters (excluding empty strings)
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const columns: ColDef[] = [
      {
      headerName: "Product Name",
      field: "product_name",
      width: 240,
      sortable: true,
     // REPLACE your existing cellRenderer with this fixed version
cellRenderer: (params: any) => {
  const product = params.data;
  const imageUrl = getImageUrl(product);  // Use the helper function
  const productName = product?.product_name || "N/A";
  const categoryName = product?.category_name || '';

  return (
    <div className="flex items-center gap-3 h-full">
      <div className="flex-shrink-0">
        <img
          src={imageUrl}
          alt={productName}
          className="w-14 h-14 object-cover rounded-lg border"
          onError={(e: any) => {
            // Only change to placeholder if current src is not already placeholder
            if (e.target.src !== DEFAULT_PLACEHOLDER) {
              e.target.src = DEFAULT_PLACEHOLDER;
            }
          }}
          loading="lazy"  // Add for performance
        />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-gray-800 dark:text-white">
          {productName}
        </span>
        {categoryName && (
          <span className="text-xs text-gray-500">
            {categoryName}
          </span>
        )}
      </div>
    </div>
  );
},
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

  // Update subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubCategoryOptions([]);
      setSelectedSubCategory('');
      setFilters(prev => ({ ...prev, sub_category_id: '' }));
      return;
    }

    const cat = categoriesData.find((c: any) => 
      String(c.categories_id || c.id || c._id) === String(selectedCategory)
    );
    
    const subcats = (cat?.subcategories || []).map((item: any) => ({
      value: String(item.subcategory_id || item.id),
      label: item.subcategory_name || item.name,
    }));

    setSubCategoryOptions(subcats);
    
    // Reset subcategory filter when category changes
    setSelectedSubCategory('');
    setFilters(prev => ({ ...prev, sub_category_id: '' }));
  }, [selectedCategory, categoriesData]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFilters(prev => ({ ...prev, category_id: value }));
  };

  // Handle subcategory change
  const handleSubCategoryChange = (value: string) => {
    setSelectedSubCategory(value);
    setFilters(prev => ({ ...prev, sub_category_id: value }));
  };

  // Handle product type change (Rent/Sell)
  const handleProductTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, filter_rent_sell: value }));
  };

  // Handle listing type change
  const handleListingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, filter_tenure: value }));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Apply filters when search debounce or filters change
  useEffect(() => {
    const params: any = {};
    
    // Add search parameter if exists
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      params.search = debouncedSearch.trim();
    }
    
    // Add category filter
    if (filters.category_id) {
      params.category_id = filters.category_id;
    }
    
    // Add subcategory filter
    if (filters.sub_category_id) {
      params.sub_category_id = filters.sub_category_id;
    }
    
    // Add rent/sell filter (1 for Rent, 2 for Sell)
    if (filters.filter_rent_sell) {
      params.filter_rent_sell = filters.filter_rent_sell;
    }
    
    // Add tenure filter (listing type id)
    if (filters.filter_tenure) {
      params.filter_tenure = filters.filter_tenure;
    }
    
    console.log("Applying filters:", params);
    getProductData(params);
  }, [debouncedSearch, filters]);

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
    setSelectedCategory('');
    setSelectedSubCategory('');
    setFilters({ 
      category_id: '', 
      sub_category_id: '', 
      filter_rent_sell: '', 
      filter_tenure: '' 
    });
    setSubCategoryOptions([]);
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
              onClick={() => setShowFilterModal(!showFilterModal)}
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
                        value={selectedCategory}
                        placeholder="Select category"
                        onChange={handleCategoryChange}
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
                        value={selectedSubCategory}
                        placeholder={selectedCategory ? "Search sub category..." : "Select category first"}
                        error={!selectedCategory}
                        onChange={handleSubCategoryChange}
                        disabled={!selectedCategory}
                      />
                      {!selectedCategory && (
                        <p className="text-gray-500 text-xs mt-1">Please select a category first</p>
                      )}
                    </div>

                    {/* Product Type Filter (Rent/Sell) */}
                    <div>
                      <Label className="font-semibold mb-2">Product Type</Label>
                      <select
                        value={filters.filter_rent_sell}
                        onChange={handleProductTypeChange}
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
                        value={filters.filter_tenure}
                        onChange={handleListingTypeChange}
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
                      onClick={() => setShowFilterModal(false)}
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