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
import { FiArrowLeft } from "react-icons/fi";

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
        hourlyPrice: string;
        hourlyCancelPrice: string;
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
        hourlyPrice: "",
        hourlyCancelPrice: "",
        monthPrice: "",
        monthCancelPrice: "",
        months: [
            { month: "", price: "", productMonthsId: "", cancelPrice: "" }
        ],
        description: "",
        keyFeatures: [{ key: "", value: "" }],
    });

    const [mainPreview, setMainPreview] = useState<mainImg[]>([]);
    const [subPreview, setSubPreview] = useState<any[]>([]);
    const [categoryList, setCategoryList] = useState<Option[]>([]);
    const [subCategoryList, setSubCategoryList] = useState<Option[]>([]);
    const [productTypeOptions, setProductTypeOptions] = useState<Option[]>([]);
    const [listingTypeOptions, setListingTypeOptions] = useState<Option[]>([]);
    const [listingTypeIdMap, setListingTypeIdMap] = useState<Record<string, string>>({});
    const [monthOptions, setMonthOptions] = useState<Option[]>([]);
    const [billingType, setBillingType] = useState<"day" | "month" | "hourly" | "">("");

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [subImages, setSubImages] = useState<File[]>([]);

    const [selectedListingType, setSelectedListingType] = useState<string | null>(null);
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
        hourlyPrice?: string;
        hourlyCancelPrice?: string;
        monthPrice?: string;
        monthCancelPrice?: string;
        // monthsGeneral?: string;
        monthsFields?: { month?: string; price?: string; cancelPrice?: string }[];
        description?: string;
        mainImage?: string;
        billingType?: string;
    }>({});

    const resolveImageUrl = (src?: string) => {
        if (!src) return "";
        const s = String(src);
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        const base = process.env.NEXT_PUBLIC_APP_URL || "";
        if (!base) return s;
        const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
        const trimmedSrc = s.startsWith("/") ? s.slice(1) : s;
        return `${trimmedBase}/${trimmedSrc}`;
    };

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

        // Clear row-level field error
        setValidationErrors(prev => {
            if (!prev.monthsFields) return prev;
            const mf = [...prev.monthsFields];
            mf[index] = { ...(mf[index] || {}) };
            // @ts-expect-error narrow
            mf[index][field] = undefined;
            return { ...prev, monthsFields: mf };
        });
    };

    /* <!-- ============================================ handle select rent time ============================================ --> */

    const handleRadioChange = (value: "day" | "month" | "hourly") => {
        setBillingType(value);
        // Clear unrelated fields when switching billing type
        setFormData(prev => {
            if (value === "day") {
                return {
                    ...prev,
                    // keep day fields
                    hourlyPrice: "",
                    hourlyCancelPrice: "",
                    months: [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                };
            }
            if (value === "hourly") {
                return {
                    ...prev,
                    dayPrice: "",
                    dayCancelPrice: "",
                    months: [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                };
            }
            // value === "month"
            return {
                ...prev,
                dayPrice: "",
                dayCancelPrice: "",
                hourlyPrice: "",
                hourlyCancelPrice: "",
                months: prev.months?.length ? prev.months : [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
            };
        });
        // Clear validation errors not relevant to selected billing type
        setValidationErrors(prev => {
            const next = { ...prev };
            if (value === "day") {
                next.hourlyPrice = undefined;
                next.hourlyCancelPrice = undefined;
                next.monthsFields = undefined;
            } else if (value === "hourly") {
                next.dayPrice = undefined;
                next.dayCancelPrice = undefined;
                next.monthsFields = undefined;
            } else if (value === "month") {
                next.dayPrice = undefined;
                next.dayCancelPrice = undefined;
                next.hourlyPrice = undefined;
                next.hourlyCancelPrice = undefined;
            }
            next.billingType = undefined;
            return next;
        });
    };

    /* <!-- ============================================ Fetch product detail on edit mode  ============================================ --> */

    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!productId) return;
            
            try {
                const res = await api.get(`${endPointApi.postVendorProductDetails}/${productId}`);

                if (res?.data?.status === 200 && res?.data?.data) {
                    const data = res.data.data;
                    const listingTypeName = data.product_listing_type_name?.toLowerCase();
                    const productTypeName = data.product_type_name?.toLowerCase();

                    if (productTypeName === "rent") {
                        if (listingTypeName === "daily") {
                            setBillingType("day");
                        } else if (listingTypeName === "hourly") {
                            setBillingType("hourly");
                        } else if (listingTypeName === "monthly") {
                            setBillingType("month");
                        }
                    } else {
                        setBillingType("");
                    }

                    const monthsInit =
                        data.month_arr?.length
                            ? data.month_arr.map((m: any) => ({
                                month: String(m.months_id || ""),
                                price: String(m.price || ""),
                                productMonthsId: String(m.product_months_id || ""),
                                cancelPrice: String(m.cancel_price || ""),
                            }))
                            : [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }];

                    setFormData({
                        category: String(data.category_id || ""),
                        subCategory: String(data.sub_category_id || ""),
                        listingType: String(data.product_type_id || ""),
                        name: data.product_name || "",
                        dayPrice: productTypeName === "rent" && listingTypeName === "daily" ? String(data.price || "") : "",
                        dayCancelPrice: productTypeName === "rent" && listingTypeName === "daily" ? String(data.cancel_price || "") : "",
                        hourlyPrice: productTypeName === "rent" && listingTypeName === "hourly" ? String(data.price || "") : "",
                        hourlyCancelPrice: productTypeName === "rent" && listingTypeName === "hourly" ? String(data.cancel_price || "") : "",
                        monthPrice: productTypeName === "sell" ? String(data.price || "") : productTypeName === "rent" && listingTypeName === "monthly" ? String(data.price || "") : "",
                        monthCancelPrice: productTypeName === "sell" ? String(data.cancel_price || "") : productTypeName === "rent" && listingTypeName === "monthly" ? String(data.cancel_price || "") : "",
                        months: productTypeName === "rent" && listingTypeName === "monthly" ? monthsInit : [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                        description: data.description || "",
                        keyFeatures: data.product_details?.length
                            ? data.product_details.map((item: any) => ({
                                specification_id: String(item.specification_id || ""),
                                key: item.specification || "",
                                value: item.detail || "",
                            }))
                            : [{ key: "", value: "" }],
                    });

                    setSelectedCategory(String(data.category_id || ""));
                    setSelectedSubCategory(String(data.sub_category_id || ""));
                    setSelectedListingType(data.product_type_name || null);

                    if (data.product_main_image) {
                        setMainPreview([{
                            product_image_id: 'main_img',
                            image: resolveImageUrl(data.product_main_image)
                        }]);
                    }

                    if (data.images?.length) {
                        const subs = data.images.map((img: any) => {
                            if (typeof img === "string") {
                                return { product_image_id: 'existing', image: resolveImageUrl(img) };
                            }
                            return {
                                product_image_id: img.product_image_id || 'existing',
                                image: resolveImageUrl(img.image || '')
                            };
                        });
                        setSubPreview(subs);
                        if (!data.product_main_image && subs.length) {
                            setMainPreview([subs[0]]);
                        }
                    }

                } else {
                    toast.error(res?.data?.message || "Failed to fetch product details");
                }
            } catch (err) {
                console.error("Error fetching product details:", err);
                toast.error("Error loading product details");
            } 
        };

        fetchProductDetails();
    }, [productId]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get(endPointApi.postCategoryList, {});
                if (res?.data?.data) {
                    const options = res.data.data.map((item: any) => ({
                        label: item.categories_name,
                        value: item.id,
                        image: item.image,
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
                const res = await api.get(`${endPointApi.postSubCategoryList}?categoryId=${selectedCategory}`, {});

                if (res?.data?.data) {
                    const subcats = res.data.data.map((item: any) => ({
                        value: item.id,
                        label: item.name,
                        image: item.image,
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
                const res = await api.get(endPointApi.postProductDropDownList, {});

                const resData = res?.data;
                if (resData) {
                    setProductTypeOptions(
                        resData?.products_type?.map((item: any) => ({
                            value: item.id,
                            label: item.product_type,
                        })) || []
                    );

                    setListingTypeOptions(
                        resData.products_listing_type?.map((item: any) => ({
                            value: item.id,
                            label: item.name,
                        })) || []
                    );

                    // Create mapping for listing type IDs
                    const idMap: Record<string, string> = {};
                    resData.products_listing_type?.forEach((item: any) => {
                        const name = item.name?.toLowerCase();
                        if (name === "daily") idMap["day"] = item.id;
                        else if (name === "hourly") idMap["hourly"] = item.id;
                        else if (name === "monthly") idMap["month"] = item.id;
                    });
                    setListingTypeIdMap(idMap);

                    setMonthOptions(
                        resData.products_months?.map((item: any) => ({
                            value: item.id,
                            label: item.month_name,
                        })) || []
                    );
                }
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };

        fetchProduct();
    }, []);

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

        // Rent Product Validation (only when listingType is "Rent")
        if (selectedListingType === "Rent") {
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

            if (billingType === "hourly") {
                if (!formData.hourlyPrice?.trim()) {
                    errors.hourlyPrice = "Please enter hourly price";
                }
                if (!formData.hourlyCancelPrice?.trim()) {
                    errors.hourlyCancelPrice = "Please enter hourly cancel price";
                }
            }

            if (billingType === "month") {
                const rows = formData.months;
                const rowErrors: { month?: string; price?: string; cancelPrice?: string }[] = rows.map(() => ({}));

                // Check if ANY row has any field filled
                const anyRowHasData = rows.some(m =>
                    !!m.month || !!m.price?.trim() || !!m.cancelPrice?.trim()
                );

                rows.forEach((m, idx) => {
                    const monthSelected = !!m.month;
                    const priceFilled = !!m.price?.trim();
                    const cancelFilled = !!m.cancelPrice?.trim();
                    const rowHasData = monthSelected || priceFilled || cancelFilled;

                    if (!anyRowHasData) {
                        // Scenario A: No row has any data → validate ALL rows
                        if (!monthSelected) rowErrors[idx].month = "Please select month";
                        if (!priceFilled) rowErrors[idx].price = "Please enter price";
                        if (!cancelFilled) rowErrors[idx].cancelPrice = "Please enter cancel price";
                    } else if (rowHasData) {
                        // Scenario B: At least one row has data → validate ONLY rows that have data
                        if (!monthSelected) {
                            rowErrors[idx].month = "Please select month";
                        } else {
                            if (!priceFilled) rowErrors[idx].price = "Please enter price";
                            if (!cancelFilled) rowErrors[idx].cancelPrice = "Please enter cancel price";
                        }
                    }
                    // If anyRowHasData is true but this row has no data → skip validation
                });

                if (rowErrors.some(e => e.month || e.price || e.cancelPrice)) {
                    errors.monthsFields = rowErrors;
                }
            }
        }

        // Sell Product Validation (only when listingType is "Sell")
        if (selectedListingType === "Sell") {
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

            // Edit mode uses URL param; no need to append product_id

            // ---------- BASIC FIELDS ----------
            formdata.append("category_id", String(selectedCategory || formData.category));
            formdata.append("sub_category_id", String(selectedSubCategory || formData.subCategory));
            formdata.append("product_type_id", String(formData.listingType));

            // Determine listing type based on billingType
            const listingTypeId =
                billingType === "month"
                    ? listingTypeIdMap["month"] || ""
                    : billingType === "day"
                        ? listingTypeIdMap["day"] || ""
                        : billingType === "hourly"
                            ? listingTypeIdMap["hourly"] || ""
                            : "";
            formdata.append("product_listing_type_id", listingTypeId);

            formdata.append("product_name", formData.name.trim());
            formdata.append("description", formData.description.trim());

            // ---------- SELL FLOW ----------
            const isSell = selectedListingType === "Sell";
            const isRent = selectedListingType === "Rent";
            if (isSell) {
                formdata.append("price", formData.monthPrice.trim());
                formdata.append("cancel_price", formData.monthCancelPrice.trim());
            }

            // ---------- RENT FLOW ----------
            if (isRent) {
                // DAY
                if (billingType === "day") {
                    formdata.append("price", formData.dayPrice.trim());
                    formdata.append("cancel_price", formData.dayCancelPrice.trim());
                }

                // HOURLY
                if (billingType === "hourly") {
                    formdata.append("price", formData.hourlyPrice.trim());
                    formdata.append("cancel_price", formData.hourlyCancelPrice.trim());
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

            subImages.forEach((file) => {
                formdata.append("image[]", file);
            });

            // ---------- API CALL ----------
            const url = isEditMode
                ? `${endPointApi.updateVendorProductDetails}/${productId}`
                : endPointApi.postVendorAddProduct;
            const res = isEditMode
                ? await api.put(url, formdata)
                : await api.post(url, formdata);

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

            <ComponentCard title="">
                <div className="flex items-center justify-between mb-6">

                    {/* Left Section */}
                    <div className="flex items-center gap-4">

                        {/* Back Arrow */}
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition"
                        >
                            <FiArrowLeft className="text-lg" />
                        </button>

                        {/* Blue Line + Title */}
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-1 bg-blue-600 rounded-full"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {isEditMode ? "Edit Product" : "Add Product"}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isEditMode ? "Update product details" : "Fill details to create a new product"}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

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

                    <div>
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Listing Type
                        </Label>

                        <SearchableDropdown
                            options={productTypeOptions}
                            value={formData.listingType}
                            placeholder="Select Listing Type"
                            searchable={false}
                            error={!!validationErrors.listingType}
                            onChange={(val) => {
                                handleChange("listingType", val);
                                const selected = productTypeOptions.find(opt => opt.value === val);
                                const label = selected?.label || null;
                                setSelectedListingType(label);
                                // When switching to Sell, clear rent-specific fields
                                if (label === "Sell") {
                                    setBillingType("");
                                    setFormData(prev => ({
                                        ...prev,
                                        dayPrice: "",
                                        dayCancelPrice: "",
                                        hourlyPrice: "",
                                        hourlyCancelPrice: "",
                                        months: [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                                    }));
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        billingType: undefined,
                                        dayPrice: undefined,
                                        dayCancelPrice: undefined,
                                        hourlyPrice: undefined,
                                        hourlyCancelPrice: undefined,
                                        monthsFields: undefined,
                                    }));
                                }
                            }}
                            disabled={isEditMode}
                        />

                        {validationErrors.listingType && (
                            <p className="text-error text-xs mt-1">
                                {validationErrors.listingType}
                            </p>
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
                    {selectedListingType === "Rent" && (
                        <div className="col-span-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
                                <Radio
                                    id="radio-hourly"
                                    name="billingType"
                                    value="hourly"
                                    checked={billingType === "hourly"}
                                    onChange={() => handleRadioChange("hourly")}
                                    label="Hourly"
                                    disabled={isEditMode}
                                />
                            </div>
                            {validationErrors.billingType && (
                                <p className="text-error text-xs mt-1">{validationErrors.billingType}</p>
                            )}
                        </div>
                    )}

                    {/* ================= Rent Flow: Day ================= */}
                    {selectedListingType === "Rent" && billingType === "day" && (
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

                    {/* ================= Rent Flow: Hourly ================= */}
                    {selectedListingType === "Rent" && billingType === "hourly" && (
                        <>
                            <div className="rounded-2xl">
                                <Label>Hourly Price</Label>
                                <Input
                                    placeholder="Enter Hourly Price"
                                    type="number"
                                    value={formData.hourlyPrice}
                                    onChange={(e) => handleChange("hourlyPrice", e.target.value)}
                                    error={!!validationErrors.hourlyPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.hourlyPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.hourlyPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label>Hourly Cancel Price</Label>
                                <Input
                                    placeholder="Enter Hourly Cancel Price"
                                    type="number"
                                    value={formData.hourlyCancelPrice}
                                    onChange={(e) => handleChange("hourlyCancelPrice", e.target.value)}
                                    error={!!validationErrors.hourlyCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.hourlyCancelPrice && (
                                    <p className="mt-1 text-xs text-error">
                                        {validationErrors.hourlyCancelPrice}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ================= Rent Flow: Month ================= */}
                    {selectedListingType === "Rent" && billingType === "month" && (
                        <div
                            className={`col-span-2 pb-2 rounded-2xl border backdrop-blur
                                border-gray-200 dark:border-gray-700
                                bg-white/70 dark:bg-gray-900/70
                            `}
                        >

                            {/* HEADER */}
                            <div className="flex items-center justify-between p-3 md:p-3">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-2">
                                {formData?.months?.map((m, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/80 dark:bg-gray-800/80 rounded-lg  flex flex-col md:flex-row items-start md:items-center gap-2"
                                    >
                                        {/* MONTH */}
                                        <div className="w-full md:w-1/3">
                                            <div className="min-h-[68px] mt-1"> {/* Using min-height instead of fixed height */}
                                                <SearchableDropdown
                                                    searchable
                                                    options={getAvailableMonthsForIndex(index)}
                                                    value={m.month}
                                                    placeholder="Select Month"
                                                    onChange={(val) => updateMonth(index, "month", val)}
                                                    error={!!validationErrors.monthsFields?.[index]?.month}
                                                    errorMessage={validationErrors.monthsFields?.[index]?.month}
                                                    usePortal
                                                />
                                            </div>
                                        </div>

                                        {/* PRICE */}
                                        <div className="w-full md:w-1/3">
                                            <div className="min-h-[68px]"> {/* Using min-height instead of fixed height */}
                                                <Input
                                                    type="number"
                                                    placeholder="₹ Price"
                                                    value={m.price}
                                                    onChange={(e) => updateMonth(index, "price", e.target.value)}
                                                    error={!!validationErrors.monthsFields?.[index]?.price}
                                                    errorMessage={validationErrors.monthsFields?.[index]?.price}
                                                />
                                            </div>
                                        </div>

                                        {/* CANCEL PRICE */}
                                        <div className="w-full md:w-1/3">
                                            <div className="min-h-[68px]"> {/* Using min-height instead of fixed height */}
                                                <Input
                                                    type="number"
                                                    placeholder="₹ Cancel"
                                                    value={m.cancelPrice}
                                                    onChange={(e) => updateMonth(index, "cancelPrice", e.target.value)}
                                                    error={!!validationErrors.monthsFields?.[index]?.cancelPrice}
                                                    errorMessage={validationErrors.monthsFields?.[index]?.cancelPrice}
                                                />
                                            </div>
                                        </div>

                                        {/* REMOVE */}
                                        {formData.months.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMonth(index)}
                                                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition mb-7"
                                                title="Remove Month"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* ================= Sell Flow ================= */}
                    {selectedListingType === "Sell" && (
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

                    {/* ================= LEFT – DESCRIPTION EDITOR (FIXED) ================= */}
                    <div className="">
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-4 ">
                            Description
                        </Label>

                        <div
                            className={`rounded-xl overflow-hidden transition-all duration-200 border ${validationErrors.description
                                ? "border-error-600 focus-within:ring-error-600 focus-within:ring-2"
                                : "border-gray-300 focus-within:ring-blue-500 focus-within:ring-2"
                                }`}
                        >
                            <Editor
                                className="dark:text-white"
                                value={formData.description}
                                onTextChange={(e) => handleChange("description", e.htmlValue)}
                                style={{ height: "280px" }}
                                pt={{
                                    toolbar: {
                                        style: {
                                            borderTopLeftRadius: "0.75rem",
                                            borderTopRightRadius: "0.75rem",
                                            border: "none",
                                            borderBottom: "1px solid #e5e7eb",
                                        },
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
                                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm text-white btn-primary font-semibold shadow-sm transition hover:scale-105"

                            >
                                + Add Feature
                            </button>
                        </div>

                        {/* BORDERED CONTAINER */}
                        <div className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-2 dark:border-white">
                            <div className="h-[300px] overflow-y-auto space-y-2">
                                {formData?.keyFeatures?.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 pt-1 px-1"
                                    >
                                        {/* FEATURE */}
                                        <Input
                                            type="text"
                                            placeholder="Feature"
                                            value={item.key}
                                            className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
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
                    <div>
                        <Label>Main Image</Label>
                        <div
                            className={`h-[300px] rounded-lg border transition-all duration-200 
                                flex items-center justify-center overflow-hidden
                                ${validationErrors.mainImage
                                    ? "border-error-600 focus-within:ring-error-600 focus-within:ring-2"
                                    : "border-gray-300 focus-within:ring-blue-500 focus-within:ring-2"
                                }`}
                        >
                            <DropzoneComponent
                                preview={mainPreview}
                                setPreview={setMainPreview}
                                multiple={false}
                                smallPreview={true}
                                onFileSelect={(files) => {
                                    setMainImage(files[0]);
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

                        <div className="h-[300px] rounded-lg border focus-within:ring-blue-500 focus-within:ring-2 border-gray-300 flex items-center justify-center overflow-hidden">
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
                    className="btn-primary"
                    onClick={handleSubmit}
                >
                    {isEditMode ? "Update" : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="py-2 px-5"
                    onClick={() => router.push("/product")}
                >
                    Cancel
                </Button>
            </div>
        </>
    );
}
