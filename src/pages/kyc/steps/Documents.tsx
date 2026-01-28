"use client";

import DocumentUpload from "./DocumentUpload";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;

};

export default function Documents({
  setKYCFormData,
  KYCformData,
  errors,
  clearError
}: KYCFormProp) {
  const updateFile =
    (key: keyof KycFormDataType) => (file: File | null) => {
    clearError(key);

      setKYCFormData((prev) => ({
        ...prev,
        [key]: file,
      }));
    };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DocumentUpload
        label="PAN Card (Front)"
        file={KYCformData?.pancard_front_image}
        onChange={updateFile("pancard_front_image")}
        error={errors?.pancard_front_image}
        clearError={clearError}
      />

      <DocumentUpload
        label="Aadhaar Card (Front)"
        file={KYCformData?.aadharcard_front_image}
        onChange={updateFile("aadharcard_front_image")}
        error={errors?.aadharcard_front_image}
        clearError={clearError}
      />

      <DocumentUpload
        label="Aadhaar Card (Back)"
        file={KYCformData?.aadharcard_back_image}
        onChange={updateFile("aadharcard_back_image")}
        error={errors?.aadharcard_back_image}
        clearError={clearError}
      />

      <DocumentUpload
        label="GST Certificate"
        file={KYCformData?.gst_certificate_image}
        onChange={updateFile("gst_certificate_image")}
        error={errors?.gst_certificate_image}
        clearError={clearError}
      />
    </div>
  );
}
