'use client';

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "@/icons";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { Editor, EditorTextChangeEvent } from "primereact/editor";
import { getAvailableMonths } from "@/utils/helper";
import { MdDelete } from "react-icons/md";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
    group?: string;
}

interface Month {
    name: string;
    amount: number;
    // add other fields here
}


const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
];

const typeOptions: SelectOption[] = [
    { value: 'rent', label: 'Rent' },
    { value: 'sell', label: 'Sell' },
];

export default function AddProductPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        category: null,
        subCategory: null,
        listingType: null,
        name: "",
        dayPrice: "",
        dayCancelPrice: "",
        months: [
            { price: "", cancelPrice: "" }
        ],
        description: "",
        keyFeatures: [{ key: "", value: "" }],
    });
    console.log("formData", formData);

    const [mainPreview, setMainPreview] = useState<string[]>([]);
    const [subPreview, setSubPreview] = useState<string[]>([]);

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [subImages, setSubImages] = useState<File[]>([]);

    // ----------------------------
    // HANDLE INPUT CHANGE
    // ----------------------------
    const handleChange = (field, value) => {
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

    const updateItem = (index, field, value) => {
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
            months: [...prev.months, { price: "", cancelPrice: "" }],
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

    return (
        <>
            <ComponentCard title="Add Product">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Label>Category</Label>
                        <div className="relative">
                            <Select
                                options={typeOptions}
                                placeholder="Category"
                                value={formData.category}
                                onChange={(val) => handleChange("category", val)}
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
                                options={typeOptions}
                                placeholder="Sub Category"
                                value={formData.subCategory}
                                onChange={(val) => handleChange("subCategory", val)}
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
                                options={typeOptions}
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
                    {formData?.listingType === "rent" ?
                        <>
                            {/* DAY PRICE */}
                            <div>
                                <Label>Day Price</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter Day Price"
                                        type="text"
                                        value={formData.dayPrice}
                                        onChange={(e) => handleChange("dayPrice", e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* DAY CANCEL PRICE */}
                            <div>
                                <Label>Day Cancel Price</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter Day Cancel Price"
                                        type="text"
                                        value={formData.dayCancelPrice}
                                        onChange={(e) => handleChange("dayCancelPrice", e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* MONTH PRICE */}
                            <div className="col-span-3 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-lg font-semibold">Monthly Pricing (1–12 Months)</Label>

                                    {formData.months.length < 12 && (
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
                                    {formData.months.map((m, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-md p-4 relative bg-gray-50"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                {/* MONTH SELECT */}
                                                <div>
                                                    <Label>Month</Label>
                                                    <select
                                                        className="border rounded-md px-3 py-2 w-full"
                                                        value={m.month}
                                                        onChange={(e) =>
                                                            updateMonth(index, "month", e.target.value)
                                                        }
                                                    >
                                                        <option value="">Select Month</option>
                                                        {getAvailableMonths(index, formData?.months).map((month) => (
                                                            <option key={month} value={month}>
                                                                Month {month}
                                                            </option>
                                                        ))}
                                                    </select>
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

                                            {/* REMOVE BUTTON */}
                                            {formData.months.length > 1 && (
                                                <button
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
                        </>
                        :
                        <>
                            {/* Sell PRICE */}
                            <div>
                                <Label>Price</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter Sell Price"
                                        type="text"
                                        value={formData.monthPrice}
                                        onChange={(e) => handleChange("monthPrice", e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Sell CANCEL PRICE */}
                            <div>
                                <Label>Cancel Price</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter Sell Cancel Price"
                                        type="text"
                                        value={formData.monthCancelPrice}
                                        onChange={(e) => handleChange("monthCancelPrice", e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    }
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* LEFT → DESCRIPTION */}
                    <div className="">
                        <Label>Description</Label>
                        <Editor
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
                            {formData.keyFeatures.map((item, index) => (
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
                // onClick={handleSave}
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