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
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subCategoryOptions, setSubCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [customMonths, setCustomMonths] = useState<number>(2);
  const [customMaxProducts, setCustomMaxProducts] = useState<number>(1);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const customMobileRef = useRef<string>("");
  const [confirmPlan, setConfirmPlan] = useState<any>(null);
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
              className="w-12 h-12 object-cover rounded border"
              onError={(e: any) => { if (e.target.src !== DEFAULT_PLACEHOLDER) e.target.src = DEFAULT_PLACEHOLDER; }}
              loading="lazy"
            />
            <div className="flex flex-col">
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
    { field: "expires_at", headerName: "Expires On", width: 240, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString() : "-", cellStyle: { textAlign: "center" } },
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
      const params = new URLSearchParams();
      params.append("status", "draft");
      if (searchText.trim()) params.append("search", searchText.trim());
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedSubCategory) params.append("sub_category_id", selectedSubCategory);
      const url = `${endPointApi.postAllVendorProductList}?${params.toString()}`;
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
  useEffect(() => { fetchDrafts(); }, []);

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

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get((endPointApi as any).getPlanOptions as string);
      const list = res?.data?.data || [];
      const normalized = list.map((p: any) => ({
        key: p.plan_type,
        id: p._id || p.id,
        name: p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1),
        description: p.description ||  `${p.months} months, up to ${p.max_products} products`,
        price: p.amount,
        duration_months: p.months,
        product_limit: p.max_products,
         popular: p.popular || false,
      }));
      setPlans(normalized);
    } catch (e) {
      setPlans([
        { key: 'basic', name: 'Basic', description: '2 months, 1 product', price: 39, duration_months: 2, product_limit: 1 },
        { key: 'standard', name: 'Standard', description: '5 months, up to 3 products', price: 59, duration_months: 5, product_limit: 3 },
        { key: 'premium', name: 'Premium', description: '12 months, up to 7 products', price: 109, duration_months: 12, product_limit: 7 },
      ]);
    } finally {
      setPlansLoading(false);
    }
  };

  const applyPlan = async (plan_type: "basic" | "standard" | "premium" | "custom", months?: number, max_products?: number, plan_id?: string) => {
    try {
      const ids = selected.map((r) => r._id || r.id);
      if (!ids.length) {
        toast.info("Select draft products to activate");
        return;
      }
      const body: any = { plan_type: String(plan_type).toLowerCase(), product_ids: ids };
      if (plan_id) body.plan_id = plan_id;
      if (plan_type === "custom") {
        body.months = months;
        body.max_products = max_products;
      }
      await api.post(endPointApi.postCreateListingPlan, body);
      toast.success("Plan applied successfully! Selected products activated.");
      fetchDrafts();
      setSelected([]);
      setShowPlanDialog(false);
    } catch (error) {
      console.error("Error applying plan:", error);
      toast.error("Failed to apply plan");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage and activate your draft listings ({rows.length} drafts)
        </p>
<Button
  onClick={fetchDrafts}
  disabled={loading}
  className="px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
>
  <HiOutlineRefresh className={`${loading ? "animate-spin" : ""} text-lg`} />
  {/* {loading ? "Refreshing..." : "Refresh"} */}
</Button>
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
            </div>
          </div>
        </div>
      </div> */}

      {/* Draft Button */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {selected.length} product{selected.length > 1 ? 's' : ''} selected
          </span>
          <Button
            onClick={() => { setShowPlanDialog(true); fetchPlans(); }}
            className="text-sm font-medium bg-blue-600 hover:bg-blue-700"
          >
            Activate Products
          </Button>
        </div>
      )}

      {/* Table */}
      <AgGridTable
        columns={columns}
        rowData={rows}
        tableName="Draft Products"
        onSelectionChange={setSelected}
        loading={loading}
      />

      {/* Plan Selection Dialog */}
      
      {showPlanDialog && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]"></div>

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-[100000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">

              {/* Header */}
              <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Choose Your Plan
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Activate {selected.length} selected product{selected.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPlanDialog(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                  {plansLoading ? (
                    <div className="col-span-4 text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
                      <p className="text-sm text-gray-500">Loading plans...</p>
                    </div>
                  ) : (
                    plans.map((plan) => (
                      <div
                        key={plan.key}
                        className={`relative border-2 rounded-xl p-6 transition-all duration-200 group ${
                          plan.popular 
                            ? 'border-[#28a8e9] shadow-lg shadow-[#28a8e9]/20  dark:to-gray-800' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:shadow-lg'
                        }`}
                      >
                        {/* Popular Badge */}
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="flex items-center gap-1 bg-[#28a8e9] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              <span>Your Current Plan</span>
                            </div>
                          </div>
                        )}

                        <div className="text-center">
                          {/* Icon */}
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            plan.popular 
                              ? 'bg-[#28a8e9]/10 dark:bg-[#28a8e9]/30 text-[#28a8e9]' 
                              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'
                          }`}>
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M5 13l4 4L19 7" />
                            </svg>
                          </div>

                          {/* Plan Name with Popular Indicator */}
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h3 className={`text-xl font-bold ${
                              plan.popular ? 'text-[#28a8e9] dark:text-[#28a8e9]' : 'text-gray-700 dark:text-white'
                            }`}>
                              {plan.name}
                            </h3>
                           
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                            {plan.description}
                          </p>

                          {/* Price */}
                          <div className="mb-4">
                            <span className={`text-3xl font-bold ${
                              plan.popular ? 'text-[#28a8e9]' : 'text-gray-900 dark:text-white'
                            }`}>
                              ₹{plan.price}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              /plan
                            </span>
                          </div>

                          {/* Features */}
                          <div className="space-y-2 mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ✓ {plan.duration_months} months duration
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ✓ Up to {plan.product_limit} products
                            </p>
                          </div>

                          {/* Button */}
                          <Button
                            onClick={() =>
                              setConfirmPlan({
                                key: plan.key,
                                name: plan.name,
                                id: plan.id,
                                popular: plan.popular
                              })
                            }
                            className={`w-full py-3 rounded-lg font-medium transition-all ${
                              plan.popular 
                                ? 'btn-primary !py-3.5 text-white shadow-md hover:shadow-lg' 
                                : 'bg-gray-700 hover:bg-gray-800 text-white'
                            }`}
                          >
                            Choose {plan.name}
                          </Button>

                        </div>
                      </div>
                    ))
                  )}

                  {/* Custom Plan Card */}
                  <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-400 hover:shadow-lg transition-all duration-200 group">
                    <div className="text-center">

                      {/* Icon */}
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                        Custom Plan
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Request a custom plan
                      </p>

                      {/* Mobile Input */}
                      <Input
                        type="tel"
                        placeholder="Enter mobile number"
                        onChange={(e: any) => (customMobileRef.current = e.target.value)}
                        className="w-full mb-4"
                      />

                      {/* Button */}
                      <Button
                        onClick={async () => {
                          const mobile = customMobileRef.current?.trim();

                          if (!mobile) {
                            toast.error("Enter mobile number");
                            return;
                          }

                          try {
                            const ids = selected.map((r) => r._id || r.id);

                            await api.post(endPointApi.postCustomPlanRequest, {
                              mobile,
                              product_ids: ids,
                            });

                            toast.success("Request sent. Admin will contact you.");
                            setShowPlanDialog(false);
                          } catch (e) {
                            toast.error("Failed to send request");
                          }
                        }}
                        className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-medium"
                      >
                        Request Callback
                      </Button>

                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
          {confirmPlan && (
            <>
              {/* Overlay */}
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110000]" />

              {/* Modal */}
              <div className="fixed inset-0 flex items-center justify-center z-[110001] p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-8 text-center">

                  {/* Focus Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-14 h-14 flex items-center justify-center rounded-full ${
                      confirmPlan.popular ? 'bg-[#28a8e9] text-[#28a8e9]' : 'bg-indigo-100 text-indigo-600'
                    } text-2xl`}>
                      <CiWarning />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Activate Plan
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    You are about to activate
                  </p>

                  {/* Plan Highlight */}
                  <div className={`rounded-xl py-3 mb-4 border ${
                    confirmPlan.popular 
                      ? 'bg-[#28a8e9] border-[#28a8e9] dark:border-yellow-800' 
                      : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800'
                  }`}>
                    <span className={`text-lg font-semibold ${
                      confirmPlan.popular ? 'text-[#28a8e9]' : 'text-indigo-600'
                    }`}>
                      {confirmPlan.name} Plan
                    </span>
                    {confirmPlan.popular && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <IoMdStar className="text-[#28a8e9] text-sm" />
                        <span className="text-xs text-[#28a8e9]">Most Popular</span>
                        <IoMdStar className="text-[#28a8e9] text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Product Count */}
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    📦 {selected.length} Product{selected.length > 1 ? "s" : ""} selected
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setConfirmPlan(null)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-300 !bg-white hover:bg-gray-100 !text-gray-700"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={() => {
                        applyPlan(
                          confirmPlan.key,
                          undefined,
                          undefined,
                          confirmPlan.id
                        );
                        setConfirmPlan(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-white shadow-lg ${
                        confirmPlan.popular 
                          ? 'bg-[#28a8e9] hover:from-yellow-500 hover:to-yellow-600' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      Confirm
                    </Button>
                  </div>

                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
