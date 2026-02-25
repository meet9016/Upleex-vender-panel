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
}: KYCFormProp) {
  
  // Update function without calling clearError for file fields
  const updateFile = (key: keyof KycFormDataType) => (file: File | null) => {
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
      />

      <DocumentUpload
        label="Aadhaar Card (Front)"
        file={KYCformData?.aadharcard_front_image}
        onChange={updateFile("aadharcard_front_image")}
        error={errors?.aadharcard_front_image}
      />

      <DocumentUpload
        label="Aadhaar Card (Back)"
        file={KYCformData?.aadharcard_back_image}
        onChange={updateFile("aadharcard_back_image")}
        error={errors?.aadharcard_back_image}
      />

      <DocumentUpload
        label="GST Certificate"
        file={KYCformData?.gst_certificate_image}
        onChange={updateFile("gst_certificate_image")}
        error={errors?.gst_certificate_image}
      />

      <DocumentUpload
        label="Business logo"
        file={KYCformData?.business_logo_image}
        onChange={updateFile("business_logo_image")}
        error={errors?.business_logo_image}
      />

      <DocumentUpload
        label="Vendor image"
        file={KYCformData?.vendor_image}
        onChange={updateFile("vendor_image")}
        error={errors?.vendor_image}
      />
    </div>
  );
}