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
                const value = e.target.value.toUpperCase(); // Auto convert to uppercase

                // Allow empty input
                if (value === "") {
                  clearError("pancard_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    pancard_number: value,
                  }));
                  return;
                }

                // Validate PAN format while typing: [A-Z]{5}[0-9]{4}[A-Z]{1}
                let isValid = false;

                if (value.length <= 5) {
                  // First 5 characters must be letters
                  isValid = /^[A-Z]{0,5}$/.test(value);
                } else if (value.length <= 9) {
                  // First 5 letters + next 4 digits
                  isValid = /^[A-Z]{5}[0-9]{0,4}$/.test(value);
                } else if (value.length === 10) {
                  // Complete PAN: 5 letters + 4 digits + 1 letter
                  isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
                }

                if (isValid) {
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

                // Allow empty input
                if (value === "") {
                  clearError("gst_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    gst_number: value,
                  }));
                  return;
                }

                // Validate GST format while typing: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
                let isValid = false;

                if (value.length <= 2) {
                  // First 2 characters must be digits (state code)
                  isValid = /^[0-9]{0,2}$/.test(value);
                } else if (value.length <= 7) {
                  // First 2 digits + next 5 letters (PAN)
                  isValid = /^[0-9]{2}[A-Z]{0,5}$/.test(value);
                } else if (value.length <= 11) {
                  // 2 digits + 5 letters + next 4 digits
                  isValid = /^[0-9]{2}[A-Z]{5}[0-9]{0,4}$/.test(value);
                } else if (value.length === 12) {
                  // + 1 letter (entity code)
                  isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
                } else if (value.length === 13) {
                  // + 1 character (1-9 or A-Z)
                  isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}$/.test(value);
                } else if (value.length === 14) {
                  // + must be 'Z'
                  isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z$/.test(value);
                } else if (value.length === 15) {
                  // Complete GST: + last character (0-9 or A-Z)
                  isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
                }

                if (isValid) {
                  clearError("gst_number");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    gst_number: value,
                  }));
                }
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
