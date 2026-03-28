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
import { compressImage } from "@/utils/imageCompression";
import Radio from "@/components/form/input/Radio";
import Checkbox from "@/components/form/input/Checkbox";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useWallet } from "@/context/WalletContext";
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

    // Safely use wallet hook - may not be available during build
    let balance = 0;
    let refreshBalance = async () => { };
    try {
        const walletContext = useWallet();
        balance = walletContext.balance;
        refreshBalance = walletContext.refreshBalance;
    } catch (error) {
        // Wallet context not available (e.g., during build)
        console.warn("Wallet context not available");
    }

    const [formData, setFormData] = useState<{
        category: string | null;
        subCategory: string | null;
        listingType: string | null;
        name: string;
        sku: string;
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
    const [subImages, setSubImages] = useState<File[]>([]);

    const [selectedListingType, setSelectedListingType] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [vendorBusinessName, setVendorBusinessName] = useState<string>("");
    const [skuCounter, setSkuCounter] = useState<number>(1);
    const [hasGst, setHasGst] = useState<boolean>(false);
    const [freeProductCount, setFreeProductCount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            // First try to get business name from localStorage
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                const businessName = user.business_name;
                console.log("Fetched vendor business name from localStorage:", businessName);
                if (businessName) {
                    setVendorBusinessName(businessName);
                    return;
                }
            }

            // Fallback to API call if localStorage doesn't have business_name
            const res = await api.get(endPointApi.postFetchVendorKYCFormData || 'vendor-single-details');
            if (res?.data?.status === 200 && res?.data?.data) {
                const data = res.data.data;
                const businessName = data.business_name || data.businessName || data.Identity?.business_name;
                console.log("Fetched vendor profile from API:", data);
                setVendorBusinessName(businessName || "Vendor");
                setHasGst(!!(data.Identity?.gst_number || data.gst_number));
            } else {
                setVendorBusinessName("Vendor"); // Fallback
            }
        } catch (error) {
            console.error("Error fetching vendor profile:", error);
            // Try localStorage as final fallback
            try {
                const userInfo = localStorage.getItem('user_info');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    const businessName = user.business_name;
                    if (businessName) {
                        console.log("Using localStorage business name as fallback:", businessName);
                        setVendorBusinessName(businessName);
                        return;
                    }
                }
            } catch (localStorageError) {
                console.error("Error reading from localStorage:", localStorageError);
            }
            setVendorBusinessName("Vendor"); // Final fallback
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
                const startOfMonth = new Date();
                startOfMonth.setHours(0, 0, 0, 0);
                startOfMonth.setDate(1);

                const freeCount = products.filter((p: any) =>
                    p.pricing_type === 'free' &&
                    p.status === 'active' &&
                    new Date(p.createdAt || p.updatedAt) >= startOfMonth
                ).length;
                setFreeProductCount(freeCount);
            }
        } catch (error) {
            console.error("Error fetching SKU counter:", error);
            setSkuCounter(1); // Fallback to 1
        }
    };

    const updateSKU = () => {
        if (selectedCategory && vendorBusinessName) {
            const categoryData = categoriesData.find((c: any) =>
                String(c.categories_id || c.id) === String(selectedCategory)
            );
            const categoryName = categoryData?.categories_name || categoryData?.name || "Category";

            const newSKU = generateSKU(categoryName, vendorBusinessName, skuCounter);
            handleChange("sku", newSKU);
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

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => {
            if (prev[field as keyof typeof prev] === value) return prev;
            return {
                ...prev,
                [field]: value,
            };
        });

        // Clear validation error only when user directly interacts with that field
        // Do NOT clear subCategory error when category changes
        if (field !== 'subCategory' && validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors(prev => {
                if (!prev[field as keyof typeof prev]) return prev;
                return {
                    ...prev,
                    [field]: undefined
                };
            });
        }
        // Clear subCategory error only when user actually selects a subCategory
        if (field === 'subCategory' && value) {
            setValidationErrors(prev => {
                if (!prev.subCategory) return prev;
                return {
                    ...prev,
                    subCategory: undefined
                };
            });
        }
    };


    const handleNumberInput = (field: string, value: string, maxLength: number = 10) => {
        // Remove non-numeric characters and limit length
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, maxLength);
        handleChange(field, numericValue);
    };


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

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;

        // Check wallet balance before allowing paid listing
        if (isChecked && balance < 10) {
            toast.error("Insufficient wallet balance. Minimum ₹10 required for Base (Paid listing). Please add money to your wallet.");
            return; // Don't change the state
        }

        setPricingType(isChecked ? "paid" : "free");

        if (isChecked) {
            toast.info("This product will be marked as Base (Paid listing). ₹10 will be deducted from your wallet.");
        } else {
            toast.info("This product is now set as Free listing");
        }
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
        // Fetch vendor profile and SKU counter on component mount
        if (!isEditMode) {
            fetchVendorProfile();
            fetchNextSKUCounter();
        }
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
        }));

        setSubCategoryList(subcats);

        if (isEditMode && formData.subCategory && subcats.some((sc: Option) => sc.value === formData.subCategory)) {
            setSelectedSubCategory(formData.subCategory);
        }
        // No auto-selection or clearing here; user will select manually
    }, [selectedCategory, categoriesData, isEditMode]);

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

        // Check wallet balance and free limit
        if (pricingType === 'paid') {
            if (balance <= 0) {
                toast.error("Your wallet balance is 0. Please add money to your wallet to add paid products.");
                return;
            }
        } else if (pricingType === 'free') {
            const limit = hasGst ? 3 : 1;
            if (freeProductCount >= limit) {
                toast.error(`Free listing limit reached (${freeProductCount}/${limit}). Please select 'Base (Paid listing)' or add money to your wallet.`);
                return;
            }
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

            // ---------- SELL FLOW ----------
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
                const compressedMain = await compressImage(mainImage, 0.8);
                formdata.append("product_main_image", compressedMain);
            }

            for (const file of subImages) {
                const compressedSub = await compressImage(file, 0.8);
                formdata.append("image", compressedSub);
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
            console.error("Save product error", error);
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

                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={pricingType === "paid"}
                                onChange={handlePricingChange}
                                className="sr-only peer"
                            />
                            {/* Checkbox background & border */}
                            <div className={`
                            w-6 h-6 rounded-md border-2 transition-all duration-200 ease-in-out
                            flex items-center justify-center
                            ${pricingType === "paid"
                                    ? "bg-blue-600 border-blue-600 shadow-sm"
                                    : "bg-white border-gray-400 group-hover:border-blue-400"}
                        `}>
                                {/* Checkmark when checked */}
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

                        {/* Label */}
                        <span className={`
                        text-base font-medium transition-colors duration-200
                        ${pricingType === "paid"
                                ? "text-blue-700 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-300"}
                    `}>
                            Base (Paid listing)
                        </span>
                    </label>
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
                            <p className="error-message">{validationErrors.category}</p>
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
                            <p className="error-message">
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
                                <span className="error-message">
                                    {validationErrors.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2">SKU (Stock Keeping Unit)</Label>
                        <div className="flex flex-col">
                            <Input
                                placeholder="Auto-generated SKU"
                                type="text"
                                value={formData.sku}
                                onChange={(e) => handleChange("sku", e.target.value)}
                                error={!!validationErrors.sku}
                                className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full bg-gray-50"
                                readOnly={!isEditMode}
                            />
                            {validationErrors.sku && (
                                <span className="error-message">
                                    {validationErrors.sku}
                                </span>
                            )}
                            {/* {!isEditMode && (
                                <span className="text-xs text-gray-500 mt-1">
                                    Format: Category(3)-BusinessName(3)-Number(3)
                                </span>
                            )} */}
                        </div>
                    </div>

                    {/* New Product Checkbox */}
                    <div className="flex items-center gap-3 mt-7 h-[40px]">
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
                                <span className="text-xs text-gray-500 mt-1">
                                    Security deposit required for rental
                                </span>
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
                                <span className="text-xs text-gray-500 mt-1">
                                    Number of items available for rent
                                </span>
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
                                <span className="text-xs text-gray-500 mt-1">
                                    Number of items available for sale
                                </span>
                            </div>
                        </div>
                    )}

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
                                <p className="error-message">{validationErrors.billingType}</p>
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
                                <Label>Day Cancel Price</Label>
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
                                <Label>Hourly Price</Label>
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
                                <Label>Hourly Cancel Price</Label>
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
                                <Label>Price</Label>
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
                                <Label>Cancel Price</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ================= LEFT – DESCRIPTION EDITOR (FIXED) ================= */}
                    <div className="">
                        <Label className="font-semibold text-gray-700 dark:text-gray-200 mb-2 ">
                            Description
                        </Label>

                        <div
                            className={`rounded-xl overflow-hidden transition-all duration-200 border ${validationErrors.description
                                ? "border-red-400 focus-within:ring-red-400 focus-within:ring-2"
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
                            <p className="error-message">{validationErrors.description}</p>
                        )}
                    </div>

                    {/* <!-- ======================================================== Features  ======================================================== -->*/}

                    <div className="h-[300px] flex flex-col">
                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-1">
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
                                                className="h-9 w-10 flex items-center justify-center rounded-md text-red-600 hover:text-red-500 transition"
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
