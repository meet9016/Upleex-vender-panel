"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/common/Input";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage'

/* <!-- =========================================== Types  =========================================== --> */

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;
};

export default function Identity({ setKYCFormData, KYCformData, errors, clearError }: KYCFormProp) {

  const handleNoGSTChange = (checked: boolean) => {
    setKYCFormData((prevData) => ({
      ...prevData,
      no_gst: checked,
      gst_number: checked ? "" : prevData.gst_number, // Clear GST if checked
    }));
    clearError("gst_number");
  };

  return (
    <ComponentCard title="Identity">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* PAN Number */}
        <div>
          <Label required>PAN Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your PAN Number"
              type="text"
              error={!!errors?.pancard_number}
              value={KYCformData?.pancard_number || ""}
              maxLength={10}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                clearError("pancard_number");
                setKYCFormData((prevData) => ({
                  ...prevData,
                  pancard_number: value,
                }));
              }}
            />
            {errors?.pancard_number && (
              <p className="error-message">{errors.pancard_number}</p>
            )}
          </div>
        </div>

        {/* Aadhaar Number */}
        <div>
          <Label required>Aadhaar Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Aadhaar Number"
              type="text"
              error={!!errors?.aadharcard_number}
              value={KYCformData?.aadharcard_number || ""}
              maxLength={14}
              onChange={(e) => {
                let value = e.target.value;
                const digitsOnly = value.replace(/\s/g, '');

                if (digitsOnly === "") {
                  clearError("aadharcard_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    aadharcard_number: "",
                  }));
                  return;
                }

                const isValidDigits = /^[2-9][0-9]{0,11}$/.test(digitsOnly);

                if (isValidDigits) {
                  let formatted = digitsOnly;
                  if (digitsOnly.length > 4) {
                    formatted = digitsOnly.slice(0, 4) + ' ' + digitsOnly.slice(4);
                  }
                  if (digitsOnly.length > 8) {
                    formatted = digitsOnly.slice(0, 4) + ' ' + digitsOnly.slice(4, 8) + ' ' + digitsOnly.slice(8);
                  }

                  clearError("aadharcard_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    aadharcard_number: formatted,
                  }));
                }
              }}
            />
            {errors?.aadharcard_number && (
              <p className="error-message">{errors.aadharcard_number}</p>
            )}
          </div>
        </div>

        {/* Business Name */}
        <div>
          <Label required>Business Name</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Business Name"
              type="text"
              error={!!errors?.business_name}
              value={KYCformData?.business_name || ""}
              onChange={(e) => {
                clearError("business_name");
                setKYCFormData((prevData) => ({
                  ...prevData, 
                  business_name: e.target.value,
                }));
              }}
            />
            {errors?.business_name && (
              <p className="error-message">{errors.business_name}</p>
            )}
          </div>
        </div>

        {/* GST Number with Checkbox */}
        <div className="space-y-2">
          <Label required>GST Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your GST Number"
              type="text"
              error={!!errors?.gst_number}
              value={KYCformData?.gst_number || ""}
              maxLength={15}
              disabled={KYCformData?.no_gst || false}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                clearError("gst_number");
                setKYCFormData((prevData) => ({
                  ...prevData,
                  gst_number: value,
                }));
              }}
            />
            {errors?.gst_number && (
              <p className="error-message">{errors.gst_number}</p>
            )}
          </div>
          
          {/* Checkbox for "I don't have GST" */}
      {/* GST Number with Checkbox */}
<div className="space-y-2">
  {/* <Label>GST Number</Label>
  <div className="relative">
    <Input
      placeholder="Enter your GST Number"
      type="text"
      error={!!errors?.gst_number}
      value={KYCformData?.gst_number || ""}
      maxLength={15}
      disabled={KYCformData?.no_gst || false}
      onChange={(e) => {
        const value = e.target.value.toUpperCase();
        clearError("gst_number");
        setKYCFormData((prevData) => ({
          ...prevData,
          gst_number: value,
        }));
      }}
    />
    {errors?.gst_number && (
      <p className="mt-1 text-sm text-error">{errors.gst_number}</p>
    )}
  </div> */}
  
  {/* Checkbox for "I don't have GST" - FIXED: Changed 'checkbox' to 'Checkbox' */}
  <div className="flex items-center mt-2">
    <Checkbox
      checked={KYCformData?.no_gst || false}
      onChange={handleNoGSTChange}
      id="no-gst-checkbox"
    />
    <label 
      htmlFor="no-gst-checkbox" 
      className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
    >
      I don't have GST registration
    </label>
  </div>
</div>
        </div>
      </div>
    </ComponentCard>
  );
}