"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit, MdClose, MdSearch, MdKeyboardArrowDown, MdCheck } from "react-icons/md";
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import { CiFilter } from "react-icons/ci";

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

const ProductTable = () => {
  const router = useRouter();
  const [productData, setProductData] = useState<Product[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [listingTypes, setListingTypes] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category_id: '',
    sub_category_id: '',
    product_type_id: '',
    product_listing_type_id: '',
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchText, 600);

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;
  const columns: ColDef[] = [
    { field: "product_name", headerName: "Product Name", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "category_name", headerName: "Category Name", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "sub_category_name", headerName: "Sub Category", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "product_type_name", headerName: "Product Type", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "price", headerName: "Price", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "cancel_price", headerName: "Cancel Price", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Listing Type", minWidth: 150, cellStyle: { textAlign: "center" } },
    {
      headerName: "Action",
      // pinned: "right",
      minWidth: 80,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        const id = params.data.product_id;

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

  const getProductData = async (filterParams = {}) => {
    try {
      const formData = new FormData();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) formData.append(key, String(value));
      });

      const res = await api.post(endPointApi.postAllVendorProductList, formData);
      const products = res?.data?.data || [];
      setProductData(products);

      const uniqueTypes = [
        ...new Map(
          products.map((item: any) => [
            item.product_type_name,
            {
              id: item.product_type_id || item.product_type_name,
              product_type_name: item.product_type_name,
            },
          ])
        ).values(),
      ];

      setProductTypes(uniqueTypes);
      // ✅ UNIQUE LISTING TYPES
      const uniqueListingTypes = [
        ...new Map(
          products
            .filter((item: any) =>
              item.product_listing_type_name &&
              item.product_listing_type_name.trim() !== ""
            )
            .map((item: any) => [
              item.product_listing_type_name.trim(),
              {
                id:
                  item.product_listing_type_id ||
                  item.product_listing_type_name.trim(),
                product_listing_type_name:
                  item.product_listing_type_name.trim(),
              },
            ])
        ).values(),
      ];
      setListingTypes(uniqueListingTypes);
    } catch (error) {
      console.log("fetch error", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const res = await api.post(endPointApi.postCategoryList);
      const data = res?.data?.data;
      setCategories(data);
    } catch (error) {
      console.log("fetch dropdown error", error);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    try {
      const formData = new FormData();
      formData.append('category_id', categoryId);
      const res = await api.post(endPointApi.postSubCategoryList, formData);
      setSubCategories(res?.data?.data || []);
    } catch (error) {
      console.log("fetch subcategory error", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'category_id') {
      setFilters(prev => ({ ...prev, sub_category_id: '' }));
      if (value) fetchSubCategories(value);
      else setSubCategories([]);
    }
    setOpenDropdown(null);
  };

  const getSelectedLabel = (key: string) => {
    const value = filters[key as keyof typeof filters];
    if (!value) return null;

    switch (key) {
      case 'category_id':
        return categories.find(c => c.id === value)?.name;
      case 'sub_category_id':
        return subCategories.find(s => s.id === value)?.name;
      case 'product_type_id':
        return productTypes.find(t => t.id === value)?.product_type_name;
      case 'product_listing_type_id':
        return listingTypes.find(l => l.id === value)?.product_listing_type_name;
      default:
        return null;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  useEffect(() => {
    const params: any = { ...filters };
    if (debouncedSearch) params.search = debouncedSearch;
    getProductData(params);
  }, [debouncedSearch]); // Only re-run when debouncedSearch changes

  // Effect for filter changes (excluding search)
  useEffect(() => {
    const params: any = { ...filters };
    if (searchText) params.search = searchText;
    getProductData(params);
  }, [filters.category_id, filters.sub_category_id, filters.product_type_id, filters.product_listing_type_id]);

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

  const applyFilters = () => {
    const params: any = { ...filters };
    if (searchText) params.search = searchText;
    getProductData(params);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilters({ category_id: '', sub_category_id: '', product_type_id: '', product_listing_type_id: '' });
    setSearchText('');
    setSubCategories([]);
    getProductData();
    setShowFilterModal(false);
  };

  useEffect(() => {
    getProductData();
    fetchDropdownData();
  }, []);

  const openDeletePopup = (id: number) => {

    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const deleteById = async (id: number | string) => {
    try {
      const formdata = new FormData();
      formdata.append("product_id", String(id));

      const res = await api.post(endPointApi.postDeleteVendorProductList, formdata);
      // toast.success("Deleted successfully");
      getProductData(); // refresh table
    } catch (error) {
      // toast.error("Delete failed");
    }
  };

  const confirmDelete = async () => {

    if (!deleteId) return;

    await deleteById(deleteId);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Product</h2>
        <div className="flex items-center gap-3">
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
              <CiFilter  size={20} />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilterModal && (
              <div ref={dropdownRef} className="absolute right-[-180px] top-full mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[300px] z-50 border border-gray-200 dark:border-gray-700">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Products</h3>
                    <button onClick={() => setShowFilterModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                      <MdClose size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.category_id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('category_id') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'category' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('category_id', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Category</span>
                              {!filters.category_id && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {categories.map((cat: any) => (
                              <div key={cat.id} onClick={() => handleFilterChange('category_id', cat.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{cat.name}</span>
                                {filters.category_id === cat.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub Category */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sub Category</label>
                      <div className="relative">
                        <button
                          onClick={() => filters.category_id && setOpenDropdown(openDropdown === 'subcategory' ? null : 'subcategory')}
                          disabled={!filters.category_id}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all disabled:opacity-50 text-sm"
                        >
                          <span className={filters.sub_category_id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('sub_category_id') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'subcategory' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'subcategory' && filters.category_id && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('sub_category_id', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Sub Category</span>
                              {!filters.sub_category_id && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {subCategories.map((sub: any) => (
                              <div key={sub.id} onClick={() => handleFilterChange('sub_category_id', sub.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{sub.name}</span>
                                {filters.sub_category_id === sub.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product Type</label>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === 'producttype' ? null : 'producttype')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.product_type_id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('product_type_id') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'producttype' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'producttype' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('product_type_id', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Product Type</span>
                              {!filters.product_type_id && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {productTypes.map((type: any) => (
                              <div key={type.id} onClick={() => handleFilterChange('product_type_id', type.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{type.product_type_name}</span>
                                {filters.product_type_id === type.id && <MdCheck className="text-blue-600" size={16} />}
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
                          onClick={() => setOpenDropdown(openDropdown === 'listingtype' ? null : 'listingtype')}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex justify-between items-center hover:border-blue-500 transition-all text-sm"
                        >
                          <span className={filters.product_listing_type_id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                            {getSelectedLabel('product_listing_type_id') || 'Select'}
                          </span>
                          <MdKeyboardArrowDown className={`transition-transform ${openDropdown === 'listingtype' ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        {openDropdown === 'listingtype' && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div onClick={() => handleFilterChange('product_listing_type_id', '')} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm">
                              <span>Select Listing Type</span>
                              {!filters.product_listing_type_id && <MdCheck className="text-blue-600" size={16} />}
                            </div>
                            {listingTypes.map((type: any) => (
                              <div key={type.id} onClick={() => handleFilterChange('product_listing_type_id', type.id)} className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-t border-gray-100 dark:border-gray-700 text-sm">
                                <span>{type.product_listing_type_name}</span>
                                {filters.product_listing_type_id === type.id && <MdCheck className="text-blue-600" size={16} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">

                    <button
                      onClick={clearFilters}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
                    >
                      Clear
                    </button>

                    <button
                      onClick={applyFilters}
                      className="w-full px-3 py-1.5 btn-primary text-white rounded-lg text-sm font-medium"
                    >
                      Apply
                    </button>

                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/product/addProduct')}
            className="px-4 py-2 btn-primary  text-white rounded-lg transition-colors font-medium"
          >
            + Add Product
          </button>
        </div>
      </div>


      <AgGridTable
        columns={columns}
        rowData={productData}
        filter={false}
        tableName={""}
      />
      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ProductTable