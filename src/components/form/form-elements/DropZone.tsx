"use client";
import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import endPointApi from "@/utils/endPointApi";
import { api } from "@/utils/axiosInstance";
import { FiUploadCloud } from "react-icons/fi";
import { FiFolder } from "react-icons/fi";

interface DropzoneProps {
  preview: any;
  setPreview: any;
  onFileSelect?: (files: File[], ids?: string[]) => void;
  onFileRemove?: (id?: string) => void;
  multiple?: boolean;
  smallPreview?: boolean;
  maxFiles?: number;
  isEditMode?: boolean; 
}

const DropzoneComponent: React.FC<DropzoneProps> = ({
  preview,
  setPreview,
  onFileSelect,
  onFileRemove,
  multiple = false,
  smallPreview = false,
  maxFiles,
  isEditMode = false
}) => {


  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const err = rejectedFiles[0]?.errors?.[0];
      if (err?.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 10MB.');
      } else if (err?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please upload JPEG, PNG, WEBP, or SVG.');
      } else {
        toast.error('Upload failed: ' + (err?.message || 'invalid file'));
      }
      return;
    }

    if (!multiple) {
      // Single image
      const file = acceptedFiles[0];
      const imgUrl = URL.createObjectURL(file);
      const mainImg = { product_image_id: 'temp_1', image: imgUrl }
      setPreview([mainImg])

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
          const ids = filesToAdd.map((_, idx) => `temp_${Date.now()}_${idx}`);
          const newImages = filesToAdd.map((f, idx) => ({
            product_image_id: ids[idx],
            image: URL.createObjectURL(f)
          }));
          setPreview((prev: any) => [...prev, ...newImages]);
          onFileSelect?.(filesToAdd, ids);
          return;
        }
        const ids = acceptedFiles.map((_, idx) => `temp_${Date.now()}_${idx}`);
        const newImages = acceptedFiles.map((f, idx) => ({
          product_image_id: ids[idx],
          image: URL.createObjectURL(f)
        }));
        setPreview((prev: any) => [...prev, ...newImages]);
        onFileSelect?.(acceptedFiles, ids);
      } else {
        // No limit - original behavior
        const ids = acceptedFiles.map((_, idx) => `temp_${Date.now()}_${idx}`);
        const newImages = acceptedFiles.map((f, idx) => ({
          product_image_id: ids[idx],
          image: URL.createObjectURL(f)
        }));
        setPreview((prev: any) => [...prev, ...newImages]);
        onFileSelect?.(acceptedFiles, ids);
      }
    }
  };

  { /* <!-- ======================================================  main Image  ====================================================== -->*/ }

  const removeImage = async (productImageId: string) => {
    setPreview((prev: any) => prev.filter((img: any) => img.product_image_id !== productImageId));
    // Notify parent to clear the file state
    onFileRemove?.(productImageId);

    if (isEditMode && productImageId && !productImageId.startsWith('temp_')) {
      try {
        const formdata = new FormData();
        formdata.append("product_image_id", productImageId);
        await api.post(endPointApi.postSubImageDelete, formdata);
      } catch (err) {
        console.error("Error deleting image", err);
      }
    }
  };
  const isLimitReached = Boolean(maxFiles && preview && preview.length >= maxFiles);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: isLimitReached,
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

        {preview && preview.length > 0 && preview[0].image !== "" ? (
          <div className="w-full ">
            { /* <!-- ======================================================  main Image  ====================================================== -->*/}


            {!multiple && preview[0].image !== "" && (
              <div className="flex justify-center items-center">
                <div className="relative group/image">
                  <img
                    src={preview[0].image}
                    alt="Preview"
                    className="rounded-xl object-cover shadow-2xl max-h-[280px] w-auto max-w-full 
                              ring-4 ring-gray-100 transition-transform duration-300 
                              group-hover/image:scale-[1.02]"
                  />
                  { /* <!-- ======================================================  Overlay on Hover  ====================================================== -->*/}

                  <div className="absolute top-2 right-2 bg-opacity-0 group-hover/image:bg-opacity-20 
                transition-all duration-300 rounded-xl flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(preview[0].product_image_id);
                      }}
                      className="opacity-0 group-hover/image:opacity-100
               bg-[rgb(58,140,237)] hover:bg-[rgb(37,115,210)] text-white
               px-3 py-2 rounded-lg font-bold
               transform scale-90 group-hover/image:scale-100
               transition-all duration-300 shadow-xl
               flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {/* Remove */}
                    </button>
                  </div>

                </div>
              </div>
            )}

            { /* <!-- ======================================================  Multiple Images  ====================================================== -->*/}

            {multiple && preview && (
              <div className={`
                hidden md:grid gap-4 w-full
                ${smallPreview
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                }
              `}>
                {preview?.filter((img: any) => img && img.image && img.image !== "").map((img: any, index: any) => (
                  <div
                    key={index}
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
                      <div className="absolute top-2 left-2 right-2 flex justify-end items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.product_image_id);
                          }}
                          className="bg-[rgb(58,140,237)] hover:bg-[rgb(37,115,210)] text-white 
                 p-1.5 rounded-lg transition-all duration-200
                 transform hover:scale-110 shadow-lg font-bold"
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

            {/* Mobile horizontal scroll for sub images */}
            {multiple && preview && (
              <div className="flex md:hidden gap-3 overflow-x-auto pb-1 w-full">
                {preview?.filter((img: any) => img && img.image && img.image !== "").map((img: any, index: any) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-xl
                             bg-gray-100 shadow-md"
                  >
                    <img
                      src={img.image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.product_image_id);
                      }}
                      className="absolute top-1 right-1 bg-[rgb(58,140,237)] text-white
                       p-0.5 rounded-md shadow"
                      aria-label="Remove image"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            { /* <!-- ======================================================  Add More Images Hint ====================================================== -->*/}


            {multiple && !isLimitReached && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 font-medium">
                  {maxFiles
                    ? `Click or drag to add more images (${preview?.length || 0}/${maxFiles})`
                    : "Click or drag to add more images"
                  }
                </p>
              </div>
            )}

            { /* <!-- ======================================================  Limit Reached Message ====================================================== -->*/}

            {multiple && isLimitReached && (
              <div className="mt-6 text-center">
                <p className="text-sm text-success-700 font-medium">
                  Maximum limit of {maxFiles} images reached
                </p>
              </div>
            )}
          </div>
        ) :
          /* <!-- ====================================================== Sub Images  ====================================================== -->*/

          (<div className="text-center space-y-4">
            {/* Upload Icon */}
            <div className="mx-auto w-20 h-20 rounded-full 
                flex items-center justify-center 
                bg-indigo-50">
  <FiUploadCloud size={42} className="text-gray-600" />
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
            <Button
              size="sm"
              variant="primary"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <FiFolder size={18} />
              Browse Files
            </Button>
          </div>
          )}
      </div>
    </div>
  );
};

export default DropzoneComponent;