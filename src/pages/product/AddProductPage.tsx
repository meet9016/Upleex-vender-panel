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


        setFormData((prev) => ({
            ...prev,
            billingType: value,
        }));
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


    const handleSubmit = async () => {
        try {
            const formdata = new FormData();

            if (isEditMode === true) {
                formdata.append("product_id", String(productId));
            }

            // ---------- BASIC FIELDS ----------
            formdata.append("category_id", String(selectedCategory));
            formdata.append("sub_category_id", String(selectedSubCategory));
            formdata.append("product_type_id", String(formData.listingType));
            formdata.append("product_listing_type_id", String(billingType === "month" ? "2" : billingType === "day" ? "1" : ""));
            formdata.append("product_name", formData.name);
            formdata.append("description", formData.description);

            // ---------- SELL FLOW ----------
            if (formData.listingType != "1") {
                formdata.append("price", formData.monthPrice);
                formdata.append("cancel_price", formData.monthCancelPrice);
            }

            // ---------- RENT FLOW ----------
            if (formData.listingType == "1") {
                // DAY
                if (billingType === "day") {
                    formdata.append("price", formData.dayPrice);
                    formdata.append("cancel_price", formData.dayCancelPrice);
                }

                // MONTH
                if (billingType === "month") {
                    formData.months.forEach((m: any, index: number) => {
                        if (m.month && m.price && m.cancelPrice) {
                            formdata.append(`months_id[${index}]`, m.month);
                            formdata.append(`month_price[${index}]`, m.price);
                            formdata.append(`month_cancel_price[${index}]`, m.cancelPrice);
                            if (isEditMode === true && m.productMonthsId) {
                                formdata.append(`product_months_id[${index}]`, m.productMonthsId);
                            }
                        }
                    });
                }
            }

            // ---------- SPECIFICATION ----------
            formData.keyFeatures.forEach((item: any, index: number) => {
                if (item.key && item.value) {
                    formdata.append(`specification[${index}]`, item.key);
                    formdata.append(`detail[${index}]`, item.value);

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

            if (res?.data?.status == 200) {
                router.push("/product");
            }

        } catch (error) {
            console.error("Save product error", error);
        }
    };

    return (
        <>
            <ComponentCard title={isEditMode ? "Edit Product" : "Add Product"}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* <!-- ========================================================  Category ======================================================== -->*/}

                    <div>
                        <Label>Category</Label>
                        <div className="relative">
                            <Select
                                options={categoryList}
                                placeholder="Category"
                                value={formData.category ?? ""}
                                onChange={(val: string) => {
                                    handleChange("category", val);
                                    setSelectedCategory(val);
                                    handleChange("subCategory", null);
                                    setSelectedSubCategory(null);
                                }}
                                className="dark:bg-dark-900"
                            />

                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                    {/* <!-- ======================================================== Sub Category ======================================================== -->*/}

                    <div>
                        <Label>Sub Category</Label>
                        <div className="relative">
                            <Select
                                options={subCategoryList}
                                placeholder="Sub Category"
                                value={formData.subCategory ?? ""}
                                onChange={(val: string) => {
                                    handleChange("subCategory", val);
                                    setSelectedSubCategory(val);
                                }}
                                className="dark:bg-dark-900"
                            />

                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    {/* <!-- ======================================================== Listing Type ======================================================== -->*/}

                    <div>
                        <Label>Listing Type</Label>
                        <div className="relative">
                            <Select
                                options={productTypeOptions}
                                placeholder="Listing Type"
                                value={formData.listingType ?? ""}
                                onChange={(val: string) => handleChange("listingType", val)}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                    {/* <!-- ======================================================== Item Name ======================================================== -->*/}

                    <div>
                        <Label>Item / Property Name</Label>
                        <div className="relative">
                            <Input
                                placeholder="Enter your Item / Property Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </div>
                    </div>

                    {formData?.listingType === "1" && (
                        <div className="flex flex-wrap items-center gap-8">
                            <Radio
                                id="radio-day"
                                name="billingType"
                                value="day"
                                checked={billingType === "day"}
                                onChange={() => handleRadioChange("day")}
                                label="Day"
                            />

                            <Radio
                                id="radio-month"
                                name="billingType"
                                value="month"
                                checked={billingType === "month"}
                                onChange={() => handleRadioChange("month")}
                                label="Month"
                            />
                        </div>
                    )}

                    {/* <!-- ======================================================== Rent Flow  ======================================================== -->*/}

                    {formData?.listingType === "1" && (
                        <>
                            {/* <!-- ======================================================== Day Price  ======================================================== -->*/}


                            {billingType === "day" && (
                                <>
                                    <div>
                                        <Label>Day Price</Label>
                                        <Input
                                            placeholder="Enter Day Price"
                                            type="number"
                                            value={formData.dayPrice}
                                            onChange={(e) => handleChange("dayPrice", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Day Cancel Price</Label>
                                        <Input
                                            placeholder="Enter Day Cancel Price"
                                            type="number"
                                            value={formData.dayCancelPrice}
                                            onChange={(e) => handleChange("dayCancelPrice", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* <!-- ======================================================== MONTHLY Price  ======================================================== -->*/}


                            {billingType === "month" && (
                                <div className="col-span-3 mt-8">
                                    {/* HEADER */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <Label className="text-xl font-bold text-gray-800">
                                                Monthly Pricing
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                Configure price for each month (1–12)
                                            </p>
                                        </div>

                                        {formData?.months?.length < 12 && (
                                            <button
                                                type="button"
                                                onClick={addMonth}
                                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-105"
                                                style={{
                                                    background: "linear-gradient(135deg, rgb(53,66,237), rgb(90,102,255))",
                                                }}
                                            >
                                                + Add Month
                                            </button>
                                        )}
                                    </div>

                                    {/* MONTH CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {formData?.months?.map((m, index) => {
                                            const monthError = !m.month ? "Month is required" : "";
                                            const priceError = m.month && !m.price ? "Price is required" : "";
                                            const cancelError = m.month && !m.cancelPrice ? "Cancel Price is required" : "";

                                            return (
                                                <div
                                                    key={index}
                                                    className="relative rounded-2xl p-6 bg-white/80 backdrop-blur border border-gray-200 shadow-md hover:shadow-xl transition flex flex-col gap-5"
                                                >
                                                    {/* REMOVE CROSS BUTTON */}
                                                  {formData.months.length > 1 && (
    <button
        type="button"
        onClick={() => removeMonth(index)}
        className="absolute top-3 right-3 text-gray-600 hover:text-[rgb(58,140,237)] font-extrabold text-2xl transition"
        title="Remove Month"
    >
        <IoClose />
    </button>
)}



                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* MONTH */}
                                                        <div>
                                                            <Label className="text-xs text-gray-500 uppercase">
                                                                Select Month
                                                            </Label>
                                                            <Select
                                                                options={getAvailableMonthsForIndex(index)}
                                                                placeholder="Select Month"
                                                                value={m.month}
                                                                onChange={(val) => updateMonth(index, "month", val)}
                                                                className="mt-1"
                                                            />
                                                            {monthError && <p className="text-red-500 text-xs mt-1">{monthError}</p>}
                                                        </div>

                                                        {/* PRICE */}
                                                        <div>
                                                            <Label className="text-xs text-gray-500 uppercase">
                                                                Price
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="₹ Price"
                                                                value={m.price}
                                                                className="focus:ring-2 focus:ring-[rgb(53,66,237)] mt-1"
                                                                onChange={(e) => updateMonth(index, "price", e.target.value)}
                                                            />
                                                            {priceError && <p className="text-red-500 text-xs mt-1">{priceError}</p>}
                                                        </div>

                                                        {/* CANCEL PRICE */}
                                                        <div>
                                                            <Label className="text-xs text-gray-500 uppercase">
                                                                Cancel Price
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="₹ Cancel"
                                                                value={m.cancelPrice}
                                                                className="focus:ring-2 focus:ring-[rgb(53,66,237)] mt-1"
                                                                onChange={(e) => updateMonth(index, "cancelPrice", e.target.value)}
                                                            />
                                                            {cancelError && <p className="text-red-500 text-xs mt-1">{cancelError}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </>
                    )}

                    {/* <!-- ============================================= Sell Flow  ============================================= -->*/}

                    {formData?.listingType !== "1" && formData?.listingType != null && (
                        <>
                            <div>
                                <Label>Price</Label>
                                <Input
                                    placeholder="Enter Sell Price"
                                    type="number"
                                    value={formData.monthPrice}
                                    onChange={(e) => handleChange("monthPrice", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Cancel Price</Label>
                                <Input
                                    placeholder="Enter Sell Cancel Price"
                                    type="number"
                                    value={formData.monthCancelPrice}
                                    onChange={(e) => handleChange("monthCancelPrice", e.target.value)}
                                />
                            </div>
                        </>
                    )}

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* <!-- ======================================================== Description  ======================================================== -->*/}

                    {/* LEFT → DESCRIPTION */}
                    <div className="">
                        <Label>Description</Label>
                        <Editor
                            value={formData.description}
                            style={{ height: "280px" }}
                            onTextChange={(e) => handleChange("description", e.htmlValue)}
                            pt={{
                                toolbar: {
                                    style: {
                                        borderTopLeftRadius: '0.75rem',
                                        borderTopRightRadius: '0.75rem',
                                        border: '1px solid #e5e7eb'
                                    }
                                },
                                content: {
                                    style: {
                                        borderBottomLeftRadius: '0.75rem',
                                        borderBottomRightRadius: '0.75rem',
                                        border: '1px solid #e5e7eb',
                                        borderTop: 'none'
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* <!-- ======================================================== Features  ======================================================== -->*/}

                    <div className="h-[380px] flex flex-col">
                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-lg font-bold text-gray-800">
                                Key Features
                            </Label>
                            <button
                                type="button"
                                onClick={addFeatureField}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-105"
                                style={{
                                    background: "linear-gradient(135deg, rgb(53,66,237), rgb(90,102,255))",
                                }}
                            >
                                + Add Feature
                            </button>
                        </div>

                        {/* SCROLLABLE AREA */}
                        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4 space-y-4">
                            {formData?.keyFeatures?.map((item, index) => (
                                <div
                                    key={index}
                                    className="relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition p-4 flex flex-col md:flex-row gap-4 items-center"
                                >
                                    {/* REMOVE CROSS BUTTON */}
                                    {formData.keyFeatures.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(index)}
                                            className="absolute top-2 right-2 text-gray-600 hover:text-[rgb(58,140,237)] text-2xl font-extrabold transition"
                                            title="Remove Feature"
                                        >
                                            <IoClose />
                                        </button>
                                    )}


                                    {/* KEY */}
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-500 uppercase">
                                            Feature
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Free Delivery"
                                            value={item.key}
                                            className="focus:ring-2 focus:ring-[rgb(53,66,237)]"
                                            onChange={(e) =>
                                                UpdateFeatureField(index, "key", e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* VALUE */}
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-500 uppercase">
                                            Description
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Up to 10km radius"
                                            value={item.value}
                                            className="focus:ring-2 focus:ring-[rgb(53,66,237)]"
                                            onChange={(e) =>
                                                UpdateFeatureField(index, "value", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* <!-- ======================================================== Images  ======================================================== -->*/}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* <!-- ======================================================== Main Images  ======================================================== -->*/}

                    <div>
                        <Label>Main Image</Label>
                        <DropzoneComponent
                            preview={mainPreview}
                            setPreview={setMainPreview}
                            multiple={false}
                            smallPreview={false}
                            onFileSelect={(files) => setMainImage(files[0])}
                            isEditMode={isEditMode}
                        />
                    </div>
                    {/* <!-- ======================================================== Sub Images  ======================================================== -->*/}

                    <div>
                        <Label>Sub Images (Max 4)</Label>
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