"use client";

import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";
import { toast } from "react-toastify";

type Props = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;

};

export default function DocumentUpload({
  label,
  file,
  onChange,
  error,

}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    if (file.type.startsWith("image/")) {
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

    onChange(selected);

  };

  return (
    <div className="w-full relative">
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>

      {!file ? (
        <label className="border border-dashed border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition text-center">
          <span className="text-gray-600 text-sm">Click to upload</span>

<input 
  type="file" 
  className="hidden" 
  onChange={handleFileChange}
  accept="image/*"
/>
        </label>
      ) : (
        <div className="relative p-3 border rounded-lg bg-gray-50 group">
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
              <div className="text-sm">{file.name}</div>
            )}
          </div>


          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
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
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-2xl sm:text-3xl bg-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10"
          >
            ✕
          </button>
          <img src={preview} className="max-w-[90%] max-h-[90%]" />
        </div>
      )}
    </div>
  );
}
