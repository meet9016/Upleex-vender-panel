"use client";
import React from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  preview: string[];
  setPreview: React.Dispatch<React.SetStateAction<string[]>>;
  onFileSelect?: (files: File[]) => void;
  multiple?: boolean;
  smallPreview?: boolean; // multi image size
}

const DropzoneComponent: React.FC<DropzoneProps> = ({
  preview,
  setPreview,
  onFileSelect,
  multiple = false,
  smallPreview = false,
}) => {
  const onDrop = (acceptedFiles: File[]) => {
    if (!multiple) {
      // Single image
      const file = acceptedFiles[0];
      const imgUrl = URL.createObjectURL(file);
      setPreview([imgUrl]);
      onFileSelect?.([file]);
    } else {
      // Multi image
      const newImages = acceptedFiles.map((f) => URL.createObjectURL(f));
      setPreview((prev) => [...prev, ...newImages]);
      onFileSelect?.(acceptedFiles);
    }
  };

  const removeImage = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`transition border border-gray-300 border-dashed rounded-xl 
          p-6 flex flex-col items-center justify-center cursor-pointer 
          h-72 w-full
          ${
            isDragActive
              ? "border-blue-500 bg-gray-100"
              : "border-gray-300 bg-gray-50"
          }`}
      >
        <input {...getInputProps()} />

        {/* Show Preview */}
        {preview.length > 0 ? (
          <div
            className={
              multiple
                ? "grid grid-cols-3 gap-3 w-full"
                : "w-full flex justify-center"
            }
          >
            {preview.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  className={`rounded-lg object-cover shadow 
                    ${
                      smallPreview
                        ? "w-24 h-24" // small thumbnails
                        : "w-60 h-60" // single image size
                    }
                  `}
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 text-lg">
              {isDragActive ? "Drop Files Here" : "Drag & Drop"}
            </h4>
            <p className="text-sm text-gray-500 mt-2">
              {multiple ? "Upload multiple images" : "Upload single image"}
            </p>
            <span className="underline text-blue-600 mt-2 block">
              Browse File
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropzoneComponent;
