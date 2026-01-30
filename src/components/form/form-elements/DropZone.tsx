"use client";
import React from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import endPointApi from "@/utils/endPointApi";
import { api } from "@/utils/axiosInstance";

interface DropzoneProps {
  preview: string[];
  setPreview: React.Dispatch<React.SetStateAction<string[]>>;
  onFileSelect?: (files: File[]) => void;
  multiple?: boolean;
  smallPreview?: boolean; // multi image size
  maxFiles?: number; // Add this new prop
  isEditMode?: boolean; // ✅ ADD

}

const DropzoneComponent: React.FC<DropzoneProps> = ({
  preview,
  setPreview,
  onFileSelect,
  multiple = false,
  smallPreview = false,
  maxFiles, // Add this
  isEditMode = false


}) => {
  console.log(preview)
  const onDrop = (acceptedFiles: File[]) => {
    if (!multiple) {
      // Single image
      const file = acceptedFiles[0];
      const imgUrl = URL.createObjectURL(file);
      setPreview([imgUrl]);
      onFileSelect?.([file]);

    } else {
      // Multi image with max limit check
      if (maxFiles) {
        const remainingSlots = maxFiles - preview.length;

        if (remainingSlots <= 0) {
          toast.error(`Maximum ${maxFiles} images allowed. Please remove some images first.`);
          return;
        }

        if (acceptedFiles.length > remainingSlots) {
          toast.error(`Maximum limit is ${maxFiles} images.`);
          const filesToAdd = acceptedFiles.slice(0, remainingSlots);
          const newImages = filesToAdd.map((f) => URL.createObjectURL(f));
          setPreview((prev) => [...prev, ...newImages]);
          onFileSelect?.(filesToAdd);
          return;
        }

        const newImages = acceptedFiles.map((f) => URL.createObjectURL(f));
        setPreview((prev) => [...prev, ...newImages]);
        onFileSelect?.(acceptedFiles);
      } else {
        // No limit - original behavior
        const newImages = acceptedFiles.map((f) => URL.createObjectURL(f));
        setPreview((prev) => [...prev, ...newImages]);
        onFileSelect?.(acceptedFiles);
      }
    }
  };

  const removeImage = async (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    if (isEditMode === true) {
      try {
        const formdata = new FormData();
        formdata.append("product_image_id", "10");
        const res = await api.post(endPointApi.postSubImageDelete, formdata);


        if (res?.data?.data) {
          const subcats = res.data.data.map((item: any) => ({
            value: item.id,
            label: item.name, // ✅ TEXT ONLY
          }));



        }
      } catch (err) {
        console.error("Error fetching subcategories", err);
      }
    }

  };

  const isLimitReached = Boolean(maxFiles && preview.length >= maxFiles);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
    disabled: isLimitReached, // Disable when limit reached
  });

  return (
    <div className="w-full space-y-4 ">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          transition-all duration-300 ease-in-out
          border-1  rounded-md 
          p-8 flex flex-col items-center justify-center 
          ${isLimitReached ? 'cursor-not-allowed ' : 'cursor-pointer'} min-h-[320px] w-full
          group
          
        `}
      >
        <input {...getInputProps()} />
        {/* image Section */}
        {preview.length > 0 && preview[0] !== "" ? (
          <div className="w-full ">
            {/* main Image Preview */}
            {!multiple && (
              <div className="flex justify-center items-center">
                <div className="relative group/image">
                  <img
                    src={preview[0]}
                    alt="Preview"
                    className="rounded-xl object-cover shadow-2xl max-h-[280px] w-auto max-w-full 
                              ring-4 ring-gray-100 transition-transform duration-300 
                              group-hover/image:scale-[1.02]"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute bottom-2 right-2  bg-opacity-0 group-hover/image:bg-opacity-20 
                                transition-all duration-300 rounded-xl flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(0);
                      }}
                      className="opacity-0 group-hover/image:opacity-100 
                               bg-red-500 hover:bg-red-600 text-white 
                               px-4 py-2 rounded-lg font-medium
                               transform scale-90 group-hover/image:scale-100
                               transition-all duration-300 shadow-xl
                               flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Multiple Images Preview */}
            {multiple && (
              <div className={`
                grid gap-4 w-full flex flex-row
                ${smallPreview
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                }
              `}>
                {preview.filter((img:any) => img && img.image && img.image !== "").map((img:any, index) => (
                  <div
                    key={img.product_image_id}
                    className="relative group/image aspect-square overflow-hidden rounded-xl 
                             bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300
                             transform hover:scale-[1.02]"
                  >
                    <img
                      src={img.image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 
                                  opacity-0 group-hover/image:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white 
                                   p-1.5 rounded-lg transition-all duration-200
                                   transform hover:scale-110 shadow-lg"
                          aria-label="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Add More Images Hint */}
            {multiple && !isLimitReached && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 font-medium">
                  {maxFiles
                    ? `Click or drag to add more images (${preview.length}/${maxFiles})`
                    : "Click or drag to add more images"
                  }
                </p>
              </div>
            )}
            {/* Limit Reached Message */}
            {multiple && isLimitReached && (
              <div className="mt-6 text-center">
                <p className="text-sm text-green-700 font-medium">
                  Maximum limit of {maxFiles} images reached
                </p>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="text-center space-y-4">
            {/* Upload Icon */}
            <div className="bg-brand-300 mx-auto w-20 h-20 rounded-full 
                          flex items-center justify-center ">
              <svg
                className="w-10 h-10 text-brand-600 group-hover:text-brand-700 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {/* Text Content */}
            <div>
              <h4 className="text-sm text-gray-600 mb-3">
                {multiple
                  ? "Drag & drop multiple images or click to browse"
                  : "Drag & drop an image or click to browse"
                }
              </h4>
            </div>
            {/* Browse Button */}
            <Button size="sm" variant="primary"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600  text-white font-semibold rounded-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropzoneComponent;