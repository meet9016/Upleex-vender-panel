"use client";

import DocumentUpload from "./DocumentUpload";
import type { ErrorType, KycFormDataType } from "@/pages/kyc/KycPage";

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;
  isServiceOnly: boolean;
};

export default function Documents({
  setKYCFormData,
  KYCformData,
  errors,
  clearError,
  isServiceOnly,
}: KYCFormProp) {

  // Update function with proper null handling
  const updateFile = (key: keyof KycFormDataType) => (file: File | null) => {
    setKYCFormData((prev) => {
      const updated = {
        ...prev,
        [key]: file,
      };
      return updated;
    });
    
    // Clear error when file is removed or added
    if (file === null) {
      clearError(key);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DocumentUpload
        label="PAN Card (Front)"
        file={KYCformData?.pancard_front_image}
        onChange={updateFile("pancard_front_image")}
        error={errors?.pancard_front_image}
        clearError={() => clearError('pancard_front_image')}
        required={true}
      />

      <DocumentUpload
        label="Aadhaar Card (Front)"
        file={KYCformData?.aadharcard_front_image}
        onChange={updateFile("aadharcard_front_image")}
        error={errors?.aadharcard_front_image}
        clearError={() => clearError('aadharcard_front_image')}
        required={true}
      />

      <DocumentUpload
        label="Aadhaar Card (Back)"
        file={KYCformData?.aadharcard_back_image}
        onChange={updateFile("aadharcard_back_image")}
        error={errors?.aadharcard_back_image}
        clearError={() => clearError('aadharcard_back_image')}
        required={true}
      />

      <DocumentUpload
        label="GST Certificate"
        file={KYCformData?.gst_certificate_image}
        onChange={updateFile("gst_certificate_image")}
        error={errors?.gst_certificate_image}
        clearError={() => clearError('gst_certificate_image')}
        disabled={KYCformData?.no_gst}
        required={!KYCformData?.no_gst}
      />

      <DocumentUpload
        label="Business logo"
        file={KYCformData?.business_logo_image}
        onChange={updateFile("business_logo_image")}
        error={errors?.business_logo_image}
        clearError={() => clearError('business_logo_image')}
      />

      <DocumentUpload
        label="Vendor image"
        file={KYCformData?.vendor_image}
        onChange={updateFile("vendor_image")}
        error={errors?.vendor_image}
        clearError={() => clearError('vendor_image')}
      />

      {!isServiceOnly && (
        <>
          <DocumentUpload
            label="Upload QR Code"
            file={KYCformData?.qr_code_image}
            onChange={updateFile("qr_code_image")}
            error={errors?.qr_code_image}
            clearError={() => clearError('qr_code_image')}
            required={true}
          />

          <DocumentUpload
            label="Upload Cheque"
            file={KYCformData?.cheque_image}
            onChange={updateFile("cheque_image")}
            error={errors?.cheque_image}
            clearError={() => clearError('cheque_image')}
            required={true}
          />
        </>
      )}
    </div>
  );
}