"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import DropzoneComponent from "@/components/form/form-elements/DropZone";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState,useRef } from "react";
import { Editor } from "primereact/editor";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { compressImage } from "@/utils/imageCompression";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { FiArrowLeft } from "react-icons/fi";
import PageLoader from "@/components/common/PageLoader";

export interface Option {
    value: string;
    label: string;
}

export default function AddServicePage() {
    const router = useRouter();
    const editorRef = useRef<any>(null);
    const searchParams = useSearchParams();
    const serviceId = searchParams?.get("id") ?? null;
    const isEditMode = !!serviceId;

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price: "",
        billing_type: "day",
        location: "",
        description: "",
    });

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainPreview, setMainPreview] = useState<any[]>([]);
    const [subImages, setSubImages] = useState<Record<string, File>>({});
    const [subPreviews, setSubPreviews] = useState<any[]>([]);
    const [categoryList, setCategoryList] = useState<Option[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [validationErrors, setValidationErrors] = useState<{
        name?: string;
        category?: string;
        price?: string;
        billing_type?: string;
        location?: string;
        description?: string;
        mainImage?: string;
    }>({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get(endPointApi.postServiceCategoryList);
                if (res?.data?.data) {
                    const list = res.data.data.map((item: any) => ({
                        label: item.categories_name || item.name,
                        value: String(item.categories_id || item.id || item._id),
                        image: item.image,
                    }));
                    setCategoryList(list);
                }
            } catch (err) {
                console.error("Error fetching service categories", err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchServiceDetails = async () => {
            if (!serviceId) return;
            try {
                const res = await api.get(`${endPointApi.postVendorServiceDetails}/${serviceId}`);
                if (res?.data?.data) {
                    const data = res.data.data;
                    setFormData({
                        name: data.service_name || "",
                        category: String(data.category_id || ""),
                        price: String(data.price || ""),
                        billing_type: data.billing_type || "day",
                        location: data.location || "",
                        description: data.description || "",
                    });
                    if (data.image) {
                        setMainPreview([{ image: data.image }]);
                    }
                    if (data.sub_images && Array.isArray(data.sub_images)) {
                        setSubPreviews(data.sub_images.map((img: string, idx: number) => ({
                            product_image_id: `existing_${idx}`,
                            image: img
                        })));
                    }
                }
            } catch (err) {
                console.error("Error fetching service details", err);
            }
        };
        fetchServiceDetails();
    }, [serviceId]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const validateForm = (): boolean => {
        const errors: typeof validationErrors = {};
        if (!formData.name?.trim()) errors.name = "Please enter service name";
        if (!formData.category) errors.category = "Please select a category";
        if (!formData.price?.trim()) errors.price = "Please enter price";
        if (!formData.billing_type) errors.billing_type = "Please select billing type";
        if (!formData.location?.trim()) errors.location = "Please enter location/city";
        if (!formData.description?.trim()) errors.description = "Please enter description";
        if (!mainImage && (!mainPreview || mainPreview.length === 0)) {
            errors.mainImage = "Please upload service image";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            const data = new FormData();
            data.append("service_name", formData.name);
            data.append("category_id", formData.category);
            data.append("price", formData.price);
            data.append("billing_type", formData.billing_type);
            data.append("location", formData.location);
            data.append("description", formData.description);
            if (mainImage) {
                const compressedMain = await compressImage(mainImage, 0.8);
                data.append("image", compressedMain);
            }

            // Handle Sub Images
            // 1. New files
            const subFiles = Object.values(subImages);
            for (const file of subFiles) {
                const compressedSub = await compressImage(file, 0.8);
                data.append("sub_images", compressedSub); // Reverted to sub_images to match backend
            }

            // 2. Existing images to keep 
            // We find images in subPreviews that are not temporary (i.e. existing ones)
            subPreviews.forEach((img) => {
                if (img.image && !img.product_image_id.startsWith('temp_')) {
                    data.append("existing_sub_images", img.image); // Matches backend Joi [array or string]
                }
            });

            const url = isEditMode
                ? `${endPointApi.updateVendorServiceDetails}/${serviceId}`
                : endPointApi.postVendorAddService;

            const res = isEditMode
                ? await api.put(url, data)
                : await api.post(url, data);

            if (res.status === 200 || res.status === 201) {
                toast.success(`Service ${isEditMode ? 'updated' : 'added'} successfully`);
                router.push("/service");
            }
        } catch (error) {
            console.error("Save service error", error);
            toast.error("Failed to save service");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {pageLoading || submitting ? (
                <PageLoader fullScreen={true} />
            ) : (
                <div className="pb-20 ">
                    <div className="bg-white p-6  dark:bg-gray-800">
                {/* <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <FiArrowLeft className="text-lg" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="h-12 w-1 bg-blue-600 rounded-full"></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isEditMode ? "Update service details" : "Fill details to create a new service"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Label required className="font-semibold mb-2">Service Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Enter service name"
                            error={!!validationErrors.name}
                            className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                        />
                        {validationErrors.name && (
                            <p className="error-message">{validationErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <Label required className="font-semibold mb-2">Category</Label>
                        <SearchableDropdown
                            options={categoryList}
                            value={formData.category}
                            onChange={(val) => handleChange("category", val)}
                            placeholder="Select Category"
                            searchable={true}
                            error={!!validationErrors.category}
                        />
                        {validationErrors.category && (
                            <p className="error-message">{validationErrors.category}</p>
                        )}
                    </div>

                    <div>
                        <Label required className="font-semibold mb-2">Price (₹)</Label>
                        <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            placeholder="0.00"
                            error={!!validationErrors.price}
                            className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                        />
                        {validationErrors.price && (
                            <p className="error-message">{validationErrors.price}</p>
                        )}
                    </div>

                    <div>
                        <Label required className="font-semibold mb-2">Billing Type</Label>
                        <SearchableDropdown
                            options={[
                                { label: "Per Day", value: "day" },
                                { label: "Per Month", value: "month" },
                                { label: "Hourly", value: "hourly" },
                            ]}
                            value={formData.billing_type}
                            onChange={(val) => handleChange("billing_type", val)}
                            placeholder="Select Billing Type"
                            searchable={true}
                            error={!!validationErrors.billing_type}
                        />
                        {validationErrors.billing_type && (
                            <p className="error-message text-red-500 text-xs mt-1">{validationErrors.billing_type}</p>
                        )}
                    </div>

                    <div >
                        <Label required className="font-semibold mb-2">Providing City</Label>
                        <Input
                            value={formData.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                            placeholder="Enter cities (e.g. New York, Los Angeles)"
                            error={!!validationErrors.location}
                            className="rounded-lg px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                        />
                        {/* <p className="text-xs text-gray-500 mt-1">Mention the cities where you provide this service.</p> */}
                        {validationErrors.location && (
                            <p className="error-message">{validationErrors.location}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="h-[350px] flex flex-col">
                        <Label required className="font-semibold mb-2">Description</Label>
                        <div
                         onClick={() => editorRef.current?.getQuill().focus()}
                            className={`flex-1 rounded-xl overflow-hidden transition-all duration-200 border ${validationErrors.description
                                ? "border-error-600 focus-within:ring-error-600 focus-within:ring-2"
                                : "border-gray-300 focus-within:ring-blue-500 focus-within:ring-2"
                                }`}
                        >
                            <Editor
                              ref={editorRef}
                                value={formData.description}
                                onTextChange={(e) => handleChange("description", e.htmlValue || "")}
                                style={{ height: '100%' }}
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
                                        },
                                    },
                                }}
                            />
                        </div>
                        {validationErrors.description && (
                            <p className="error-message">{validationErrors.description}</p>
                        )}
                    </div>

                    <div className="h-[350px] flex flex-col mt-0.5">
                        <Label required>Service Image</Label>
                        <div
                            className={`flex-1 rounded-xl border transition-all duration-200 flex items-center justify-center overflow-hidden ${validationErrors.mainImage
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
                                    setMainImage(files[0] || null);
                                    if (validationErrors.mainImage) {
                                        setValidationErrors(prev => ({ ...prev, mainImage: undefined }));
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

                    <div>
                        <Label>Sub Images (Max 4)</Label>
                        <div className="h-[300px] rounded-lg border focus-within:ring-blue-500 focus-within:ring-2 border-gray-300 flex items-center justify-center overflow-hidden">
                            <DropzoneComponent
                                preview={subPreviews}
                                setPreview={setSubPreviews}
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
                                        // Remove from new files state
                                        setSubImages((prev) => {
                                            const next = { ...prev };
                                            delete next[id];
                                            return next;
                                        });
                                        // Also ensure it's removed from previews (Dropzone handles this internally but we sync here just in case)
                                        setSubPreviews((prev) => prev.filter(img => img.product_image_id !== id));
                                    }
                                }}
                                isEditMode={false} // Leave deletion to the update API to avoid mismatched product delete API
                            />
                        </div>
                    </div>
                </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-6 px-4">
                        <Button
                            size="sm"
                            variant="primary"
                            className="btn-primary px-6 py-2.5 min-w-[100px]"
                            onClick={handleSubmit}
                        >
                            {isEditMode ? "Update" : "Save"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="!py-2 px-5"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
