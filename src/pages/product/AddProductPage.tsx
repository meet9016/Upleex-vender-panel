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
import { MdDelete } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Radio from "@/components/form/input/Radio";
import { toast } from "react-toastify";

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

export type Option = {
    value: string;
    label: string;
    image?: string;
};

export default function AddProductPage() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams?.get("id") ?? null;
    const isEditMode = !!productId;

    const [formData, setFormData] = useState({
        category: null,
        subCategory: null,
        listingType: null,
        name: "",
        dayPrice: "",
        dayCancelPrice: "",
        monthPrice: "",
        monthCancelPrice: "",
        months: [
            { month: "", price: "", cancelPrice: "" }
        ],
        description: "",
        keyFeatures: [{ key: "", value: "" }],
    });

    const [mainPreview, setMainPreview] = useState<string[]>([]);
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
        useState<CategoryOption | null>(null);

    const [selectedSubCategory, setSelectedSubCategory] =
        useState<CategoryOption | null>(null);
    // ----------------------------
    // HANDLE INPUT CHANGE
    // ----------------------------
    const handleChange = (field: string, value: any) => {

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    // ----------------------------
    // HANDLE KEY FEATURE add/remove/update
    // ----------------------------
    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: [...prev.keyFeatures, { key: "", value: "" }],
        }));
    };

    const removeItem = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
        }));
    };

    const updateItem = (
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

    //Month
    const addMonth = () => {
        if (formData.months.length >= 12) return;

        setFormData((prev) => ({
            ...prev,
            months: [
                ...prev.months,
                { month: "", price: "", cancelPrice: "" }, // <-- add month field
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

    const handleRadioChange = (value: "day" | "month") => {
        setBillingType(value);

        // agar formData me bhi store karna ho
        setFormData((prev) => ({
            ...prev,
            billingType: value,
        }));
    };

    useEffect(() => {
        if (!isEditMode) return;

        const fetchProductDetails = async () => {
            const formData = new FormData()
            formData.append("product_id", productId || "")
            try {
                const response = await api.post(endPointApi.postVendorProductDetails, formData);
                if (response?.data?.status == 200) {
                    const data = response.data.data;


                    setBillingType(data.product_listing_type_id === "1" ? "day" : "month");

                    setFormData({
                        category: data.category_id,
                        subCategory: data.sub_category_id,
                        listingType: data.product_type_id,
                        name: data.product_name,
                        dayPrice: data.product_listing_type_id === "1" ? data.price : "",
                        dayCancelPrice: data.product_listing_type_id === "1" ? data.cancel_price : "",
                        monthPrice: data.product_listing_type_id !== "1" ? data.price : "",
                        monthCancelPrice: data.product_listing_type_id !== "1" ? data.cancel_price : "",


                        months: data.month_arrr?.length
                            ? data.month_arrr.map((m: any) => ({
                                month: String(m.months_id),
                                price: m.price,
                                cancelPrice: m.cancel_price,
                            }))
                            : [{ month: "", price: "", cancelPrice: "" }],
                        description: data.description,
                        keyFeatures: data.product_details?.length
                            ? data.product_details.map((item: any) => ({
                                specification_id: item.specification_id,
                                key: item.specification,
                                value: item.detail,
                            }))
                            : [{ key: "", value: "" }],
                    });


                    setSelectedCategory(data.category_id);


                    if (data.main_image) {
                        setMainPreview([data.main_image]);
                    }
                    if (data.sub_images?.length) {
                        setSubPreview(data.sub_images);
                    }
                } else {
                    toast.error(response?.data?.message)
                }
            } catch (err) {
                console.error("Error fetching Product detail to edit", err);
            }
        };

        fetchProductDetails();
    }, [productId, isEditMode]);


    // ---- Fetch Categories ----
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.post(endPointApi.postCategoryList, {});
                if (res?.data?.data) {
                    setCategoryList(res.data.data);

                    // Select-compatible format
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

    // Update the SubCategories useEffect to handle edit mode properly:
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!selectedCategory) return;

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

                    // Don't auto-select in edit mode if subCategory is already set
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
    }, [selectedCategory]);

    // ---- Fetch Product ----
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

    const handleSave = async () => {
        try {
            const formdata = new FormData();

            // ---------- EDIT MODE CHECK ----------
            // if (formData?.product_id) {
            //   formdata.append("product_id", formData.product_id);
            // }

            // ---------- BASIC FIELDS ----------
            formdata.append("category_id", String(selectedCategory));
            formdata.append("sub_category_id", String(selectedSubCategory));
            formdata.append("product_type_id", String(formData.listingType));
            formdata.append("product_listing_type_id", String(formData.listingType));
            formdata.append("product_name", formData.name);
            formdata.append("description", formData.description);

            // ---------- SELL FLOW ----------
            if (formData.listingType != 1) {
                formdata.append("price", formData.monthPrice);
                formdata.append("cancel_price", formData.monthCancelPrice);
            }

            // ---------- RENT FLOW ----------
            if (formData.listingType == 1) {
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
                formdata.append("main_image", mainImage);
            }

            subImages.forEach((file, index: number) => {
                formdata.append(`sub_images[${index}]`, file);
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
                    <div>
                        <Label>Category</Label>
                        <div className="relative">
                            <Select
                                options={categoryList}
                                placeholder="Category"
                                value={formData.category}
                                onChange={(val: any) => {
                                    handleChange("category", val.value);
                                    setSelectedCategory(val.value); // Changed from val to val.value
                                }}
                                className="dark:bg-dark-900"
                            />

                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                    {/* SUB CATEGORY */}
                    <div>
                        <Label>Sub Category</Label>
                        <div className="relative">
                            <Select
                                options={subCategoryList}
                                placeholder="Sub Category"
                                value={formData.subCategory}
                                onChange={(val: any) => handleChange("subCategory", val.value)}
                                className="dark:bg-dark-900"
                            />

                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                    {/* LISTING TYPE */}
                    <div>
                        <Label>Listing Type</Label>
                        <div className="relative">
                            <Select
                                options={productTypeOptions}
                                placeholder="Listing Type"
                                value={formData.listingType}
                                onChange={(val) => handleChange("listingType", val)}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                    {/* NAME */}
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

                    {formData?.listingType == 1 && (
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

                    {/* RENT FLOW */}
                    {formData?.listingType == 1 && (
                        <>
                            {/* DAY PRICING */}
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
                            {/* MONTHLY PRICING */}
                            {billingType === "month" && (
                                <div className="col-span-3 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-lg font-semibold">
                                            Monthly Pricing (1–12 Months)
                                        </Label>

                                        {formData?.months?.length < 12 && (
                                            <button
                                                type="button"
                                                className="bg-[#ffcb07] px-4 py-1 rounded-md font-bold"
                                                onClick={addMonth}
                                            >
                                                + Add Month
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formData?.months?.map((m, index) => (
                                            <div
                                                key={index}
                                                className="border rounded-md p-4 relative bg-gray-50"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* MONTH SELECT */}
                                                    <div>
                                                        <Label>Month</Label>
                                                        <Select
                                                            options={monthOptions}
                                                            placeholder="Select Month"
                                                            value={m.month}
                                                            onChange={(val) => updateMonth(index, "month", val)}
                                                        />

                                                    </div>

                                                    {/* PRICE */}
                                                    <div>
                                                        <Label>Price</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter Price"
                                                            value={m.price}
                                                            onChange={(e) =>
                                                                updateMonth(index, "price", e.target.value)
                                                            }
                                                        />
                                                    </div>

                                                    {/* CANCEL PRICE */}
                                                    <div>
                                                        <Label>Cancel Price</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter Cancel Price"
                                                            value={m.cancelPrice}
                                                            onChange={(e) =>
                                                                updateMonth(index, "cancelPrice", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* REMOVE */}
                                                {formData.months.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-4 top-4 text-red-500 text-xl"
                                                        onClick={() => removeMonth(index)}
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* SELL FLOW */}
                    {formData?.listingType != 1 && (
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

                    {/* LEFT → DESCRIPTION */}
                    <div className="">
                        <Label>Description</Label>
                        <Editor
                            value={formData.description} // Add this line
                            style={{ height: "280px" }}
                            className="border border-gray-200 rounded-md"
                            onTextChange={(e) => handleChange("description", e.htmlValue)}
                        />
                    </div>

                    {/* RIGHT → KEY FEATURES */}
                    <div className="h-[350px] flex flex-col">

                        {/* HEADER (Label + Add Button OUTSIDE box) */}
                        <div className="flex items-center justify-between mb-2">
                            <Label>Key Features</Label>

                            <button
                                type="button"
                                className="bg-[#ffcb07] w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#e6b800]"
                                onClick={addItem}
                            >
                                +
                            </button>
                        </div>

                        {/* SCROLLABLE BOX */}
                        <div className="border border-gray-200 rounded-md p-3 overflow-y-auto flex-1">
                            {formData?.keyFeatures?.map((item, index) => (
                                <div key={index} className="grid grid-cols-2 gap-3 relative mb-4">

                                    <Input
                                        type="text"
                                        placeholder="Enter Key"
                                        value={item.key}
                                        onChange={(e) => updateItem(index, "key", e.target.value)}
                                    />

                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Enter Value"
                                            value={item.value}
                                            onChange={(e) => updateItem(index, "value", e.target.value)}
                                        />

                                        {formData.keyFeatures.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 border border-[#ffcb07] text-[#ffcb07] w-8 h-8 rounded-md"
                                            >
                                                -
                                            </button>
                                        )}
                                    </div>

                                </div>
                            ))}

                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* MAIN IMAGE (Large Preview) */}
                    <div>
                        <Label>Main Image</Label>

                        <img src={"https:\/\/upleex.2min.cloud\/upload\/product_images\/2026\/01\/2026-01-22\/fb8b7c56ce6d9150a8d6c86fc56d3035.webp"} />





                        <DropzoneComponent
                            preview={mainPreview}
                            setPreview={setMainPreview}
                            multiple={false}
                            smallPreview={false}
                            onFileSelect={(files) => setMainImage(files[0])}
                        />
                    </div>

                    {/* SUB IMAGES (Small Preview + Remove button) */}
                    <div>
                        <Label>Sub Images</Label>
                        <DropzoneComponent
                            preview={subPreview}
                            setPreview={setSubPreview}
                            multiple={true}
                            smallPreview={true}
                            onFileSelect={(files) => setSubImages((prev) => [...prev, ...files])}
                        />
                    </div>

                </div>

            </ComponentCard >
            <div className="flex items-center gap-5">
                <Button size="sm" variant="primary"
                    onClick={handleSave}
                >
                    Save
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