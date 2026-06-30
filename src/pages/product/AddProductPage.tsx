"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useDemoAccount } from "@/hooks/useDemoAccount";
import { ChevronDownIcon } from "@/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { Editor } from "primereact/editor";
import { MdDelete } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { compressImage } from "@/utils/imageCompression";
import Radio from "@/components/form/input/Radio";
import Checkbox from "@/components/form/input/Checkbox";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useWallet } from "@/context/WalletContext";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import Tooltip from "@/components/common/Tooltip";

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
    gst?: number;
    hsnCodes?: any[];
};

export default function AddProductPage() {

    /* <!-- ========================================================== States ========================================================== --> */

    const router = useRouter();
    const editorRef = useRef<any>(null);
    const searchParams = useSearchParams();
    const productId = searchParams?.get("id") ?? null;
    const isEditMode = !!productId;
    const { isDemoAccount, checkIsDemoAccount } = useDemoAccount();

    let balance = 0;
    let refreshBalance = async () => { };
    try {
        const walletContext = useWallet();
        balance = walletContext.balance;
        refreshBalance = walletContext.refreshBalance;
    } catch (error) {
        console.warn("Wallet context not available");
    }

    const [formData, setFormData] = useState<{
        category: string | null;
        subCategory: string | null;
        listingType: string | null;
        name: string;
        sku: string;
        hsnCode: string;
        gst: string;
        dayPrice: string;
        dayCancelPrice: string;
        hourlyPrice: string;
        hourlyCancelPrice: string;
        monthPrice: string;
        monthCancelPrice: string;
        months: { month: string; price: string; productMonthsId: string; cancelPrice: string }[];
        description: string;
        keyFeatures: { key: string; value: string; specification_id?: string }[];
        isNew: boolean;
        depositAmount: string;
        availableQuantity: string;
    }>({
        category: null,
        subCategory: null,
        listingType: null,
        name: "",
        sku: "",
        hsnCode: "",
        gst: "",
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
        isNew: false,
        depositAmount: "",
        availableQuantity: "",
    });

    const [mainPreview, setMainPreview] = useState<mainImg[]>([]);
    const [subPreview, setSubPreview] = useState<any[]>([]);
    const [categoryList, setCategoryList] = useState<Option[]>([]);
    const [categoriesData, setCategoriesData] = useState<any[]>([]);
    const [subCategoryList, setSubCategoryList] = useState<Option[]>([]);
    const [productTypeOptions, setProductTypeOptions] = useState<Option[]>([]);
    const [listingTypeOptions, setListingTypeOptions] = useState<Option[]>([]);
    const [listingTypeIdMap, setListingTypeIdMap] = useState<Record<string, string>>({});
    const [monthOptions, setMonthOptions] = useState<Option[]>([]);
    const [billingType, setBillingType] = useState<"day" | "month" | "hourly" | "">("");
    const [pricingType, setPricingType] = useState<"free" | "paid">("free");
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [subImages, setSubImages] = useState<Record<string, File>>({});

    const [selectedListingType, setSelectedListingType] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [vendorBusinessName, setVendorBusinessName] = useState<string>("");
    const [skuCounter, setSkuCounter] = useState<number>(1);
    const [hasGst, setHasGst] = useState<boolean>(false);
    const [freeProductCount, setFreeProductCount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingSKUs, setExistingSKUs] = useState<string[]>([]);
    const [originalSku, setOriginalSku] = useState<string>("");
    console.log("hasGst", hasGst);
    const [validationErrors, setValidationErrors] = useState<{
        category?: string;
        subCategory?: string;
        listingType?: string;
        name?: string;
        sku?: string;
        dayPrice?: string;
        dayCancelPrice?: string;
        hourlyPrice?: string;
        hourlyCancelPrice?: string;
        monthPrice?: string;
        monthCancelPrice?: string;
        // monthsGeneral?: string;
        monthsFields?: { month?: string; price?: string; cancelPrice?: string }[];
        featureFields?: { key?: string; value?: string }[];
        description?: string;
        mainImage?: string;
        billingType?: string;
    }>({});

    const resolveImageUrl = (src?: string) => {
        if (!src) return "";
        const s = String(src);
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        const base = "http://service.digitalks.co.in/s3docs";
        if (!base) return s;
        const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
        const trimmedSrc = s.startsWith("/") ? s.slice(1) : s;
        return `${trimmedBase}/${trimmedSrc}`;
    };

    const generateSKU = (categoryName: string, businessName: string, counter: number): string => {
        // Get first 3 characters of category name (uppercase, remove spaces)
        const categoryCode = categoryName.replace(/\s+/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');

        // Get first 3 characters of business name (uppercase, remove spaces)
        const businessCode = businessName.replace(/\s+/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');

        // Generate 3-digit counter with leading zeros
        const counterCode = counter.toString().padStart(3, '0');

        return `${categoryCode}-${businessCode}-${counterCode}`;
    };

    const fetchVendorProfile = async () => {
        try {
            // Set quick initial value from localStorage while API loads
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                // Set initial business name immediately (will be overridden by API if needed)
                if (user.business_name) {
                    setVendorBusinessName(user.business_name);
                }
                // Set initial hasGst from localStorage if available
                if (user.gst_number !== undefined) {
                    setHasGst(!!user.gst_number);
                }
            }

            // Always call API to get fresh/complete data (especially hasGst)
            const res = await api.post(endPointApi.postFetchVendorKYCFormData as string);
            if (res?.data?.status === 200 && res?.data?.data) {
                const data = res.data.data;
                console.log("vendor data", data);
                const businessName = data.business_name || data.businessName || data.Identity?.business_name;
                if (businessName) setVendorBusinessName(businessName);
                setHasGst(!!(data.Identity?.gst_number || data.gst_number));
            }
        } catch (error) {
            console.error("Error fetching vendor profile:", error);
            // localStorage already set above as initial value, nothing extra needed
            // Final fallback if localStorage also had no name
            setVendorBusinessName(prev => prev || "Vendor");
        }
    };

    const fetchNextSKUCounter = async () => {
        try {
            // Fetch existing products to determine next SKU counter
            const res = await api.get(endPointApi.postAllVendorProductList);
            if (res?.data?.data && Array.isArray(res.data.data)) {
                const products = res.data.data;
                let maxCounter = 0;

                // Find the highest counter from existing SKUs
                products.forEach((product: any) => {
                    if (product.sku) {
                        const skuParts = product.sku.split('-');
                        if (skuParts.length === 3) {
                            const counter = parseInt(skuParts[2], 10);
                            if (!isNaN(counter) && counter > maxCounter) {
                                maxCounter = counter;
                            }
                        }
                    }
                });

                setSkuCounter(maxCounter + 1);

                // Count active free products for current month (aligning with backend monthly limit)
                const freeCount = products.filter((p: any) =>
                    p.pricing_type === 'free' &&
                    ['active', 'draft'].includes(p.status)
                ).length;

                setFreeProductCount(freeCount);

                const skus = products.map((p: any) => p.sku).filter(Boolean);
                setExistingSKUs(skus);
            }
        } catch (error) {
            setSkuCounter(1); // Fallback to 1
        }
    };

    const updateSKU = async () => {
        if (selectedCategory) {
            try {
                const res = await api.post(endPointApi.generateSKU, {
                    category_id: selectedCategory,
                });
                if (res?.data?.success && res?.data?.data?.sku) {
                    handleChange("sku", res.data.data.sku);
                }
            } catch (error) {
                console.error("Error generating SKU:", error);
            }
        }
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

    const handleChange = useCallback((field: string, value: any) => {
        setFormData((prev) => {
            if (prev[field as keyof typeof prev] === value) return prev;
            return {
                ...prev,
                [field]: value,
            };
        });

        // Clear validation error only when user directly interacts with that field
        // Do NOT clear subCategory error when category changes
        setValidationErrors(prev => {
            if (field !== 'subCategory' && prev[field as keyof typeof prev]) {
                return {
                    ...prev,
                    [field]: undefined
                };
            }

            // Clear subCategory error only when user actually selects a subCategory
            if (field === 'subCategory' && value && prev.subCategory) {
                return {
                    ...prev,
                    subCategory: undefined
                };
            }

            return prev;
        });
    }, []);

    const handleNumberInput = useCallback((field: string, value: string, maxLength: number = 10) => {
        // Remove non-numeric characters and limit length
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, maxLength);
        handleChange(field, numericValue);
    }, [handleChange]);


    const addFeatureField = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: [...prev.keyFeatures, { key: "", value: "" }],
        }));
    }, []);

    const removeFeature = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
        }));
    }, []);

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

        // Clear feature error when user types
        setValidationErrors(prev => {
            if (!prev.featureFields) return prev;
            const ff = [...prev.featureFields];
            ff[index] = { ...(ff[index] || {}) };
            ff[index][field] = undefined;
            return { ...prev, featureFields: ff };
        });
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

        // Apply number restriction for price and cancelPrice fields
        if (field === 'price' || field === 'cancelPrice') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            updated[index][field] = numericValue;
        } else {
            updated[index][field] = value;
        }

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

    const handlePricingChange = async (checked: boolean) => {
        const isChecked = checked;

        const isDemoAccount = await checkIsDemoAccount();

        if (isChecked && balance < 10 && !isDemoAccount) {
            toast.error("Insufficient wallet balance. Minimum ₹10 required for Base (Paid listing). Please add money to your wallet.");
            return; // Don't change the state
        }

        setPricingType(isChecked ? "paid" : "free");


    };

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
                    setPricingType(data.pricing_type || "paid");
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
                        sku: data.sku || "",
                        hsnCode: data.hsnCode || "",
                        gst: data.gst !== undefined ? String(data.gst) : "",
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
                        isNew: data.is_new || false,
                        depositAmount: productTypeName === "rent" ? String(data.deposit_amount || "") : "",
                        availableQuantity: String(data.available_quantity || ""),
                    });

                    setSelectedCategory(String(data.category_id || ""));
                    setSelectedSubCategory(String(data.sub_category_id || ""));
                    setSelectedListingType(data.product_type_name || null);
                    setOriginalSku(data.sku || "");

                    if (data.product_main_image) {
                        setMainPreview([{
                            product_image_id: 'main_img',
                            image: resolveImageUrl(data.product_main_image)
                        }]);
                    }

                    if (data.images?.length) {
                        const subs = data.images.map((img: any, idx: number) => {
                            if (typeof img === "string") {
                                return { product_image_id: `existing_${idx}`, image: resolveImageUrl(img) };
                            }
                            return {
                                product_image_id: img.product_image_id || `existing_${idx}`,
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
                toast.error("Error loading product details");
            }
        };

        fetchProductDetails();
    }, [productId]);

    useEffect(() => {
        // Fetch vendor profile always (needed for hasGst, vendorBusinessName etc.)
        fetchVendorProfile();
        // Fetch existing products to get counter and existing SKUs for validation
        fetchNextSKUCounter();
    }, [isEditMode]);

    useEffect(() => {
        // Update SKU when category, business name, or counter changes
        if (!isEditMode && selectedCategory && vendorBusinessName && skuCounter > 0) {
            updateSKU();
        }
    }, [selectedCategory, vendorBusinessName, skuCounter, isEditMode]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get(endPointApi.postCategoryList, {});
                if (res?.data?.data) {
                    const list = res.data.data || [];
                    setCategoriesData(list);
                    const options = list.map((item: any) => ({
                        label: item.categories_name || item.name,
                        value: String(item.categories_id || item.id),
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

    /* <!-- ============================================ Build subcategories from selected category ============================================ --> */

    useEffect(() => {
        if (!selectedCategory) {
            setSubCategoryList([]);
            setSelectedSubCategory(null);
            handleChange("subCategory", null);
            return;
        }

        const cat = categoriesData.find((c: any) => String(c.categories_id || c.id) === String(selectedCategory));
        const subcats = (cat?.subcategories || []).map((item: any) => ({
            value: String(item.subcategory_id || item.id),
            label: item.subcategory_name || item.name,
            image: item.image,
            hsnCodes: item.hsnCodes || [],
            gst: item.gst || 0,
        }));

        setSubCategoryList(subcats);

        if (isEditMode && formData.subCategory && subcats.some((sc: Option) => sc.value === formData.subCategory)) {
            setSelectedSubCategory(formData.subCategory);
            // Also set gst from the selected subcategory
            const selectedSubCat = subcats.find((s: any) => String(s.value) === String(formData.subCategory));
            if (selectedSubCat && (selectedSubCat as any).gst !== undefined) {
                handleChange("gst", String((selectedSubCat as any).gst));
            }
        }
        // No auto-selection or clearing here; user will select manually
    }, [selectedCategory, categoriesData, isEditMode, handleChange]);

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
        if (!formData.sku?.trim()) {
            errors.sku = "SKU is required";
        } else {
            const isDuplicate = existingSKUs.some(sku => sku.toLowerCase() === formData.sku.trim().toLowerCase());
            if (isDuplicate && (!isEditMode || formData.sku.trim().toLowerCase() !== originalSku.toLowerCase())) {
                errors.sku = "This SKU already exists. Please enter a unique SKU.";
            }
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
                errors.billingType = "Please select billing type (Day , Month or Hourly )";
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

        // Feature Validation: If a feature title is present but description is missing
        const featureRows = formData.keyFeatures;
        const featureRowErrors: { key?: string; value?: string }[] = featureRows.map(() => ({}));
        let hasFeatureErrors = false;

        featureRows.forEach((item, idx) => {
            if (item.key?.trim() && !item.value?.trim()) {
                featureRowErrors[idx].value = "Description is required";
                hasFeatureErrors = true;
            }
        });

        if (hasFeatureErrors) {
            setValidationErrors(prev => ({
                ...prev,
                featureFields: featureRowErrors
            }));
            return false;
        }

        // Return true if no errors
        return Object.keys(errors).length === 0;
    };
    /* <!-- ============================================ Handle save ============================================ --> */
    const handleMakeBase = () => {
        setPricingType("paid");
        toast.info("This product is now marked as Base (Paid listing)");
    };
    const handleSubmit = async () => {
        if (isSubmitting) return;

        // First validate form
        if (!validateForm()) {
            return; // Stop if validation fails
        }

        // Check wallet balance
        const isDemoAccount = await checkIsDemoAccount();

        // We rely on the backend to validate free listing limits and general plan quotas.
        // We only do a basic wallet check here for explicitly 'paid' selections without general plan.
        if (pricingType === 'paid') {
            // Note: If they have a general plan, they might have 0 balance but still be able to add paid listings.
            // It's safer to let the backend handle the balance check too.
            // But we keep this basic check for now, or we can just remove it and let the backend decide.
        }

        setIsSubmitting(true);
        try {
            const formdata = new FormData();

            // Edit mode uses URL param; no need to append product_id

            // ---------- BASIC FIELDS ----------
            formdata.append("category_id", String(selectedCategory || formData.category));
            formdata.append("sub_category_id", String(selectedSubCategory || formData.subCategory));
            formdata.append("product_type_id", String(formData.listingType));
            formdata.append("pricing_type", pricingType);
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
            formdata.append("sku", formData.sku.trim());
            formdata.append("hsnCode", formData.hsnCode.trim());
            if (formData.gst.trim()) {
                formdata.append("gst", formData.gst.trim());
            }
            formdata.append("description", formData.description.trim());
            formdata.append("is_new", String(formData.isNew));

            // Determine if it's rent or sell product
            const isSell = selectedListingType === "Sell";
            const isRent = selectedListingType === "Rent";

            // Add deposit amount for rent products
            if (isRent && formData.depositAmount.trim()) {
                formdata.append("deposit_amount", formData.depositAmount.trim());
            }

            // Add available quantity for rent products
            if (isRent && formData.availableQuantity.trim()) {
                formdata.append("available_quantity", formData.availableQuantity.trim());
            }

            // Add available quantity for sell products
            if (isSell && formData.availableQuantity.trim()) {
                formdata.append("available_quantity", formData.availableQuantity.trim());
            }

            // ---------- Sell FLOW ----------
            if (isSell) {
                formdata.append("price", formData.monthPrice.trim());
                formdata.append("cancel_price", formData.monthCancelPrice.trim());
            }

            // ---------- Rent FLOW ----------
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
                const compressedMain = await compressImage(mainImage, 0.8);
                formdata.append("product_main_image", compressedMain);
            }

            // Handle Sub Images
            // 1. New files
            const subFiles = Object.values(subImages);
            for (const file of subFiles) {
                const compressedSub = await compressImage(file, 0.8);
                formdata.append("image", compressedSub);
            }

            // 2. Existing images to keep (from subPreview) - send as indexed array
            if (isEditMode && subPreview.length > 0) {
                const existingImages = subPreview.filter(
                    img => img.image && !img.product_image_id.startsWith('temp_')
                );

                existingImages.forEach((img, index) => {
                    formdata.append(`images[${index}][product_image_id]`, img.product_image_id);
                    formdata.append(`images[${index}][image]`, img.image);
                });
            }

            // ---------- API CALL ----------
            const url = isEditMode
                ? `${endPointApi.updateVendorProductDetails}/${productId}`
                : endPointApi.postVendorAddProduct;
            const res = isEditMode
                ? await api.put(url, formdata)
                : await api.post(url, formdata);

            if ((res?.status >= 200 && res?.status < 300) || (res?.data?.status >= 200 && res?.data?.status < 300)) {
                const msg = res?.data?.message || (isEditMode ? "Product updated successfully!" : "Product added successfully!");
                toast.success(msg);
                setTimeout(() => {
                    router.push("/product");
                }, 500);
            } else {
                toast.error(res?.data?.message || "Failed to save product");
            }

        } catch (error) {
            const anyErr: any = error;
            const backendMsg = anyErr?.response?.data?.message;
            if (backendMsg) {
                toast.error(backendMsg);
            } else {
                toast.error("Error saving product. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>

            <div className="bg-white p-6  dark:bg-gray-800">
                <div className="flex items-center justify-end mb-2">

                    {/* Left Section */}
                    {/* <div className="flex items-center gap-4">

                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition"
                        >
                            <FiArrowLeft className="text-lg" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="h-12 w-1 bg-brand-500 rounded-full"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {isEditMode ? "Edit Product" : "Add Product"}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isEditMode ? "Update product details" : "Fill details to create a new product"}
                                </p>
                            </div>
                        </div>

                    </div> */}
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2">
                        <Checkbox
                            label="Base (Paid listing)"
                            checked={pricingType === "paid"}
                            onChange={handlePricingChange}
                            className={pricingType === "paid" ? "text-blue-700 dark:text-blue-400" : ""}
                        />
                        <Tooltip
                            content="This product will be marked as Base (Paid listing). ₹10 will be deducted from your wallet"
                            position="left"
                        >
                            <FiInfo className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                        </Tooltip>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* ================= Row 1: Category & Sub Category ================= */}
                    <div>
                        <Label required className="font-semibold mb-2">Category</Label>
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
                        <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            Don't see your category? Email us at <a href="mailto:partners@upleex.com" className="text-blue-600 hover:underline font-medium">partners@upleex.com</a> to request it.
                        </p>
                        {validationErrors.category && (
                            <p className="error-message">{validationErrors.category}</p>
                        )}
                    </div>

                    <div>
                        <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                                // Auto-fill GST when subcategory is selected
                                const selectedSubCat = subCategoryList.find((s: any) => String(s.value) === String(val));
                                if (selectedSubCat && (selectedSubCat as any).gst !== undefined) {
                                    handleChange("gst", String((selectedSubCat as any).gst));
                                } else {
                                    handleChange("gst", "");
                                }
                            }}
                        />
                        {validationErrors.subCategory && (
                            <p className="error-message">
                                {validationErrors.subCategory}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                                // Also clear rent fields when switching TO Rent (fresh start)
                                if (label === "Rent") {
                                    setBillingType("");
                                    setFormData(prev => ({
                                        ...prev,
                                        dayPrice: "",
                                        dayCancelPrice: "",
                                        hourlyPrice: "",
                                        hourlyCancelPrice: "",
                                        monthPrice: "",
                                        monthCancelPrice: "",
                                        months: [{ month: "", price: "", productMonthsId: "", cancelPrice: "" }],
                                    }));
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        billingType: undefined,
                                        dayPrice: undefined,
                                        dayCancelPrice: undefined,
                                        hourlyPrice: undefined,
                                        hourlyCancelPrice: undefined,
                                        monthPrice: undefined,
                                        monthCancelPrice: undefined,
                                        monthsFields: undefined,
                                    }));
                                }
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

                            }}
                            disabled={isEditMode}
                        />

                        {validationErrors.listingType && (
                            <p className="error-message">
                                {validationErrors.listingType}
                            </p>
                        )}
                    </div>

                    <div >
                        <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Item / Property Name</Label>
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
                                <span className="error-message">
                                    {validationErrors.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">SKU (Stock Keeping Unit)</Label>
                        <div className="flex flex-col">
                            <Input
                                placeholder="Auto-generated SKU"
                                type="text"
                                value={formData.sku}
                                infoTooltip="SKU ID is automatically generated but can be edited."
                                onChange={(e) => handleChange("sku", e.target.value)}
                                error={!!validationErrors.sku}
                                className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                            />
                            {validationErrors.sku && (
                                <span className="error-message">
                                    {validationErrors.sku}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">HSN Code</Label>
                        <div className="flex flex-col">
                            {(() => {
                                const selectedSubCatData = subCategoryList.find(s => String(s.value) === String(formData.subCategory));
                                const hsnCodeOptions = (selectedSubCatData as any)?.hsnCodes?.map((h: any) => ({
                                    label: `${h.materialType} (HSN: ${h.code})`,
                                    value: h.code
                                })) || [];

                                if (hsnCodeOptions.length > 0) {
                                    return (
                                        <SearchableDropdown
                                            options={hsnCodeOptions}
                                            value={formData.hsnCode}
                                            placeholder="Select Material Type"
                                            onChange={(val) => handleChange("hsnCode", val)}
                                        />
                                    );
                                }
                                return (
                                    <Input
                                        placeholder="HSN Code (inherited if blank)"
                                        type="text"
                                        value={formData.hsnCode}
                                        infoTooltip="Optional: If left blank, it will be automatically fetched from the Sub Category."
                                        onChange={(e) => handleChange("hsnCode", e.target.value)}
                                        className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                    />
                                );
                            })()}
                        </div>
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">GST Rate (%)</Label>
                        <div className="flex flex-col">
                            <SearchableDropdown
                                options={[
                                    { value: "0", label: "0%" },
                                    { value: "3", label: "3%" },
                                    { value: "5", label: "5%" },
                                    { value: "18", label: "18%" },
                                ]}
                                value={formData.gst ? String(formData.gst) : "0"}
                                placeholder="Select GST Rate"
                                onChange={(val) => handleChange("gst", val)}
                                searchable={false}
                            />
                        </div>
                    </div>

                    {/* New Product Checkbox */}
                    <div className="flex items-center gap-3 lg:mt-7 h-[40px]">
                        <Checkbox
                            label="New Product"
                            checked={formData.isNew}
                            onChange={(checked) => handleChange("isNew", checked)}
                        />
                    </div>

                    {/* Deposit Amount - Only for Rent products */}
                    {selectedListingType === "Rent" && (
                        <div>
                            <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Deposit Amount</Label>
                            <div className="flex flex-col">
                                <Input
                                    placeholder="Enter Deposit Amount"
                                    type="text"
                                    value={formData.depositAmount}
                                    onChange={(e) => handleNumberInput("depositAmount", e.target.value)}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {/* <span className="text-xs text-gray-500 mt-1">
                                    Security deposit required for rental
                                </span> */}
                            </div>
                        </div>
                    )}

                    {/* Available Quantity - Only for Rent products */}
                    {selectedListingType === "Rent" && (
                        <div>
                            <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Available Quantity</Label>
                            <div className="flex flex-col">
                                <Input
                                    placeholder="Enter Available Quantity"
                                    type="text"
                                    value={formData.availableQuantity}
                                    onChange={(e) => handleNumberInput("availableQuantity", e.target.value, 6)}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {/* <span className="text-xs text-gray-500 mt-1">
                                    Number of items available for rent
                                </span> */}
                            </div>
                        </div>
                    )}

                    {/* Quantity - Only for Sell products */}
                    {selectedListingType === "Sell" && (
                        <div>
                            <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Available Quantity</Label>
                            <div className="flex flex-col">
                                <Input
                                    placeholder="Enter Available Quantity"
                                    type="text"
                                    value={formData.availableQuantity}
                                    onChange={(e) => handleNumberInput("availableQuantity", e.target.value, 6)}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {/* <span className="text-xs text-gray-500 mt-1">
                                    Number of items available for sale
                                </span> */}
                            </div>
                        </div>
                    )}

                    {/* ================= Row 3: Rent Type ================= */}
                    {selectedListingType === "Rent" && (
                        <div className="lg:col-span-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Billing Type</Label>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
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
                                <p className="error-message">{validationErrors.billingType}</p>
                            )}
                        </div>
                    )}

                    {/* ================= Rent Flow: Day ================= */}
                    {selectedListingType === "Rent" && billingType === "day" && (
                        <>
                            <div className="rounded-2xl">
                                <Label required>Day Price</Label>
                                <Input
                                    placeholder="Enter Day Price"
                                    type="text"
                                    value={formData.dayPrice}
                                    onChange={(e) => handleNumberInput("dayPrice", e.target.value)}
                                    error={!!validationErrors.dayPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.dayPrice && (
                                    <p className="error-message">
                                        {validationErrors.dayPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label required>Day Cancel Price</Label>
                                <Input
                                    placeholder="Enter Day Cancel Price"
                                    type="text"
                                    value={formData.dayCancelPrice}
                                    onChange={(e) => handleNumberInput("dayCancelPrice", e.target.value)}
                                    error={!!validationErrors.dayCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.dayCancelPrice && (
                                    <p className="error-message">
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
                                <Label required>Hourly Price</Label>
                                <Input
                                    placeholder="Enter Hourly Price"
                                    type="text"
                                    value={formData.hourlyPrice}
                                    onChange={(e) => handleNumberInput("hourlyPrice", e.target.value)}
                                    error={!!validationErrors.hourlyPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.hourlyPrice && (
                                    <p className="error-message">
                                        {validationErrors.hourlyPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label required>Hourly Cancel Price</Label>
                                <Input
                                    placeholder="Enter Hourly Cancel Price"
                                    type="text"
                                    value={formData.hourlyCancelPrice}
                                    onChange={(e) => handleNumberInput("hourlyCancelPrice", e.target.value)}
                                    error={!!validationErrors.hourlyCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.hourlyCancelPrice && (
                                    <p className="error-message">
                                        {validationErrors.hourlyCancelPrice}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ================= Rent Flow: Month ================= */}
                    {selectedListingType === "Rent" && billingType === "month" && (
                        <div
                            className={`lg:col-span-2 pb-2 rounded-2xl border backdrop-blur
                                border-gray-200 dark:border-gray-700
                                bg-white/70 dark:bg-gray-900/70
                            `}
                        >

                            {/* HEADER */}
                            <div className="flex items-center justify-between p-3 md:p-3">
                                <Label required className="text-lg font-bold text-gray-800 dark:text-gray-100">
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
                                                    type="text"
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
                                                    type="text"
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
                                                className="h-8 w-8 flex items-center justify-center rounded-md text-red-600 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition mb-7"
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
                                <Label required>Price</Label>
                                <Input
                                    placeholder="Enter Sell Price"
                                    type="text"
                                    value={formData.monthPrice}
                                    onChange={(e) => handleNumberInput("monthPrice", e.target.value)}
                                    error={!!validationErrors.monthPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.monthPrice && (
                                    <p className="error-message">
                                        {validationErrors.monthPrice}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl">
                                <Label required>Cancel Price</Label>
                                <Input
                                    placeholder="Enter Sell Cancel Price"
                                    type="text"
                                    value={formData.monthCancelPrice}
                                    onChange={(e) => handleNumberInput("monthCancelPrice", e.target.value)}
                                    error={!!validationErrors.monthCancelPrice}
                                    className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                                />
                                {validationErrors.monthCancelPrice && (
                                    <p className="error-message">
                                        {validationErrors.monthCancelPrice}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                    {/* ================= LEFT – DESCRIPTION EDITOR (FIXED) ================= */}
                    <div className="h-[250px] md:h-[400px] flex flex-col">
                        <Label required className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Description
                        </Label>

                        <div className="flex-1 flex flex-col">
                            <div
                                onClick={() => editorRef.current?.getQuill().focus()}
                                className={`flex-1 rounded-xl transition-all duration-200 border cursor-text ${validationErrors.description
                                    ? "border-red-400 focus-within:ring-red-400 focus-within:ring-2"
                                    : "border-gray-300 focus-within:ring-blue-500 focus-within:ring-2"
                                    }`}
                            >
                                <Editor
                                    ref={editorRef}
                                    className="dark:text-white"
                                    value={formData.description}
                                    onTextChange={(e) => handleChange("description", e.htmlValue)}
                                    style={{ height: "100%" }}
                                    pt={{
                                        root: {
                                            style: {
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                            },
                                        },
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
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                borderBottomLeftRadius: "0.75rem",
                                                borderBottomRightRadius: "0.75rem",
                                                border: "none",
                                                maxHeight: "280px",
                                                overflowY: "auto",
                                            },
                                        },
                                    }}
                                />
                            </div>

                            {/* Validation message with fixed height space */}
                            <div className="min-h-[20px] mt-1">
                                {validationErrors.description && (
                                    <p className="error-message">{validationErrors.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* <!-- ======================================================== Features  ======================================================== -->*/}

                    <div className="h-[250px] md:h-[400px] flex flex-col">
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Key Features
                        </Label>

                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* BORDERED CONTAINER */}
                            <div className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-2 dark:border-white overflow-hidden flex flex-col">
                                {/* HEADER WITH ADD BUTTON */}
                                <div className="flex items-center justify-end pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                                    {/* <span className="text-xs text-gray-500 dark:text-gray-400">Add product specifications</span> */}
                                    <button
                                        type="button"
                                        onClick={addFeatureField}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white btn-primary font-semibold shadow-sm transition hover:scale-105"
                                    >
                                        + Add Feature
                                    </button>
                                </div>
                                {/* SCROLLABLE FEATURES LIST */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                    {formData?.keyFeatures?.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 pt-1 px-1"
                                        >
                                            {/* FEATURE */}
                                            <div className="w-1/2">
                                                <Input
                                                    type="text"
                                                    placeholder="Feature"
                                                    value={item.key}
                                                    className="h-9 text-sm w-full rounded-lg px-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                                    onChange={(e) =>
                                                        UpdateFeatureField(index, "key", e.target.value)
                                                    }
                                                />
                                            </div>

                                            {/* DESCRIPTION + DELETE inside */}
                                            <div className="w-1/2 relative">
                                                <Input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={item.value}
                                                    className={`h-9 text-sm w-full border ${validationErrors.featureFields?.[index]?.value
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                        } focus:ring-1 focus:ring-[rgb(53,66,237)] ${formData.keyFeatures.length > 1 ? "pr-8" : ""}`}
                                                    onChange={(e) =>
                                                        UpdateFeatureField(index, "value", e.target.value)
                                                    }
                                                />
                                                {formData.keyFeatures.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFeature(index)}
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 transition"
                                                        title="Remove feature"
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                )}
                                                {validationErrors.featureFields?.[index]?.value && (
                                                    <p className="!text-[14px] text-red-500 mt-0.5 ml-1">
                                                        {validationErrors.featureFields[index].value}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Validation message with fixed height space */}
                            <div className="min-h-[20px] mt-1">
                                {/* Reserved space for alignment */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* <!-- ======================================================== Images  ======================================================== -->*/}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <Label required>Main Image</Label>
                        <div
                            className={`h-[180px] md:h-[300px] rounded-lg border transition-all duration-200 
                                flex items-center justify-center overflow-hidden
                                ${validationErrors.mainImage
                                    ? "border-red-400 focus-within:ring-red-400 focus-within:ring-2"
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
                                onFileRemove={() => setMainImage(null)}
                                isEditMode={isEditMode}
                            />
                        </div>

                        {validationErrors.mainImage && (
                            <p className="error-message">{validationErrors.mainImage}</p>
                        )}
                    </div>

                    {/* ================= Sub Images ================= */}
                    <div>
                        <Label>Sub Images (Max 4)</Label>

                        <div className="h-[200px] md:h-[300px] rounded-lg border focus-within:ring-blue-500 focus-within:ring-2 border-gray-300 flex items-center justify-center overflow-hidden">
                            <DropzoneComponent
                                preview={subPreview}
                                setPreview={setSubPreview}
                                multiple={true}
                                smallPreview={true}
                                maxFiles={4}
                                onFileSelect={(files, ids) => {
                                    setSubImages((prev) => {
                                        const next = { ...prev };
                                        files.forEach((file, idx) => {
                                            const id = ids?.[idx] || `temp_${Date.now()}_${idx}`;
                                            next[id] = file;
                                        });
                                        return next;
                                    });
                                }}
                                onFileRemove={(id) => {
                                    if (id) {
                                        setSubImages((prev) => {
                                            const next = { ...prev };
                                            delete next[id];
                                            return next;
                                        });
                                        setSubPreview((prev) => prev.filter(img => img.product_image_id !== id));
                                    }
                                }}
                                isEditMode={isEditMode}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-6 px-4">
                {/* Custom Checkbox - Base (Paid) */}
                {/* <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={pricingType === "paid"}
                                onChange={handlePricingChange}
                                className="sr-only peer"
                            />
                            <div className={`
                                w-6 h-6 rounded-md border-2 transition-all duration-200 ease-in-out
                                flex items-center justify-center
                                ${pricingType === "paid" 
                                    ? "bg-blue-600 border-blue-600 shadow-sm" 
                                    : "bg-white border-gray-400 group-hover:border-blue-400"}
                            `}>
                                {pricingType === "paid" && (
                                    <svg 
                                        className="w-4 h-4 text-white stroke-2" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        <span className={`
                            text-base font-medium transition-colors duration-200
                            ${pricingType === "paid" 
                                ? "text-blue-700 dark:text-blue-400" 
                                : "text-gray-600 dark:text-gray-300"}
                        `}>
                            Base (Paid listing)
                        </span>
                    </label> */}

                {/* Save Button */}
                <Button
                    size="sm"
                    variant="primary"
                    className="btn-primary px-6 py-2.5 min-w-[100px]"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update" : "Save")}
                </Button>

                {/* Cancel Button */}
                <Button size="sm" variant="outline" className="!py-2 px-5"
                    onClick={() => {
                        router.push("/product");
                    }}
                >
                    Cancel
                </Button>
            </div>
        </>
    );
}
