"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import Button from "@/components/ui/button/Button";
import Input from "@/components/common/Input";
import { MdSearch } from "react-icons/md";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { CiWarning } from "react-icons/ci";
import { HiOutlineRefresh } from "react-icons/hi";
import { IoMdStar, IoMdTrendingUp } from "react-icons/io";
import { FiMoreVertical } from "react-icons/fi";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import PlanSelectionDialog from "@/components/common/PlanSelectionDialog";
import { exportProductsToExcel, exportProductsToPDF } from "@/utils/exportUtils";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f0f0f0'/%3E%3Ctext x='24' y='24' font-family='Arial' font-size='10' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
const isValidImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image") || url.startsWith("/");
};
const getImageUrl = (p: any): string => {
  const imageUrl = p?.product_main_image || p?.image || "";
  return isValidImageUrl(imageUrl) ? imageUrl : DEFAULT_PLACEHOLDER;
};

export default function DraftPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 600);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subCategoryOptions, setSubCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentParams = () => {
    const params: any = { status: "draft" };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedSubCategory) params.sub_category_id = selectedSubCategory;
    return params;
  };

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = getCurrentParams();
      await exportProductsToExcel(params);
      toast.success("Draft products exported to Excel successfully!");
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Excel");
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = getCurrentParams();
      await exportProductsToPDF(params);
      toast.success("Draft products exported to PDF successfully!");
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to export to PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const columns: ColDef[] = useMemo(() => [
    {
      headerName: "Product",
      field: "product_name",
      width: 280,
      cellRenderer: (params: any) => {
        const p = params.data;
        const imageUrl = getImageUrl(p);
        const name = p?.product_name || "N/A";
        const cat = p?.category_name || "";
        return (
          <div className="flex items-center gap-3 h-full">
            <img
              src={imageUrl}
              alt={name}
              className="w-9 h-9 object-cover rounded border"
              onError={(e: any) => { if (e.target.src !== DEFAULT_PLACEHOLDER) e.target.src = DEFAULT_PLACEHOLDER; }}
              loading="lazy"
            />
            <div className="flex flex-col justify-center h-full leading-tight py-0.5">
              <span className="font-medium text-gray-800 dark:text-white">{name}</span>
              {cat && <span className="text-xs text-gray-500 dark:text-gray-400">{cat}</span>}
            </div>
          </div>
        );
      }
    },
    { field: "category_name", headerName: "Category", width: 260, cellStyle: { textAlign: "center" } },
    { field: "sub_category_name", headerName: "Sub Category", width: 190, cellStyle: { textAlign: "center" } },
    { field: "product_type_name", headerName: "Type", width: 120, cellStyle: { textAlign: "center" } },
    { field: "price", headerName: "Price", width: 200, valueFormatter: p => p.value ? `₹${Number(p.value).toFixed(2)}` : "₹0.00", cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Listing Type", width: 150, cellStyle: { textAlign: "center" } },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: () => (
        <div className="flex items-center justify-center h-full">
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
            Draft
          </span>
        </div>
      ),
      cellStyle: { textAlign: "center" }
    },
    { field: "expires_at", headerName: "Expires On", width: 240, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-", cellStyle: { textAlign: "center" } },
  ], []);

  const fetchCategories = async () => {
    try {
      const res = await api.get(endPointApi.postCategoryList);
      const list = res?.data?.data || [];
      setCategoriesData(list);
      const options = list.map((item: any) => ({
        label: item.categories_name || item.name,
        value: String(item.categories_id || item.id || item._id),
      }));
      setCategoryOptions(options);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const params = getCurrentParams();
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => queryParams.append(key, params[key]));

      const url = `${endPointApi.postAllVendorProductList}?${queryParams.toString()}`;
      const res = await api.get(url);
      const data = res?.data?.data || [];
      const normalized = data.map((p: any) => ({ ...p, id: p._id || p.id }));
      setRows(normalized);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchDrafts(); }, [debouncedSearch, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      setSubCategoryOptions([]);
      setSelectedSubCategory("");
      return;
    }
    const cat = categoriesData.find((c: any) => String(c.categories_id || c.id || c._id) === String(selectedCategory));
    const subcats = (cat?.subcategories || []).map((item: any) => ({
      value: String(item.subcategory_id || item.id),
      label: item.subcategory_name || item.name,
    }));
    setSubCategoryOptions(subcats);
    setSelectedSubCategory("");
  }, [selectedCategory, categoriesData]);

  const applyPlan = async (plan_type: "basic" | "standard" | "premium" | "custom", months?: number, max_products?: number, plan_id?: string) => {
    try {
      const ids = selected.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("Select draft products to activate");
        return;
      }

      // Validate plan capacity for non-custom plans
      if (plan_type !== 'custom' && max_products && ids.length > max_products) {
        toast.error(`Selected plan can only accommodate ${max_products} product${max_products > 1 ? 's' : ''}, but you have selected ${ids.length} products. Please select a higher plan or reduce your selection.`);
        return;
      }

      setLoading(true);
      const body: any = { plan_type: String(plan_type).toLowerCase(), product_ids: ids };
      if (plan_id) body.plan_id = plan_id;
      if (plan_type === "custom") {
        body.months = months;
        body.max_products = max_products;
      }

      await api.post(endPointApi.postCreateListingPlan, body);

      // Show detailed success message
      const planName = plan_type.charAt(0).toUpperCase() + plan_type.slice(1);
      toast.success(
        `🎉 ${planName} plan applied successfully! ${ids.length} product${ids.length > 1 ? 's' : ''} activated and moved from draft to active status.`,
        { autoClose: 5000 }
      );

      // Refresh the data and clear selection
      await fetchDrafts();
      setSelected([]);
      setShowPlanDialog(false);
    } catch (error: any) {
      console.error("Error applying plan:", error);
      const errorMessage = error?.response?.data?.message || "Failed to apply plan";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end mt-4 gap-3">

        {/* <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Drafts</h2> */}
        {/* <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage and activate your draft listings ({rows.length} drafts)
          </p> */}
        <Button
          onClick={fetchDrafts}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 btn-primary"
        >
          {loading ? (
            <Loader type="button" text="Refreshing..." iconClassName="text-white h-4 w-4" />
          ) : (
            <>
              <HiOutlineRefresh className="text-lg" />
              Refresh
            </>
          )}
        </Button>
        {/* Actions Menu (3-dots) */}
        <div className="relative" ref={actionsMenuRef}>
          <button
            onClick={() => setShowActionsMenu((v) => !v)}
            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300 shadow-sm"
            title="Export options"
          >
            <FiMoreVertical className="text-xl" />
          </button>

          {showActionsMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              {/* <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100/30 dark:border-gray-800/30">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Export Options</span>
                  </div> */}

              <div className="py-1">
                <button
                  onClick={handleExportExcel}
                  disabled={excelLoading || pdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                >
                  <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to Excel</span>
                  {excelLoading && <Loader className="ml-auto text-emerald-600 w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleExportPDF}
                  disabled={excelLoading || pdfLoading}
                  className="group w-full flex items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                >
                  <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to PDF</span>
                  {pdfLoading && <Loader className="ml-auto text-rose-600 w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {/* <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Search</Label>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500">
                <MdSearch className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search drafts by name..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchDrafts()}
                  className="px-2 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-white w-full"
                />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Category</Label>
              <SearchableDropdown
                searchable
                options={categoryOptions}
                value={selectedCategory}
                placeholder="Select category"
                onChange={(val) => setSelectedCategory(val)}
              />
            </div>
            <div>
              <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Sub Category</Label>
              <SearchableDropdown
                searchable
                options={subCategoryOptions}
                value={selectedSubCategory}
                placeholder={selectedCategory ? "Select sub category" : "Select category first"}
                onChange={(val) => setSelectedSubCategory(val)}
                disabled={!selectedCategory}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchDrafts} className="px-4 py-2 text-sm font-medium flex-1">
                Apply Filters
              </Button>
              <Button
                onClick={() => { setSearchText(""); setSelectedCategory(""); setSelectedSubCategory(""); setTimeout(() => fetchDrafts(), 0); }}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Clear
              </Button>
        {/* </div>
      </div> */}

      {/* Draft Selection Info */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between  p-4 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <IoMdTrendingUp className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {selected.length} product{selected.length > 1 ? 's' : ''} selected for activation
              </span>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                Choose a plan to activate these draft products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button
              onClick={() => setSelected([])}
              className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Clear Selection
            </Button> */}
            <Button
              onClick={() => setShowPlanDialog(true)}
              disabled={loading}
              className="text-sm font-medium btn-primary disabled:opacity-50 px-4 py-2"
            >
              {loading ? (
                <div className="flex items-center gap-2 ">
                  <Loader type="button" iconClassName="text-white h-4 w-4" />
                  <span>Activating...</span>
                </div>
              ) : (
                'Activate Products'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {rows.length === 0 && !loading ? (
        <div className="text-center py-12 mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CiWarning className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Draft Products
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You don't have any draft products at the moment.
          </p>
          <Button
            onClick={() => window.location.href = '/product/addProduct'}
            className="px-4 py-2 btn-primary"
          >
            Create New Product
          </Button>
        </div>
      ) : (
        <AgGridTable
          columns={columns}
          rowData={rows}
          tableName="Draft Products"
          onSelectionChange={setSelected}
          loading={loading}
          rowHeight={50}
          height={"650px"}
        />
      )}

      {/* Plan Selection Dialog - Using the new component */}
      <PlanSelectionDialog
        isOpen={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        selectedCount={selected.length}
        onApplyPlan={applyPlan}
        selectedProducts={selected}
      />
    </>
  );
}
