"use client";
import { useState } from "react";

type Props = {
  label: string;
};

export default function DocumentUpload({ label }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // modal open/close

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);

    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="w-full relative">
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>

      {!file ? (
        <label
          className="border border-dashed border-gray-400 rounded-lg p-4 
          flex flex-col items-center justify-center cursor-pointer 
          hover:bg-gray-100 transition text-center"
        >
          <span className="text-gray-600 text-sm">Click to upload</span>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="relative p-3 border rounded-lg bg-gray-50 group cursor-pointer">
          {/* Image Preview */}
          {preview ? (
            <>
              <img
                src={preview}
                alt="preview"
                onClick={() => setShowModal(true)}
                className="w-full h-32 object-cover rounded transition"
              />

              {/* Hover Preview (Bigger) */}
              <div className="absolute hidden group-hover:flex 
                items-center justify-center bg-black/60 rounded-lg 
                top-3 left-3 w-[150px] h-[150px] z-20">
                <img
                  src={preview}
                  className="rounded border shadow-xl w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            <div className="p-3 text-sm text-gray-600 bg-white rounded border">
              {file.name}
            </div>
          )}

          {/* REMOVE BUTTON */}
          <button
            onClick={removeFile}
            className="absolute top-2 right-2 bg-red-600 text-white 
              rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* FULL SCREEN MODAL */}
      {showModal && preview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
        >
          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-6 right-6 text-white text-3xl font-bold"
          >
            ✕
          </button>

          <img
            src={preview}
            className="max-w-[90%] max-h-[90%] rounded shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
