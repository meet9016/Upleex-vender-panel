"use client";

import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";
import { toast } from "react-toastify";
import imageCompression from 'browser-image-compression';

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
  const [isPDF, setIsPDF] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setIsPDF(false);
      return;
    }

    // If file is a string (URL)
    if (typeof file === 'string') {
      const isPDFUrl = file.toLowerCase().endsWith('.pdf');
      setIsPDF(isPDFUrl);
      setPreview(file);
      return;
    }

    // If file is a File object
    if (file instanceof File) {
      const isPDFFile = file.type === 'application/pdf';
      setIsPDF(isPDFFile);
      
      if (isPDFFile) {
        setPreview(URL.createObjectURL(file));
      } else if (file.type?.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [file]);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      // Create new File with original name
      const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
      toast.success(`File compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(renamedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return renamedFile;
    } catch (error) {
      toast.error("Compression failed, using original file");
      return file;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (!selected) return;

    // Check file type - allow images and PDFs
    const isImage = selected.type.startsWith("image/");
    const isPDF = selected.type === "application/pdf";

    if (!isImage && !isPDF) {
      toast.error("Please upload only image files or PDF");
      e.target.value = ""; 
      return;
    }

    // Auto-compress if file is larger than 2MB and is an image
    let finalFile = selected;
    if (isImage && selected.size > 2 * 1024 * 1024) {
      toast.info("Compressing large image...");
      finalFile = await compressImage(selected);
    }

    // Check if PDF is too large (optional warning)
    if (isPDF && selected.size > 10 * 1024 * 1024) {
      toast.warning("PDF file is larger than 10MB");
    }

    onChange(finalFile);
    
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
          <span className={`text-sm `}>Click to upload (Image or PDF)</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,application/pdf"
          />
        </label>
      ) : (
        <div className={`relative p-3 border rounded-lg group ${
          error ? "border-red-600 bg-red-50" : "border-gray-300 bg-gray-50"
        }`}>
          <div className="relative">
            {isPDF ? (
              <div className="flex items-center gap-3 p-2">
                <svg className="w-12 h-12 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <text x="7" y="17" fontSize="6" fill="white" fontWeight="bold">PDF</text>
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {file instanceof File ? file.name : 'PDF Document'}
                  </div>
                  {file instanceof File && (
                    <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  )}
                  {preview && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-xs text-blue-600 hover:underline mt-1 h-22"
                    >
                      View PDF
                    </button>
                  )}
                </div>
              </div>
            ) : preview ? (
              <img
                src={preview}
                alt="preview"
                onClick={() => setShowModal(true)}
                className="w-full h-32 object-cover rounded cursor-pointer"
              />
            ) : (
              <div className="text-sm p-2">
                <div className="font-medium">{file instanceof File ? file.name : 'Uploaded file'}</div>
                {file instanceof File && (
                  <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                )}
              </div>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-2xl sm:text-3xl bg-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 hover:bg-red-700 z-10"
          >
            ✕
          </button>
          {isPDF ? (
            <iframe
              src={preview}
              className="w-full h-full max-w-5xl max-h-[90vh] bg-white rounded-lg"
              title="PDF Preview"
            />
          ) : (
            <img src={preview} className="max-w-[90%] max-h-[90%] rounded" alt="preview" />
          )}
        </div>
      )}
    </div>
  );
}
