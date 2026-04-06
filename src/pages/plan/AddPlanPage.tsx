'use client';

import ComponentCard from "@/components/common/ComponentCard";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import Input from "@/components/common/Input";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon } from "@/icons";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Editor, EditorTextChangeEvent } from "primereact/editor";

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

export default function AddPlanPage() {
    const router = useRouter();
    const [items, setItems] = useState([{ key: "", value: "" }]);
    const { setBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        setBreadcrumbs([
            { label: "Plan", path: "/plan" },
            { label: "Add Plan" }
        ]);
        return () => setBreadcrumbs(null);
    }, [setBreadcrumbs]);

    const addItem = () => {
        setItems([...items, { key: "", value: "" }]);
    };

    const updateItem = (index: number, field: "key" | "value", value: string) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const removeItem = (index: number) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };
    return (
        <>
            <ComponentCard title="Add Plan">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Label>Price</Label>
                        <div className="relative">
                            <Input
                                placeholder="Enter Price"
                                type="text"
                            // value={data.dayPrice} 
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Type</Label>
                        <div className="relative">
                            <Select
                                options={typeOptions}
                                placeholder="Type"
                                onChange={() => { }}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label>Price</Label>
                        <div className="relative">
                            <Input
                                placeholder="Enter Price"
                                type="text"
                            // value={data.dayPrice} 
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Duration</Label>
                        <div className="relative">
                            <Select
                                options={typeOptions}
                                placeholder="Duration"
                                onChange={() => { }}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* LEFT → DESCRIPTION */}
                    <div className="">
                        <Label>Description</Label>
                        <Editor
                            style={{ height: "280px" }}
                            className="border border-gray-200 rounded-md"
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

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-2 gap-3 relative mb-4">

                                    {/* KEY */}
                                    <Input
                                        type="text"
                                        placeholder="Enter Key"
                                        value={item.key}
                                        onChange={(e) => updateItem(index, "key", e.target.value)}
                                    />

                                    {/* VALUE */}
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Enter Value"
                                            value={item.value}
                                            onChange={(e) => updateItem(index, "value", e.target.value)}
                                        />

                                        {/* REMOVE BUTTON */}
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 border border-[#ffcb07] text-[#ffcb07] w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#ffcb07] hover:text-black"
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

            </ComponentCard >
            <div className="flex items-center gap-5">
                <Button size="sm" variant="primary"
                // onClick={handleSave}
                >
                    Save
                </Button>
                <Button size="sm" variant="outline"
                    onClick={() => router.push("/plan")}
                >
                    Cancel
                </Button>
            </div>
        </>
    );
}