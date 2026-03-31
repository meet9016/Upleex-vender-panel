"use client";

import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/imageCompression";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiX, FiEye, FiImage } from "react-icons/fi";

type Props = {
  label: string;
  file: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  clearError?: () => void; 
  required?: boolean;
  disabled?: boolean;
};

export default function DocumentUpload({
  label,
  file,
  onChange,
  error,
  clearError,
  disabled,
  // required = false,
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

// Replaced by shared utility in @/utils/imageCompression

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

    // Auto-compress all images to ensure the total payload for multiple files remains small
    let finalFile = selected;
    if (isImage) {
      if (selected.size > 0.5 * 1024 * 1024) {
        toast.info("Optimizing large image...");
        finalFile = await compressImage(selected, 0.8);
        // if (finalFile.size < selected.size) {
        //     toast.success(`Image optimized: ${(selected.size / 1024 / 1024).toFixed(2)}MB → ${(finalFile.size / 1024 / 1024).toFixed(2)}MB`);
        // }
      }
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
    
    // Reset file input if it exists
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    console.log('File removal onChange called with null'); // Debug log
  };

  return (
    <div className="w-full relative group/upload">
      <label className="block mb-2 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      {!file ? (
        <label className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 text-center overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none ' : 'cursor-pointer '
        }${
          error 
            ? "border-rose-300 bg-rose-50/30 dark:bg-rose-900/10" 
            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-500/5"
        }`}>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-transform duration-300">
            <FiUploadCloud className={`text-3xl ${error ? "text-red-500" : "text-indigo-500"}`} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drag & drop or <span className="text-indigo-600 dark:text-indigo-400">Browse</span>
            </p>
            <p className="text-xs text-slate-400">Supports JPG, PNG or PDF (Max 2MB recommended)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            disabled={disabled}
          />
        </label>
      ) : (
        <div className={`relative p-4 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border rounded-2xl transition-all duration-300 group/card ${
          error 
            ? "border-rose-300 bg-rose-50/30 shadow-rose-500/5" 
            : "border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:shadow-slate-300/50"
        }`}>
          <div className="flex items-center gap-4">
            {/* File Preview Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              {isPDF ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-900/20">
                  <FiFileText className="text-2xl text-red-500" />
                  <span className="text-[8px] font-bold text-red-500 uppercase mt-1">PDF</span>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <FiImage className="text-xl text-slate-400" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-2">
                  {file instanceof File ? file.name : 'Document Uploaded'}
                </span>
                <FiCheckCircle className="text-emerald-500 text-xs flex-shrink-0" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {file instanceof File ? (file.size / 1024 / 1024).toFixed(2) + " MB" : (isPDF ? 'PDF' : 'Image')}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Ready to Submit
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all duration-200 shadow-sm"
                title="View Document"
              >
                <FiEye className="text-sm" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Remove button clicked'); // Debug log
                  handleRemoveFile();
                }}
                className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all duration-200 shadow-sm"
                title="Remove File"
                type="button"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {showModal && preview && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[99999] p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-4">
            <button
              onClick={() => setShowModal(false)}
              className="p-3 bg-white/10 text-white rounded-full hover:bg-rose-600 transition-all duration-200 group"
              title="Close Preview"
            >
              <FiX className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
            {isPDF ? (
              <iframe
                src={preview}
                className="w-full h-full max-w-6xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border-4 border-white/10"
                title="PDF Preview"
              />
            ) : (
              <img 
                src={preview} 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
                alt="Document Full View" 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
