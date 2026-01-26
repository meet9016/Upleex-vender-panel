"use client";

import { useEffect, useState } from "react";
import Stepper from "./Stepper";
import ContactDetails from "./steps/ContactDetails";
import Identity from "./steps/Identity";
import BankDetails from "./steps/BankDetails";
import Documents from "./steps/Documents";
import StepDeclaration from "./steps/StepDeclaration";
import ComponentCard from "@/components/common/ComponentCard";
import { toast } from "react-toastify";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

const steps = [
  "Contact Details",
  "Identity",
  "Bank",
  "Documents",
  "Declaration",
];

/* <!-- ========================================================== Types ========================================================== --> */


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
  confirm_account_number: string;
  ifsc_code: string;
  account_type: string;
  pancard_front_image: File | null;
  aadharcard_front_image: File | null;
  aadharcard_back_image: File | null;
  gst_certificate_image: File | null;

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
  confirm_account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  pancard_front_image?: string;
  aadharcard_front_image?: string;
  aadharcard_back_image?: string;
  gst_certificate_image?: string;
  terms_conditions?: string;
};


export default function KYCPage() {
  /* <!-- ========================================================== States ========================================================== --> */

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ErrorType>({});

  const clearError = (field: keyof ErrorType) => {
    setErrors(prev => {
      if (!prev[field]) return prev;

      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };


  const [KYCformData, setKYCFormData] = useState<KycFormDataType>({
    full_name: "test",
    email: "test@gmail.com",
    mobile: "9876543210",
    address: "shopno , surat",
    pincode: "395009",
    country_id: { value: "97", label: "India" },
    state_id: { value: "1532", label: "Gujrat" },
    city_id: { value: "42791", label: "Surat" },
    pancard_number: "9876543210",
    aadharcard_number: "987654321012",
    business_name: "shopno ecom pvt ltd",
    gst_number: "987654321012345",
    account_holder_name: "Bhavik wala",
    account_number: "1234567890",
    confirm_account_number: "1234567890",
    ifsc_code: "SBIN0000123",
    account_type: "1",
    pancard_front_image: null,
    aadharcard_front_image: null,
    aadharcard_back_image: null,
    gst_certificate_image: null,
    terms_conditions: 0,
  });


  /* <!-- ========================================================== validation ========================================================== --> */

  const FormDataValidation = () => {
    const newErrors: ErrorType = {};

    // helpers
    const isEmpty = (val: string) => !val.trim();
    const hasNumber = (val: string) => /\d/.test(val);
    const isEmailValid = (val: string) =>
      /^(?!\.)(?!.*\.\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val);
    const isOnlyDigits = (val: string) => /^\d+$/.test(val);

    // ---------------- STEP 0 ----------------

    if (currentStep === 0) {
      if (isEmpty(KYCformData.full_name)) {
        newErrors.full_name = "Name is required";
      } else if (hasNumber(KYCformData.full_name)) {
        newErrors.full_name = "Name should not contain numbers";
      }

      if (isEmpty(KYCformData.email)) {
        newErrors.email = "Email is required";
      } else if (!isEmailValid(KYCformData.email)) {
        newErrors.email = "Enter a valid email address";
      }

      if (isEmpty(KYCformData.mobile)) {
        newErrors.mobile = "Mobile number is required";
      } else if (
        !isOnlyDigits(KYCformData.mobile) ||
        KYCformData.mobile.length !== 10
      ) {
        newErrors.mobile = "Mobile number must be exactly 10 digits";
      }

      if (isEmpty(KYCformData.address)) {
        newErrors.address = "Address is required";
      }

      if (isEmpty(KYCformData.pincode)) {
        newErrors.pincode = "Pincode is required";
      } else if (
        !isOnlyDigits(KYCformData.pincode) ||
        KYCformData.pincode.length !== 6
      ) {
        newErrors.pincode = "Pincode must be exactly 6 digits";
      }

      if (!KYCformData.country_id?.value) {
        newErrors.country_id = "Country is required";
      }

      if (!KYCformData.state_id?.value) {
        newErrors.state_id = "State is required";
      }

      if (!KYCformData.city_id?.value) {
        newErrors.city_id = "City is required";
      }
    }

    // ---------------- STEP 1 ----------------
    if (currentStep === 1) {
      if (isEmpty(KYCformData.pancard_number)) {
        newErrors.pancard_number = "PAN card number is required";
      } else if (KYCformData.pancard_number.length !== 10) {
        newErrors.pancard_number = "PAN card number must be 10 characters";
      }

      if (isEmpty(KYCformData.aadharcard_number)) {
        newErrors.aadharcard_number = "Aadhar card number is required";
      } else if (
        !isOnlyDigits(KYCformData.aadharcard_number) ||
        KYCformData.aadharcard_number.length !== 12
      ) {
        newErrors.aadharcard_number = "Aadhar card number must be 12 digits";
      }

      if (isEmpty(KYCformData.business_name)) {
        newErrors.business_name = "Business name is required";
      }

      if (isEmpty(KYCformData.gst_number)) {
        newErrors.gst_number = "GST number is required";
      } else if (KYCformData.gst_number.length !== 15) {
        newErrors.gst_number = "GST number must be 15 characters";
      }
    }
    // ---------------- STEP 2 ----------------
    if (currentStep === 2) {
      // ---------------- Account Holder Name ----------------
      if (isEmpty(KYCformData.account_holder_name)) {
        newErrors.account_holder_name = "Account holder name is required";
      } else if (hasNumber(KYCformData.account_holder_name)) {
        newErrors.account_holder_name =
          "Account holder name should not contain numbers";
      } else if (KYCformData.account_holder_name.length < 3) {
        newErrors.account_holder_name =
          "Account holder name must be at least 3 characters";
      }

      // ---------------- Account Number ----------------
      if (isEmpty(KYCformData.account_number)) {
        newErrors.account_number = "Account number is required";
      } else if (!isOnlyDigits(KYCformData.account_number)) {
        newErrors.account_number = "Account number must contain digits only";
      } else if (
        KYCformData.account_number.length < 9 ||
        KYCformData.account_number.length > 18
      ) {
        newErrors.account_number =
          "Account number must be between 9 and 18 digits";
      }

      // ---------------- Confirm Account Number ----------------
      if (isEmpty(KYCformData.confirm_account_number)) {
        newErrors.confirm_account_number = "Please confirm account number";
      } else if (
        !newErrors.account_number && // only compare if main account number is valid
        KYCformData.account_number !== KYCformData.confirm_account_number
      ) {
        newErrors.confirm_account_number = "Account numbers do not match";
      }

      // ---------------- IFSC Code ----------------
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

      if (isEmpty(KYCformData.ifsc_code)) {
        newErrors.ifsc_code = "IFSC code is required";
      } else if (!ifscRegex.test(KYCformData.ifsc_code.toUpperCase())) {
        newErrors.ifsc_code = "Enter a valid IFSC code";
      }

      // ---------------- Account Type ----------------
      if (isEmpty(KYCformData.account_type)) {
        newErrors.account_type = "Account type is required";
      }
    }

    // ---------------- STEP 3 ----------------
    if (currentStep === 3) {
      const isFileValid = (file: File | null) =>
        file instanceof File;



      // PAN Card
      if (!isFileValid(KYCformData.pancard_front_image)) {
        newErrors.pancard_front_image = "PAN card image is required";
      }

      // Aadhaar Front
      if (!isFileValid(KYCformData.aadharcard_front_image)) {
        newErrors.aadharcard_front_image = "Aadhaar front image is required";
      }

      // Aadhaar Back
      if (!isFileValid(KYCformData.aadharcard_back_image)) {
        newErrors.aadharcard_back_image = "Aadhaar back image is required";
      }

      // GST Certificate (required only if GST number exists)
      if (
        KYCformData.gst_number &&
        !isFileValid(KYCformData.gst_certificate_image)
      ) {
        newErrors.gst_certificate_image =
          "GST certificate is required when GST number is provided";
      }
    }
    // ---------------- STEP 3 ----------------
    if (currentStep === 4) {
      if (KYCformData.terms_conditions !== 1) {
        newErrors.terms_conditions = 'Please accept the declaration to continue';

      }

    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;

  };

  /* <!-- ========================================================== FormSubmit ========================================================== --> */

  const submitFormdata = async () => {
    const formData = new FormData();
    formData.append("full_name", KYCformData.full_name);
    formData.append("email", KYCformData.email);
    formData.append("mobile", KYCformData.mobile);
    formData.append("address", KYCformData.address);
    formData.append("pincode", KYCformData.pincode);
    formData.append("country_id", KYCformData.country_id?.value);
    formData.append("state_id", KYCformData.state_id.value);
    formData.append("city_id", KYCformData.city_id?.value);
    formData.append("pancard_number", KYCformData.pancard_number);
    formData.append("aadharcard_number", KYCformData.aadharcard_number);
    formData.append("business_name", KYCformData.business_name);
    formData.append("gst_number", KYCformData.gst_number);
    formData.append("account_holder_name", KYCformData.account_holder_name);
    formData.append("account_number", KYCformData.account_number);
    formData.append("confirm_account_number", KYCformData.confirm_account_number);
    formData.append("ifsc_code", KYCformData.ifsc_code);
    formData.append("account_type", KYCformData.account_type);
    if (KYCformData.pancard_front_image) {
      formData.append("pancard_front_image", KYCformData.pancard_front_image)
    }
    if (KYCformData.aadharcard_front_image) {
      formData.append("aadharcard_front_image", KYCformData.aadharcard_front_image)
    }
    if (KYCformData.aadharcard_back_image) {
      formData.append("aadharcard_back_image", KYCformData.aadharcard_back_image)
    } if (KYCformData.gst_certificate_image) {
      formData.append("gst_certificate_image", KYCformData.gst_certificate_image)
    }

    formData.append("terms_conditions", String(KYCformData.terms_conditions));

    try {
      const response = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, formData)

    } catch (error) {
      console.error("Failed submit Form", error)
    }
  }


  /* <!-- ====================================================================== UI ====================================================================== --> */

  return (
    <ComponentCard title="KYC Verification">

      {/*  <!-- =============================================  Stepper scroll on mobile ============================================= -->*/}
      <div className="overflow-x-auto">
        <div className="min-w-max md:min-w-0">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      {/* <!-- =============================================  Form Body ============================================= -->*/}

      <div>
        {currentStep === 0 && <ContactDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 1 && <Identity setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 2 && <BankDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 3 && <Documents setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 4 && <StepDeclaration setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
      </div>

      {/* <!-- =============================================  Sticky Footer ============================================= -->*/}

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
        {/* <!-- =============================================  Buttons ============================================= -->*/}


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

            const isValid = FormDataValidation()

            if (isValid && currentStep < steps.length - 1) {
              setCurrentStep((s) => s + 1)            
            }
              if (currentStep === 4) {
                submitFormdata()
              }
            if (!isValid) return;
          }}

          className="px-8 py-2 w-full md:w-auto
        rounded-lg bg-blue-600 text-white
              hover:bg-blue-700 transition font-medium">

          {currentStep === steps.length - 1 && KYCformData.terms_conditions === 1 ? "Submit KYC" : "Next"}
        </button>
      </div>

    </ComponentCard >
  );
}
