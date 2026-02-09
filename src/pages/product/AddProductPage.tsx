"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "@/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Editor } from "primereact/editor";
import { MdDelete } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Radio from "@/components/form/input/Radio";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";

/* <!-- ========================================================== Types ========================================================== --> */

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
    group?: string;
}

interface KeyFeature {
    key: string;
    value: string;
}

type ID = string | number;

interface CategoryOption {
    id: ID;
    name: string;
    image?: string;
}

interface mainImg {
    product_image_id: string;
    image: any;
}

export type Option = {
    value: string;
    label: string;
    image?: string;
};

export default function AddProductPage() {

    /* <!-- ========================================================== States ========================================================== --> */

    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams?.get("id") ?? null;
    const isEditMode = !!productId;

    const [formData, setFormData] = useState<{
        category: string | null;
        subCategory: string | null;
        listingType: string | null;
        name: string;
        dayPrice: string;
        dayCancelPrice: string;
        monthPrice: string;
        monthCancelPrice: string;
        months: { month: string; price: string; productMonthsId: string; cancelPrice: string }[];
        description: string;
        keyFeatures: { key: string; value: string; specification_id?: string }[];
    }>({
        category: null,
        subCategory: null,
        listingType: null,
        name: "",
        dayPrice: "",
        dayCancelPrice: "",
        monthPrice: "",
        monthCancelPrice: "",
        months: [
            { month: "", price: "", productMonthsId: "", cancelPrice: "" }
        ],
        description: "",
        keyFeatures: [{ key: "", value: "" }],
    });

    const [mainPreview, setMainPreview] = useState<mainImg[]>([]);
    const [subPreview, setSubPreview] = useState<string[]>([]);
    const [categoryList, setCategoryList] = useState<Option[]>([]);
    const [subCategoryList, setSubCategoryList] = useState<Option[]>([]);
    const [productTypeOptions, setProductTypeOptions] = useState<Option[]>([]);
    const [listingTypeOptions, setListingTypeOptions] = useState<Option[]>([]);
    const [monthOptions, setMonthOptions] = useState<Option[]>([]);
    const [billingType, setBillingType] = useState<"day" | "month" | "">("");

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [subImages, setSubImages] = useState<File[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

    // Separate validation states for each section
    const [validationErrors, setValidationErrors] = useState<{
        category?: string;
        subCategory?: string;
        listingType?: string;
        name?: string;
        dayPrice?: string;
        dayCancelPrice?: string;
        monthPrice?: string;
        monthCancelPrice?: string;
        months?: string;
        description?: string;
        mainImage?: string;
        billingType?: string;
    }>({});

    /* <!-- ========================================================== disable unavailable months ========================================================== --> */

    const getAvailableMonthsForIndex = (currentIndex: number): Option[] => {
        const selectedMonths = formData.months
            .map((m, idx) => (idx !== currentIndex ? m.month : null))
            .filter(Boolean);

        return monthOptions.filter(
            (option) => !selectedMonths.includes(option.value)
        );
    };

    /* <!-- ========================================================== Input change ========================================================== --> */

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear validation error when user starts typing
        if (validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    /* <!-- =================================================== handle add, change ,remove Feature =================================================== --> */

    const addFeatureField = () => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: [...prev.keyFeatures, { key: "", value: "" }],
        }));
    };

    const removeFeature = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
        }));
    };

    const UpdateFeatureField = (
        index: number,
        field: keyof KeyFeature,
        value: KeyFeature[keyof KeyFeature]
    ) => {
        const updated = [...formData.keyFeatures];
        updated[index][field] = value;

        setFormData((prev) => ({
            ...prev,
            keyFeatures: updated,
        }));
    };

    /* <!-- ============================================ handle add, update, remove Month ============================================ --> */

    const addMonth = () => {
        if (formData.months.length >= 12) return;

        setFormData((prev) => ({
            ...prev,
            months: [
                ...prev.months,
                { month: "", price: "", productMonthsId: "", cancelPrice: "" },
            ],
        }));
    };

    const removeMonth = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            months: prev.months.filter((_, i) => i !== index),
        }));
    };

    const updateMonth = (
        index: number,
        field: keyof typeof formData.months[number],
        value: string
    ) => {
        const updated = [...formData.months];
        updated[index][field] = value;

        setFormData((prev) => ({
            ...prev,
            months: updated,
        }));
        
        // Clear months validation error when user starts filling month data
        if (validationErrors.months) {
            setValidationErrors(prev => ({
                ...prev,
                months: undefined
            }));
        }
    };

    /* <!-- ============================================ handle select rent time ============================================ --> */

    const handleRadioChange = (value: "day" | "month") => {
        setBillingType(value);
        // Clear billing type validation error when user selects
        if (validationErrors.billingType) {
            setValidationErrors(prev => ({
                ...prev,
                billingType: undefined
            }));
        }
    };

    /* <!-- ============================================ Fetch product detail on edit mode  ============================================ --> */

    useEffect(() => {
        if (!isEditMode) return;

        const fetchProductDetails = async () => {
            const formData = new FormData()
            formData.append("product_id", productId || "")
            try {
                const res = await api.post(endPointApi.postVendorProductDetails, formData);
                if (res?.data?.status == 200) {
                    const data = res.data.data;

                    setBillingType(data.product_listing_type_id === "1" ? "day" : "month");

                    setFormData({
                        category: String(data.category_id),
                        subCategory: String(data.sub_category_id),
                        listingType: String(data.product_type_id),
                        name: data.product_name,
                        dayPrice: data.product_listing_type_id === "1" ? data.price : "",
                        dayCancelPrice: data.product_listing_type_id === "1" ? data.cancel_price : "",
                        monthPrice: data.product_listing_type_id !== "1" ? data.price : "",
                        monthCancelPrice: data.product_listing_type_id !== "1" ? data.cancel_price : "",
                        months: data.month_arrr?.length
                            ? data.month_arrr.map((m: any) => ({
                                month: String(m.months_id),
                                price: m.price,
                                productMonthsId: m.product_months_id,
                                cancelPrice: m.cancel_price,
                            }))
                            : [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                        description: data.description,
                        keyFeatures: data.product_details?.length
                            ? data.product_details.map((item: any) => ({
                                specification_id: item.specification_id,
                                key: item.specification,
                                value: item.detail,
                            }))
                            : [{ key: "", value: "" }],
                    });

                    setSelectedCategory(String(data.category_id));

                    const mainImg = { product_image_id: 'temp_1', image: data.product_main_image }
                    setMainPreview([mainImg]);

                    setSubPreview(data.images);

                } else {
                    toast.error(res?.data?.message)
                }
            } catch (err) {
                console.error("Error fetching Product detail to edit", err);
            }
        };

        fetchProductDetails();
    }, [productId, isEditMode]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.post(endPointApi.postCategoryList, {});
                if (res?.data?.data) {
                    const options = res.data.data.map((item: any) => ({
                        label: item.name,
                        value: item.id,
                    }));
                    setCategoryList(options);
                }
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };

        fetchCategories();
    }, []);

    /* <!-- ============================================ Fetch subcategories  ============================================ --> */

    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!selectedCategory) {
                setSubCategoryList([]);
                setSelectedSubCategory(null);
                handleChange("subCategory", null);
                return;
            }

            try {
                const formdata = new FormData();
                formdata.append("category_id", String(selectedCategory));
                const res = await api.post(endPointApi.postSubCategoryList, formdata);

                if (res?.data?.data) {
                    const subcats = res.data.data.map((item: any) => ({
                        value: item.id,
                        label: item.name,
                    }));

                    setSubCategoryList(subcats);

                    if (!isEditMode && subcats.length > 0) {
                        setSelectedSubCategory(subcats[0].value);
                        handleChange("subCategory", subcats[0].value);
                    } else if (isEditMode && formData.subCategory) {
                        setSelectedSubCategory(formData.subCategory);
                    }
                }
            } catch (err) {
                console.error("Error fetching subcategories", err);
                toast.error("Error loading subcategories");
            }
        };

        fetchSubCategories();
    }, [formData.category, selectedCategory]);

    /* <!-- ============================================ Fetch dropdown options  ============================================ --> */

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.post(endPointApi.postProductDropDownList, {});

                const resData = res.data.data;
                setProductTypeOptions(
                    resData.products_type.map((item: any) => ({
                        value: item.id,
                        label: item.product_type,
                    }))
                );

                setListingTypeOptions(
                    resData.products_listing_type.map((item: any) => ({
                        value: item.id,
                        label: item.name,
                    }))
                );

                setMonthOptions(
                    resData.products_months.map((item: any) => ({
                        value: item.id,
                        label: item.month_name,
                    }))
                );
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };

        fetchProduct();
    }, []);

    /* <!-- ============================================ Validate Form ============================================ --> */

    const validateForm = (): boolean => {
        const errors: typeof validationErrors = {};

        // Basic field validation (always required)
        if (!formData.category) {
            errors.category = "Please select a category";
        }
        if (!formData.subCategory) {
            errors.subCategory = "Please select a sub category";
        }
        if (!formData.listingType) {
            errors.listingType = "Please select listing type";
        }
        if (!formData.name?.trim()) {
            errors.name = "Please enter item/property name";
        }
        if (!formData.description?.trim()) {
            errors.description = "Please enter description";
        }
        if (!mainImage && (!mainPreview || mainPreview.length === 0)) {
            errors.mainImage = "Please upload main image";
        }

        // Rent Product Validation (only when listingType is "1")
        if (formData.listingType === "1") {
            if (!billingType) {
                errors.billingType = "Please select billing type (Day or Month)";
            }

            if (billingType === "day") {
                if (!formData.dayPrice?.trim()) {
                    errors.dayPrice = "Please enter day price";
                }
                if (!formData.dayCancelPrice?.trim()) {
                    errors.dayCancelPrice = "Please enter day cancel price";
                }
            }

            if (billingType === "month") {
                const hasCompleteRow = formData.months.some(
                    (m) => m.month && m.price?.trim() && m.cancelPrice?.trim()
                );
                if (!hasCompleteRow) {
                    errors.months = "Please add at least one complete month pricing";
                }
                const invalidMonthRows = formData.months.some(
                    (m) => (m.price?.trim() || m.cancelPrice?.trim()) && !m.month
                );
                if (invalidMonthRows) {
                    errors.months = "All month pricing rows must have a month selected";
                }
            }
        }

        // Sell Product Validation (only when listingType is not "1")
        if (formData.listingType && formData.listingType !== "1") {
            if (!formData.monthPrice?.trim()) {
                errors.monthPrice = "Please enter price";
            }
            if (!formData.monthCancelPrice?.trim()) {
                errors.monthCancelPrice = "Please enter cancel price";
            }
        }

        // Set validation errors
        setValidationErrors(errors);

        // Return true if no errors
        return Object.keys(errors).length === 0;
    };

    /* <!-- ============================================ Handle save ============================================ --> */

    const handleSubmit = async () => {
        // First validate form
        if (!validateForm()) {
            return; // Stop if validation fails
        }

        try {
            const formdata = new FormData();

            if (isEditMode === true) {
                formdata.append("product_id", String(productId));
            }

            // ---------- BASIC FIELDS ----------
            formdata.append("category_id", String(selectedCategory || formData.category));
            formdata.append("sub_category_id", String(selectedSubCategory || formData.subCategory));
            formdata.append("product_type_id", String(formData.listingType));

            // Determine listing type based on billingType
            const listingTypeId = billingType === "month" ? "2" : billingType === "day" ? "1" : "";
            formdata.append("product_listing_type_id", listingTypeId);

            formdata.append("product_name", formData.name.trim());
            formdata.append("description", formData.description.trim());

            // ---------- SELL FLOW ----------
            if (formData.listingType !== "1") {
                formdata.append("price", formData.monthPrice.trim());
                formdata.append("cancel_price", formData.monthCancelPrice.trim());
            }

            // ---------- RENT FLOW ----------
            if (formData.listingType === "1") {
                // DAY
                if (billingType === "day") {
                    formdata.append("price", formData.dayPrice.trim());
                    formdata.append("cancel_price", formData.dayCancelPrice.trim());
                }

                // MONTH
                if (billingType === "month") {
                    formData.months.forEach((m: any, index: number) => {
                        if (m.month && m.price?.trim() && m.cancelPrice?.trim()) {
                            formdata.append(`months_id[${index}]`, m.month);
                            formdata.append(`month_price[${index}]`, m.price.trim());
                            formdata.append(`month_cancel_price[${index}]`, m.cancelPrice.trim());
                            if (isEditMode === true && m.productMonthsId) {
                                formdata.append(`product_months_id[${index}]`, m.productMonthsId);
                            }
                        }
                    });
                }
            }

            // ---------- SPECIFICATION ----------
            formData.keyFeatures.forEach((item: any, index: number) => {
                if (item.key?.trim() && item.value?.trim()) {
                    formdata.append(`specification[${index}]`, item.key.trim());
                    formdata.append(`detail[${index}]`, item.value.trim());

                    // EDIT TIME SPECIFICATION ID
                    if (item.specification_id) {
                        formdata.append(`specification_id[${index}]`, item.specification_id);
                    }
                }
            });

            // ---------- IMAGES ----------
            if (mainImage) {
                formdata.append("product_main_image", mainImage);
            }

            subImages.forEach((file, index: number) => {
                formdata.append(`image[${index}]`, file);
            });

            // ---------- API CALL ----------
            const res = await api.post(endPointApi.postVendorAddProduct, formdata);

            if (res?.data?.status === 200) {
                toast.success(isEditMode ? "Product updated successfully!" : "Product added successfully!");
                router.push("/product");
            } else {
                toast.error(res?.data?.message || "Failed to save product");
            }

        } catch (error) {
            console.error("Save product error", error);
            toast.error("Error saving product. Please try again.");
        }
    };

    return (
        <>
            <ComponentCard title={isEditMode ? "Edit Product" : "Add Product"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ================= Row 1: Category & Sub Category ================= */}
                    <div>
                        <Label className="font-semibold mb-2">Category</Label>
                        <SearchableDropdown
                            searchable
                            options={categoryList}
                            value={formData.category}
                            placeholder="Select category"
                            error={!!validationErrors.category}
                            onChange={(val) => {
                                handleChange("category", val);
                                setSelectedCategory(val);
                                handleChange("subCategory", null);
                                setSelectedSubCategory(null);
                            }}
                        />
                        {validationErrors.category && (
                            <p className="text-error text-xs mt-1">{validationErrors.category}</p>
                        )}
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Sub Category
                        </Label>
                        <SearchableDropdown
                            searchable
                            options={subCategoryList}
                            value={formData.subCategory}
                            placeholder="Search sub category..."
                            error={!!validationErrors.subCategory}
                            onChange={(val) => {
                                handleChange("subCategory", val);
                                setSelectedSubCategory(val);
                            }}
                        />
                        {validationErrors.subCategory && (
                            <p className="text-error text-xs mt-1">
                                {validationErrors.subCategory}
                            </p>
                        )}
                    </div>

                    {/* ================= Row 2: Listing Type & Name ================= */}
                    <div >
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Listing Type</Label>
                        <div className="relative">
                            <Select
                                options={productTypeOptions}
                                placeholder="Select Listing Type"
                                value={formData.listingType}
                                onChange={(val) => handleChange("listingType", val)}
                                disabled={isEditMode}
                                className={`rounded-lg py-2 px-3 w-full dark:bg-dark-900 ${validationErrors.listingType
                                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                                <ChevronDownIcon />
                            </span>
                        </div>
                        {validationErrors.listingType && (
                            <p className="text-error text-xs mt-1">{validationErrors.listingType}</p>
                        )}
                    </div>

                    <div >
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Item / Property Name</Label>
                        <div className="flex flex-col">
                            <Input
                                placeholder="Enter Item / Property Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                error={!!validationErrors.name}
                                className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                            />
                            {validationErrors.name && (
                                <span className="mt-1 text-xs text-error">
                                    {validationErrors.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ================= Row 3: Rent Type ================= */}
                    {formData?.listingType === "1" && (
                        <div className="col-span-2 p-4 bg-linear-to-r from-indigo-50 to-indigo-100 dark:from-dark-700 dark:to-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Billing Type</Label>
                            <div className="flex items-center gap-6">
                                <Radio
                                    id="radio-day"
                                    name="billingType"
                                    value="day"
                                    checked={billingType === "day"}
                                    onChange={() => handleRadioChange("day")}
                                    label="Day"
                                    disabled={isEditMode}
                                />
                                <Radio
                                    id="radio-month"
                                    name="billingType"
                                    value="month"
                                    checked={billingType === "month"}
                                    onChange={() => handleRadioChange("month")}
                                    label="Month"
                                    disabled={isEditMode}
                                />
                            </div>
                            {validationErrors.billingType && (
                                <p className="text-error text-xs mt-1">{validationErrors.billingType}</p>
                            )}
                        </div>
                    )}

                    {/* ================= Rent Flow: Day ================= */}
                    {formData?.listingType === "1" && billingType === "day" && (
                        <>
                            <div className="rounded-2xl">
                                <Label>Day Price</Label>
                                <Input
                                    placeholder="Enter Day Price"
                                    type="number"
                                    value={formData.dayPrice}
                                    onChange={(e) => handleChange("dayPrice", e.target.value)}
                                    error={!!validationErrors.dayPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.dayPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.dayPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label>Day Cancel Price</Label>
                                <Input
                                    placeholder="Enter Day Cancel Price"
                                    type="number"
                                    value={formData.dayCancelPrice}
                                    onChange={(e) => handleChange("dayCancelPrice", e.target.value)}
                                    error={!!validationErrors.dayCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.dayCancelPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.dayCancelPrice}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ================= Rent Flow: Month ================= */}
             {formData?.listingType === "1" && billingType === "month" && (
  <div
    className={`col-span-2 rounded-2xl border backdrop-blur ${
      validationErrors.months
        ? "border-error-600 bg-error-50/30 dark:bg-error-600/20"
        : "border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-dark-800"
    }`}
  >
    {/* HEADER */}
    <div className="flex items-center justify-between p-2 md:p-3">
      <Label className="text-lg font-bold text-gray-800 dark:text-gray-100">
        Monthly Pricing
      </Label>

      {formData?.months?.length < 12 && (
        <button
          type="button"
          onClick={addMonth}
          className="btn-primary flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold shadow-sm hover:scale-105 transition"
        >
          + Add Month
        </button>
      )}
    </div>

    {/* MONTH ROWS - COMPACT */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-2">
      {formData?.months?.map((m, index) => (
        <div
          key={index}
          className="bg-white/80 dark:bg-dark-700 rounded-lg p-2 flex items-center gap-2"
        >
          {/* MONTH */}
          <Select
            options={getAvailableMonthsForIndex(index)}
            placeholder="Select Month"
            value={m.month}
            onChange={(val) => updateMonth(index, "month", val)}
            className="text-sm"
          />

          {/* PRICE */}
          <Input
            type="number"
            placeholder="₹ Price"
            value={m.price}
            onChange={(e) => updateMonth(index, "price", e.target.value)}
            className="text-sm px-2 py-1"
          />

          {/* CANCEL PRICE */}
          <Input
            type="number"
            placeholder="₹ Cancel"
            value={m.cancelPrice}
            onChange={(e) => updateMonth(index, "cancelPrice", e.target.value)}
            className="text-sm px-2 py-1"
          />

          {/* REMOVE */}
          {formData.months.length > 1 && (
            <button
              type="button"
              onClick={() => removeMonth(index)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-[rgb(53,66,237)] transition"
              title="Remove Month"
            >
              <MdDelete size={18} />
            </button>
          )}
        </div>
      ))}
    </div>

    {validationErrors.months && (
      <p className="text-error text-xs mt-2 mb-2 px-2">{validationErrors.months}</p>
    )}
  </div>
)}


                    {/* ================= Sell Flow ================= */}
                    {formData?.listingType !== "1" && formData?.listingType != null && (
                        <>
                            <div className="rounded-2xl">
                                <Label>Price</Label>
                                <Input
                                    placeholder="Enter Sell Price"
                                    type="number"
                                    value={formData.monthPrice}
                                    onChange={(e) => handleChange("monthPrice", e.target.value)}
                                    error={!!validationErrors.monthPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.monthPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.monthPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label>Cancel Price</Label>
                                <Input
                                    placeholder="Enter Sell Cancel Price"
                                    type="number"
                                    value={formData.monthCancelPrice}
                                    onChange={(e) => handleChange("monthCancelPrice", e.target.value)}
                                    error={!!validationErrors.monthCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.monthCancelPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.monthCancelPrice}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* <!-- ======================================================== Description  ======================================================== -->*/}

                    {/* LEFT → DESCRIPTION */}
                    <div className="">
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Description</Label>

                        <div
                            className={`rounded-xl overflow-hidden transition-all duration-200
                                      border ${validationErrors.description
                                    ? "border-error-600 focus-within:ring-error-600 focus-within:ring-2"
                                    : "border-gray-300 focus-within:ring-[rgb(53,66,237)] focus-within:ring-2"
                                }`}
                        >
                            <Editor
                                value={formData.description}
                                style={{ height: "280px" }}
                                onTextChange={(e) => handleChange("description", e.htmlValue)}
                                pt={{
                                    toolbar: {
                                        style: {
                                            borderTopLeftRadius: "0.75rem",
                                            borderTopRightRadius: "0.75rem",
                                            border: "none",
                                            borderBottom: "1px solid #e5e7eb",
                                        },
                                        className:
                                            "[&_.ql-toolbar_button]:border-b [&_.ql-toolbar_button]:border-gray-300",
                                    },
                                    content: {
                                        style: {
                                            borderBottomLeftRadius: "0.5rem",
                                            borderBottomRightRadius: "0.5rem",
                                            border: "none",
                                        },
                                    },
                                }}
                            />
                        </div>

                        {validationErrors.description && (
                            <p className="text-error text-xs mt-1">{validationErrors.description}</p>
                        )}
                    </div>

                    {/* <!-- ======================================================== Features  ======================================================== -->*/}

                    <div className="h-[300px] flex flex-col">
                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-2">
                            <Label className="font-semibold text-gray-700 dark:text-gray-200">
                                Key Features
                            </Label>
                            <button
                                type="button"
                                onClick={addFeatureField}
                                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm text-white font-semibold shadow-sm transition hover:scale-105"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgb(53,66,237), rgb(90,102,255))",
                                }}
                            >
                                + Add Feature
                            </button>
                        </div>

                        {/* BORDERED CONTAINER */}
                        <div className="flex-1 rounded-xl border border-gray-300 bg-white/70 backdrop-blur p-2">
                            {/* SCROLLABLE AREA */}
                            <div className="h-[300px] overflow-y-auto space-y-2">
                                {formData?.keyFeatures?.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        {/* FEATURE */}
                                        <Input
                                            type="text"
                                            placeholder="Feature"
                                            value={item.key}
                                            className="h-9 text-sm flex-1 focus:ring-1 focus:ring-[rgb(53,66,237)]"
                                            onChange={(e) =>
                                                UpdateFeatureField(index, "key", e.target.value)
                                            }
                                        />

                                        {/* DESCRIPTION */}
                                        <Input
                                            type="text"
                                            placeholder="Description"
                                            value={item.value}
                                            className="h-9 text-sm flex-1 focus:ring-1 focus:ring-[rgb(53,66,237)]"
                                            onChange={(e) =>
                                                UpdateFeatureField(index, "value", e.target.value)
                                            }
                                        />

                                        {/* DELETE */}
                                        {formData.keyFeatures.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="h-9 w-10 flex items-center justify-center rounded-md text-gray-500 hover:text-[rgb(53,66,237)] transition"
                                                title="Remove feature"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* <!-- ======================================================== Images  ======================================================== -->*/}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ================= Main Image ================= */}
                    <div>
                        <Label>Main Image</Label>
                        <div
                            className={`h-[300px] rounded-lg border transition-all duration-200 
      flex items-center justify-center overflow-hidden
      ${validationErrors.mainImage
                                    ? "border-error-600 focus-within:ring-error-600 focus-within:ring-2"
                                    : "border-gray-300 focus-within:ring-[rgb(53,66,237)] focus-within:ring-2"
                                }`}
                        >
                            <DropzoneComponent
                                preview={mainPreview}
                                setPreview={setMainPreview}
                                multiple={false}
                                smallPreview={true}
                                onFileSelect={(files) => {
                                    setMainImage(files[0]);
                                    // Clear validation error when image is selected
                                    if (validationErrors.mainImage) {
                                        setValidationErrors(prev => ({
                                            ...prev,
                                            mainImage: undefined
                                        }));
                                    }
                                }}
                                isEditMode={isEditMode}
                            />
                        </div>

                        {validationErrors.mainImage && (
                            <p className="text-error text-xs mt-1">{validationErrors.mainImage}</p>
                        )}
                    </div>

                    {/* ================= Sub Images ================= */}
                    <div>
                        <Label>Sub Images (Max 4)</Label>

                        <div className="h-[300px] rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden">
                            <DropzoneComponent
                                preview={subPreview}
                                setPreview={setSubPreview}
                                multiple={true}
                                smallPreview={true}
                                maxFiles={4}
                                onFileSelect={(files) => setSubImages((prev) => [...prev, ...files])}
                                isEditMode={isEditMode}
                            />
                        </div>
                    </div>
                </div>
            </ComponentCard>

            <div className="flex items-center gap-5 mt-5 justify-end ">
                <Button size="sm" variant="primary"
                    onClick={handleSubmit}
                >
                    {isEditMode ? "Update" : "Save"}
                </Button>
                <Button size="sm" variant="outline"
                    onClick={() => router.push("/product")}
                >
                    Cancel
                </Button>
            </div>
        </>
    );
}