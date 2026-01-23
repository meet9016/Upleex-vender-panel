"use client";

import { useEffect, useState } from "react";
import Stepper from "./Stepper";
import StepContact from "./steps/StepContact";
import StepIdentity from "./steps/StepIdentity";
import StepBankDetails from "./steps/StepBankDetails";
import StepDocument from "./steps/StepDocument";
import StepDeclaration from "./steps/StepDeclaration";
import ComponentCard from "@/components/common/ComponentCard";
import { toast } from "react-toastify";

const steps = [
  "Contact Details",
  "Identity",
  "Bank",
  "Documents",
  "Declaration",
];

export type kycFormData = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
};

export type KycFormDataType = {
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  pincode: string;
  country_id: { value: string; label: string };
  state_id: { value: string; label: string };
  city_id: { value: string; label: string };
  pancard_number: string;
  aadharcard_number: string;
  business_name: string;
  gst_number: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  pancard_front_image: string;
  aadharcard_front_image: string;
  aadharcard_back_image: string;
  gst_certificate_image: string;
  terms_conditions: number;
};

export type ErrorType = {
  full_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  pincode?: string;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  pancard_number?: string;
  aadharcard_number?: string;
  business_name?: string;
  gst_number?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  pancard_front_image?: string;
  aadharcard_front_image?: string;
  aadharcard_back_image?: string;
  gst_certificate_image?: string;
  terms_conditions?: string;
};

export default function KYCPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const [KYCformData, setKYCFormData] = useState<KycFormDataType>({
    full_name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    country_id: { value: "97", label: "India" },
    state_id: { value: "1532", label: "Gujrat" },
    city_id: { value: "42791", label: "Surat" },
    pancard_number: "",
    aadharcard_number: "",
    business_name: "",
    gst_number: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    account_type: "",
    pancard_front_image: "",
    aadharcard_front_image: "",
    aadharcard_back_image: "",
    gst_certificate_image: "",
    terms_conditions: 0,
  });

  const [errors, setErrors] = useState<ErrorType>({});

  const FormDataValidation = () => {
    if (currentStep !== 0) {
      setCurrentStep((s) => s + 1);
      return;
    }

    const newErrors: ErrorType = {};

    // helpers
    const isEmpty = (val: string) => !val.trim();
    const hasNumber = (val: string) => /\d/.test(val);
    const isEmailValid = (val: string) =>
      /^(?!\.)(?!.*\.\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val);

    const isOnlyDigits = (val: string) => /^\d+$/.test(val);

    // Full Name
    if (isEmpty(KYCformData.full_name)) {
      newErrors.full_name = "Name is required";
    } else if (hasNumber(KYCformData.full_name)) {
      newErrors.full_name = "Name should not contain numbers";
    }

    // Email
    if (isEmpty(KYCformData.email)) {
      newErrors.email = "Email is required";
    } else if (!isEmailValid(KYCformData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Mobile
    if (isEmpty(KYCformData.mobile)) {
      newErrors.mobile = "Mobile number is required";
    } else if (
      !isOnlyDigits(KYCformData.mobile) ||
      KYCformData.mobile.length !== 10
    ) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    // Address
    if (isEmpty(KYCformData.address)) {
      newErrors.address = "Address is required";
    }

    // Pincode
    if (isEmpty(KYCformData.pincode)) {
      newErrors.pincode = "Pincode is required";
    } else if (
      !isOnlyDigits(KYCformData.pincode) ||
      KYCformData.pincode.length !== 6
    ) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    // Country
    if (!KYCformData.country_id?.value) {
      newErrors.country_id = "Country is required";
    }

    // State
    if (!KYCformData.state_id?.value) {
      newErrors.state_id = "State is required";
    }

    // City
    if (!KYCformData.city_id?.value) {
      newErrors.city_id = "City is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep((s) => s + 1);
    }


    
  };


  useEffect(() => {
    console.log("formdata => ", KYCformData, "\n ", "errors", errors, "\n ")
  }, [errors, currentStep])

  return (
    <ComponentCard title="KYC Verification">

      {/* Stepper scroll on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-max md:min-w-0">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Form Body */}
      <div>
        {currentStep === 0 && <StepContact setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} />}
        {currentStep === 1 && <StepIdentity />}
        {currentStep === 2 && <StepBankDetails />}
        {currentStep === 3 && <StepDocument />}
        {currentStep === 4 && <StepDeclaration />}
      </div>

      {/* Sticky Footer */}
      <div
        className="
            sticky bottom-0 left-0 right-0 
            bg-white py-3 md:py-4 
            flex flex-col md:flex-row 
            gap-3 md:gap-0
            items-center justify-between 
            border-t z-50
          "
      >
        {/* Back Button */}
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="
                px-6 py-2 w-full md:w-auto 
                rounded-lg border border-gray-300
                text-gray-700 hover:bg-gray-100 transition
              "
          >
            Back
          </button>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Next / Submit */}
        <button
          onClick={() => {

            FormDataValidation()
            if (currentStep === steps.length - 1)
              alert("KYC Submitted")
          }}

          className="px-8 py-2 w-full md:w-auto 
              rounded-lg bg-blue-600 text-white
              hover:bg-blue-700 transition font-medium">

          {currentStep === steps.length - 1 ? "Submit KYC" : "Next"}
        </button>
      </div>
      
    </ComponentCard>
  );
}
