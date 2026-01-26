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
   
 full_name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    country_id: { value: "", label: "" },
    state_id: { value: "", label: "" },
    city_id: { value: "", label: "" },
    pancard_number: "",
    aadharcard_number: "",
    business_name: "",
    gst_number: "",
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: "",
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
  const isOnlyLetters = (val: string) => /^[a-zA-Z\s]*$/.test(val);
  const isPANValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
  const isAadhaarValid = (val: string) => /^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/.test(val);
  const isGSTValid = (val: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val);
  const isIFSCValid = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);
  const isMobileValid = (val: string) => /^[6-9][0-9]{9}$/.test(val);

  // ---------------- STEP 0 ----------------
  if (currentStep === 0) {
    if (isEmpty(KYCformData.full_name)) {
      newErrors.full_name = "Name is required";
    } else if (!isOnlyLetters(KYCformData.full_name)) {
      newErrors.full_name = "Name should contain only letters and spaces";
    } else if (KYCformData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }

    if (isEmpty(KYCformData.email)) {
      newErrors.email = "Email is required";
    } else if (!isEmailValid(KYCformData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (isEmpty(KYCformData.mobile)) {
      newErrors.mobile = "Mobile number is required";
    } else if (!isMobileValid(KYCformData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits starting with 6-9";
    }

    if (isEmpty(KYCformData.address)) {
      newErrors.address = "Address is required";
    } else if (KYCformData.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters";
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
    } else if (!isPANValid(KYCformData.pancard_number)) {
      newErrors.pancard_number = "Enter a valid PAN card number (e.g., ABCDE1234F)";
    }

    if (isEmpty(KYCformData.aadharcard_number)) {
      newErrors.aadharcard_number = "Aadhar card number is required";
    } else if (!isAadhaarValid(KYCformData.aadharcard_number)) {
      newErrors.aadharcard_number = "Enter a valid Aadhar number (e.g., 2234 5678 9012)";
    }

    if (isEmpty(KYCformData.business_name)) {
      newErrors.business_name = "Business name is required";
    } else if (KYCformData.business_name.trim().length < 3) {
      newErrors.business_name = "Business name must be at least 3 characters";
    }

    if (isEmpty(KYCformData.gst_number)) {
      newErrors.gst_number = "GST number is required";
    } else if (!isGSTValid(KYCformData.gst_number)) {
      newErrors.gst_number = "Enter a valid GST number (15 characters)";
    }
  }

  // ---------------- STEP 2 ----------------
  if (currentStep === 2) {
    // ---------------- Account Holder Name ----------------
    if (isEmpty(KYCformData.account_holder_name)) {
      newErrors.account_holder_name = "Account holder name is required";
    } else if (!isOnlyLetters(KYCformData.account_holder_name)) {
      newErrors.account_holder_name = "Account holder name should contain only letters and spaces";
    } else if (KYCformData.account_holder_name.trim().length < 3) {
      newErrors.account_holder_name = "Account holder name must be at least 3 characters";
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
      newErrors.account_number = "Account number must be between 9 and 18 digits";
    }

    // ---------------- Confirm Account Number ----------------
    if (isEmpty(KYCformData.confirm_account_number)) {
      newErrors.confirm_account_number = "Please confirm account number";
    } else if (!isOnlyDigits(KYCformData.confirm_account_number)) {
      newErrors.confirm_account_number = "Account number must contain digits only";
    } else if (
      !newErrors.account_number &&
      KYCformData.account_number !== KYCformData.confirm_account_number
    ) {
      newErrors.confirm_account_number = "Account numbers do not match";
    }

    // ---------------- IFSC Code ----------------
    if (isEmpty(KYCformData.ifsc_code)) {
      newErrors.ifsc_code = "IFSC code is required";
    } else if (!isIFSCValid(KYCformData.ifsc_code)) {
      newErrors.ifsc_code = "Enter a valid IFSC code (e.g., SBIN0125620)";
    }

    // ---------------- Account Type ----------------
    if (isEmpty(KYCformData.account_type)) {
      newErrors.account_type = "Account type is required";
    }
  }

  // ---------------- STEP 3 ----------------
  if (currentStep === 3) {
    const isFileValid = (file: File | null) => 
      file instanceof File && file.type.startsWith("image/");

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

    // GST Certificate
    if (!isFileValid(KYCformData.gst_certificate_image)) {
      newErrors.gst_certificate_image = "GST certificate image is required";
    }
  }

  // ---------------- STEP 4 ----------------
  if (currentStep === 4) {
    if (KYCformData.terms_conditions !== 1) {
      newErrors.terms_conditions = "Please accept the declaration to continue";
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
          onClick={async () => {
            const isValid = FormDataValidation();

            if (!isValid) return;

            const isLastStep = currentStep === steps.length - 1;

            if (!isLastStep) {
              setCurrentStep((s) => s + 1);
              return;
            }

            await submitFormdata();
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
