"use client";

import Input from "@/components/common/Input";
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

  {/* <!-- =========================================================== UI =========================================================== --> */ }

  return (

    <div className="w-full">
      {/* <!-- =========================================================== Form component =========================================================== --> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* <!-- =========================================================== Aadhaar Number =========================================================== --> */}

        <div>
          <Label>PAN Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your PAN Number"
              type="text"
              value={KYCformData?.pancard_number || ""}
              maxLength={10}
              onChange={(e) => {
                const value = e.target.value.toUpperCase(); 

                if (value) {
                  clearError("pancard_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    pancard_number: value,
                  }));
                }
              }}
            />
            {errors.pancard_number && (
              <p className="mt-1 text-sm text-red-500">{errors.pancard_number}</p>
            )}
          </div>
        </div>

        {/* <!-- =========================================================== Aadhaar Number =========================================================== --> */}

        <div>
          <Label>Aadhaar Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Aadhaar Number"
              type="text"
              value={KYCformData?.aadharcard_number || ""}
              maxLength={14} // 12 digits + 2 spaces
              onChange={(e) => {
                let value = e.target.value;

                // Remove all spaces to get only digits
                const digitsOnly = value.replace(/\s/g, '');

                // Allow empty input
                if (digitsOnly === "") {
                  clearError("aadharcard_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    aadharcard_number: "",
                  }));
                  return;
                }

                // Validate Aadhaar format: first digit 2-9, rest 0-9, max 12 digits
                const isValidDigits = /^[2-9][0-9]{0,11}$/.test(digitsOnly);

                if (isValidDigits) {
                  // Auto-format with spaces: XXXX XXXX XXXX
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
            {errors.aadharcard_number && (
              <p className="mt-1 text-sm text-red-500">{errors.aadharcard_number}</p>
            )}
          </div>
        </div>

        {/* <!-- =========================================================== Business Name =========================================================== --> */}

        <div>
          <Label>Business Name</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Business Name"
              type="text"
              value={KYCformData?.business_name || ""}
              onChange={(e) => {
                clearError("business_name")
                setKYCFormData((prevData) => ({
                  ...prevData, business_name: e.target.value,
                }))
              }}
            />
            {errors.business_name && (
              <p className="mt-1 text-sm text-red-500">{errors.business_name}</p>
            )}
          </div>
        </div>

        {/* <!-- =========================================================== GST Number =========================================================== --> */}

        <div>
          <Label>GST Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your GST Number"
              type="text"
              value={KYCformData?.gst_number || ""}
              maxLength={15}
              onChange={(e) => {
                const value = e.target.value.toUpperCase(); // Auto convert to uppercase
                  clearError("gst_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    gst_number: value,
                  }));                
              }}
            />
            {errors.gst_number && (
              <p className="mt-1 text-sm text-red-500">{errors.gst_number}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
