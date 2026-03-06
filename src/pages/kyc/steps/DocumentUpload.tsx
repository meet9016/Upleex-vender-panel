"use client";

import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";
import { toast } from "react-toastify";

type Props = {
  label: string;
  file: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  clearError?: () => void; // नया prop add करें
};

export default function DocumentUpload({
  label,
  file,
  onChange,
  error,
  clearError // नया prop
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    // If file is a string (URL), use it directly as preview
    if (typeof file === 'string') {
      setPreview(file);
      return;
    }

    // If file is a File object and is an image, create object URL
    if (file instanceof File && file.type?.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (selected && !selected.type.startsWith("image/")) {
      toast.error("Please upload only image files (PNG, JPG, JPEG, GIF, etc.)");
      e.target.value = ""; 
      return;
    }

    if (selected && selected.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      e.target.value = "";
      return;
    }

    onChange(selected);
    
    if (clearError) {
      clearError();
    }
  };

  const handleRemoveFile = () => {
    onChange(null);
    // file remove करने पर भी error clear हो सकता है (अगर चाहें तो)
    // if (clearError) {
    //   clearError();
    // }
  };

  return (
    <div className="w-full relative">
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
        {label}
      </label>

      {!file ? (
        <label className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition text-center ${
          error ? "border-red-600 bg-red-50" : "border-gray-400 hover:bg-gray-100"
        }`}>
          <span className={`text-sm `}>Click to upload</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
      ) : (
        <div className={`relative p-3 border rounded-lg group ${
          error ? "border-red-600 bg-red-50" : "border-gray-300 bg-gray-50"
        }`}>
          <div className="relative">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="preview"
                  onClick={() => setShowModal(true)}
                  className="w-full h-32 object-cover rounded cursor-pointer"
                />

              </>
            ) : (
              <div className="text-sm">{file instanceof File ? file.name : 'Uploaded file'}</div>
            )}
          </div>


          <button
            onClick={handleRemoveFile}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs hover:bg-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {showModal && preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-2xl sm:text-3xl bg-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 hover:bg-red-700"
          >
            ✕
          </button>
          <img src={preview} className="max-w-[90%] max-h-[90%]" alt="preview" />
        </div>
      )}
    </div>
  );
}
