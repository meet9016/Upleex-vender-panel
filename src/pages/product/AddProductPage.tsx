'use client';

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
import { getAvailableMonths } from "@/utils/helper";
import { MdDelete, } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Radio from "@/components/form/input/Radio";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";

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

// ---------- Types ----------
type ID = string | number;

interface CategoryOption {
    id: ID;
    name: string;
    image?: string;
}

const typeOptions: SelectOption[] = [
    { value: 'rent', label: 'Rent' },
    { value: 'sell', label: 'Sell' },
];

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

    const [selectedCategory, setSelectedCategory] =
        useState<string | null>(null);

    const [selectedSubCategory, setSelectedSubCategory] =
        useState<string | null>(null);

    const [submitAttempted, setSubmitAttempted] = useState(false);

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
        // Reset validation errors when listing type changes so new conditional fields don't show errors immediately
        if (field === "listingType") {
            setSubmitAttempted(false);
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
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
                { month: "", price: "", productMonthsId: "", cancelPrice: "" }, // <-- add month field
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
    };

    /* <!-- ============================================ handle select rent time ============================================ --> */

    const handleRadioChange = (value: "day" | "month") => {
        setBillingType(value);
        // Reset validation errors when billing type changes so new conditional fields don't show errors immediately
        setSubmitAttempted(false);
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
                    setCategoryList(res.data.data);

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
                        label: item.name, // ✅ TEXT ONLY
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

    /* <!-- ============================================ Handle save ============================================ --> */


    const validateForm = (): boolean => {
        // Basic field validation
        if (!formData.category) {
            toast.error("Please select a category");
            return false;
        }
        if (!formData.subCategory) {
            toast.error("Please select a sub category");
            return false;
        }
        if (!formData.listingType) {
            toast.error("Please select listing type");
            return false;
        }
        if (!formData.name?.trim()) {
            toast.error("Please enter item/property name");
            return false;
        }
        if (!formData.description?.trim()) {
            toast.error("Please enter description");
            return false;
        }
        if (!mainImage && (!mainPreview || mainPreview.length === 0)) {
            toast.error("Please upload main image");
            return false;
        }

        // Rent Product Validation
        if (formData.listingType === "1") {
            if (!billingType) {
                toast.error("Please select billing type (Day or Month)");
                return false;
            }

            if (billingType === "day") {
                if (!formData.dayPrice?.trim()) {
                    toast.error("Please enter day price");
                    return false;
                }
                if (!formData.dayCancelPrice?.trim()) {
                    toast.error("Please enter day cancel price");
                    return false;
                }
            }

            if (billingType === "month") {
                const hasCompleteRow = formData.months.some(
                    (m) => m.month && m.price?.trim() && m.cancelPrice?.trim()
                );
                if (!hasCompleteRow) {
                    toast.error("Please add at least one complete month pricing");
                    return false;
                }
                const invalidMonthRows = formData.months.some(
                    (m) => (m.price?.trim() || m.cancelPrice?.trim()) && !m.month
                );
                if (invalidMonthRows) {
                    toast.error("All month pricing rows must have a month selected");
                    return false;
                }
            }
        }

        // Sell Product Validation
        if (formData.listingType && formData.listingType !== "1") {
            if (!formData.monthPrice?.trim()) {
                toast.error("Please enter price");
                return false;
            }
            if (!formData.monthCancelPrice?.trim()) {
                toast.error("Please enter cancel price");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        setSubmitAttempted(true);
        if (!validateForm()) {
            return; // Error messages are shown in validateForm now
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
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Category</Label>
                        <div className="relative">
                            <Select
                                options={categoryList}
                                placeholder="Select Category"
                                value={formData.category ?? ""}
                                onChange={(val: string) => {
                                    handleChange("category", val);
                                    setSelectedCategory(val);
                                    handleChange("subCategory", null);
                                    setSelectedSubCategory(null);
                                }}
                                className={`rounded-lg py-2 px-3 w-full dark:bg-dark-900 ${submitAttempted && !formData.category
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                                <ChevronDownIcon />
                            </span>
                        </div>
                        {submitAttempted && !formData.category && (
                            <p className="text-red-500 text-xs mt-1">Category is required</p>
                        )}
                    </div>

                    <div >
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Sub Category</Label>
                        <div className="relative">
                            <Select
                                options={subCategoryList}
                                placeholder="Select Sub Category"
                                value={formData.subCategory ?? ""}
                                onChange={(val: string) => {
                                    handleChange("subCategory", val);
                                    setSelectedSubCategory(val);
                                }}
                                className={`rounded-lg py-2 px-3 w-full dark:bg-dark-900 ${submitAttempted && !formData.subCategory
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                                <ChevronDownIcon />
                            </span>
                        </div>
                        {submitAttempted && !formData.subCategory && (
                            <p className="text-red-500 text-xs mt-1">Sub Category is required</p>
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
                                className={`rounded-lg py-2 px-3 w-full dark:bg-dark-900 ${submitAttempted && !formData.listingType
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                                <ChevronDownIcon />
                            </span>
                        </div>
                        {submitAttempted && !formData.listingType && (
                            <p className="text-red-500 text-xs mt-1">Listing Type is required</p>
                        )}
                    </div>

                    <div >
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Item / Property Name</Label>
                        <Input
                            placeholder="Enter Item / Property Name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            error={submitAttempted && !formData.name?.trim()}
                            errorMessage={submitAttempted && !formData.name?.trim() ? "Item name is required" : undefined}
                            className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                        />
                    </div>

                    {/* ================= Row 3: Rent Type ================= */}
                    {formData?.listingType === "1" && (
                        <div className="col-span-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-dark-700 dark:to-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
                            {submitAttempted && !billingType && (
                                <p className="text-red-500 text-xs mt-1">Please select Day or Month</p>
                            )}
                        </div>
                    )}

                    {/* ================= Rent Flow: Day ================= */}
                    {formData?.listingType === "1" && billingType === "day" && (
                        <>
                            <div className="rounded-2xl ">
                                <Label>Day Price</Label>
                                <Input
                                    placeholder="Enter Day Price"
                                    type="number"
                                    value={formData.dayPrice}
                                    onChange={(e) => handleChange("dayPrice", e.target.value)}
                                    error={submitAttempted && !formData.dayPrice?.trim()}
                                    errorMessage={submitAttempted && !formData.dayPrice?.trim() ? "Day Price is required" : undefined}
                                />
                            </div>

                            <div className="rounded-2xl">
                                <Label>Day Cancel Price</Label>
                                <Input
                                    placeholder="Enter Day Cancel Price"
                                    type="number"
                                    value={formData.dayCancelPrice}
                                    onChange={(e) => handleChange("dayCancelPrice", e.target.value)}
                                    error={submitAttempted && !formData.dayCancelPrice?.trim()}
                                    errorMessage={submitAttempted && !formData.dayCancelPrice?.trim() ? "Day Cancel Price is required" : undefined}
                                />
                            </div>
                        </>
                    )}

                    {/* ================= Rent Flow: Month ================= */}
                    {formData?.listingType === "1" && billingType === "month" && (
                        <div className={`col-span-2 p-4 rounded-2xl border backdrop-blur ${
                            submitAttempted && 
                            !formData.months.some((m) => m.month && m.price?.trim() && m.cancelPrice?.trim())
                                ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                                : "border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-dark-800"
                        }`}>
                            {/* HEADER */}
                            <div className="flex items-center justify-between ">
                                <Label className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    Monthly Pricing
                                </Label>

                                {formData?.months?.length < 12 && (
                                    <button
                                        type="button"
                                        onClick={addMonth}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-semibold shadow-md hover:scale-105 transition"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, rgb(53,66,237), rgb(90,102,255))",
                                        }}
                                    >
                                        + Add Month
                                    </button>
                                )}
                            </div>

                            {/* MONTH ROWS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {formData?.months?.map((m, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/80 dark:bg-dark-700 rounded-xl p-3 flex items-center gap-2"
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
                                            onChange={(e) =>
                                                updateMonth(index, "price", e.target.value)
                                            }
                                            className="text-sm"
                                        />

                                        {/* CANCEL PRICE */}
                                        <Input
                                            type="number"
                                            placeholder="₹ Cancel"
                                            value={m.cancelPrice}
                                            onChange={(e) =>
                                                updateMonth(index, "cancelPrice", e.target.value)
                                            }
                                            className="text-sm"
                                            errorMessage={submitAttempted && !m.cancelPrice?.trim() ? "Cancel Price is required" : undefined}
                                        />

                                        {/* REMOVE */}
                                        {formData.months.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMonth(index)}
                                                className="h-9 w-9 flex items-center justify-center rounded-md text-gray-500 hover:text-[rgb(53,66,237)]  transition"
                                                title="Remove Month"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {submitAttempted && 
                            !formData.months.some((m) => m.month && m.price?.trim() && m.cancelPrice?.trim()) && (
                                <p className="text-red-500 text-xs mt-3">Please add at least one complete month pricing (Month, Price, Cancel Price)</p>
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
                                      error={submitAttempted && !formData.monthPrice?.trim()}
                                    errorMessage={submitAttempted && !formData.monthPrice?.trim() ? " Sell Price is required" : undefined}
                                />
                            </div>
                            <div className="rounded-2x">
                                <Label>Cancel Price</Label>
                                <Input
                                    placeholder="Enter Sell Cancel Price"
                                    type="number"
                                    value={formData.monthCancelPrice}
                                    onChange={(e) => handleChange("monthCancelPrice", e.target.value)}
                                      error={submitAttempted && !formData.monthCancelPrice?.trim()}
                                    errorMessage={submitAttempted && !formData.monthCancelPrice?.trim() ? "Sell Cancel Price is required" : undefined}
                                />
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
                                      border ${submitAttempted && !formData.description?.trim()
                                    ? "border-red-500 focus-within:ring-red-500 focus-within:ring-2"
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
                                            borderBottom: "1px solid #e5e7eb", // toolbar bottom border
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

                        {submitAttempted && !formData.description?.trim() && (
                            <p className="text-red-500 text-xs mt-1">Description is required</p>
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
      ${submitAttempted && !mainImage && (!mainPreview || mainPreview.length === 0)
                                    ? "border-red-500 focus-within:ring-red-500 focus-within:ring-2"
                                    : "border-gray-300 focus-within:ring-[rgb(53,66,237)] focus-within:ring-2"
                                }`}
                        >
                            <DropzoneComponent
                                preview={mainPreview}
                                setPreview={setMainPreview}
                                multiple={false}
                                smallPreview={true}
                                onFileSelect={(files) => setMainImage(files[0])}
                                isEditMode={isEditMode}
                            />
                        </div>

                        {submitAttempted && !mainImage && (!mainPreview || mainPreview.length === 0) && (
                            <p className="text-red-500 text-xs mt-1">Main image is required</p>
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

            </ComponentCard >
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