'use client';

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "@/icons";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
    group?: string;
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
const [preview, setPreview] = useState("");

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
                            onChange={() => { }}
                            className="dark:bg-dark-900"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                            <ChevronDownIcon />
                        </span>
                    </div>
                </div>
                <div>
                    <Label>Sub Category</Label>
                    <div className="relative">
                        <Select
                            options={typeOptions}
                            placeholder="Sub Category"
                            onChange={() => { }}
                            className="dark:bg-dark-900"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                            <ChevronDownIcon />
                        </span>
                    </div>
                </div>
                <div>
                    <Label>Listing Type</Label>
                    <div className="relative">
                        <Select
                            options={typeOptions}
                            placeholder="Listing Type"
                            onChange={() => { }}
                            className="dark:bg-dark-900"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                            <ChevronDownIcon />
                        </span>
                    </div>
                </div>
                <div>
                    <Label>Item / Property Name</Label>
                    <div className="relative">
                        <Input
                            placeholder="Enter your Item / Property Name"
                            type="text" />
                    </div>
                </div>
                <div>
                    <Label>Day Price</Label>
                    <div className="relative">
                        <Input
                            placeholder="Enter Day Price"
                            type="text"
                        // value={data.dayPrice} 
                        />
                    </div>
                </div>
                <div>
                    <Label>Day Cancel Price</Label>
                    <div className="relative">
                        <Input
                            placeholder="Enter Day Cancel Price"
                            type="text"
                        // value={data.dayPrice} 
                        />
                    </div>
                </div>
                <div>
                    <Label>Month Price</Label>
                    <div className="relative">
                        <Input
                            placeholder="Enter Month Price"
                            type="text"
                        // value={data.dayPrice} 
                        />
                    </div>
                </div>
                <div>
                    <Label>Month Cancel Price</Label>
                    <div className="relative">
                        <Input
                            placeholder="Enter Month Cancel Price"
                            type="text"
                        // value={data.dayPrice} 
                        />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Description</Label>
                    <TextArea
                        // value={message}
                        // onChange={(value) => setMessage(value)}
                        rows={6}
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 mt-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Key Feature</Label>
                            <button
                                type="button"
                                className="bg-[#ffcb07] w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#e6b800] transition-colors duration-200"
                            //   onClick={addSubtitle}
                            > +
                                {/* <FaPlus className="w-4 h-4" /> */}
                            </button>
                        </div>

                        {/* {data.planSubtitles.map((subtitle, index) => ( */}
                        <div className="relative mb-2">
                            <Input
                                type="text"
                                placeholder={`Enter sub title `}
                                // value={subtitle}
                                onChange={() => () => { }}
                            // hint={errors?.[`planSubtitles[${index}]`]}
                            />

                            {/* {data.planSubtitles.length > 1 && ( */}
                            <button
                                type="button"
                                onClick={() => { }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 border border-[#ffcb07] text-[#ffcb07] w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#ffcb07] hover:text-black transition-colors duration-200"
                            > -
                                {/* <FaMinus className="w-4 h-4" /> */}
                            </button>
                            {/* )} */}
                        </div>
                        {/* ))} */}
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-3">
                    <div>
                       <Label>Select Image</Label>
                        <DropzoneComponent
                            // preview={() => {}}
                            // setPreview={setPreview}
                            // onFileSelect={() => {}}
                        />
                    </div>
                    <div>
                        <Label>Select Image</Label>
                        <DropzoneComponent
                        //  preview={""}
                            // setPreview={""}
                            // onFileSelect={() => {}}
                            // preview={preview}
                            // setPreview={setPreview}
                            // onFileSelect={(file: File) => setMainImage(file)}
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