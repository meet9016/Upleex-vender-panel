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
              onFocus={() => clearError("pancard_number")}

              value={KYCformData?.pancard_number || ""}
              onChange={(e) => {
                setKYCFormData((prevData) => ({
                  ...prevData, pancard_number: e.target.value,
                }))
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
              onFocus={() => clearError("aadharcard_number")}

              value={KYCformData?.aadharcard_number || ""}

              onChange={(e) => {
                setKYCFormData((prevData) => ({
                  ...prevData, aadharcard_number: e.target.value,
                }))
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
              onFocus={() => clearError("business_name")}

              value={KYCformData?.business_name || ""}
              onChange={(e) => {
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
              onFocus={() => clearError("gst_number")}

              value={KYCformData?.gst_number || ""}
              onChange={(e) => {
                setKYCFormData((prevData) => ({
                  ...prevData, gst_number: e.target.value,
                }))
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
