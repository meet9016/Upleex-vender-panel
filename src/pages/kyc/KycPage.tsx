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
import { useRouter } from "next/navigation";

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
  no_gst?: boolean; // Added for GST checkbox
  account_holder_name: string;
  account_number: string;
  confirm_account_number: string;
  ifsc_code: string;
  account_type: string;
  pancard_front_image: File | string | null;
  aadharcard_front_image: File | string | null;
  aadharcard_back_image: File | string | null;
  gst_certificate_image: File | string | null;
  vendor_image: File | string | null;
  business_logo_image: File | string | null;
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
  vendor_image?: string;
  business_logo_image?: string;
  terms_conditions?: string;
};

export default function KYCPage() {
  /* <!-- ========================================================== States ========================================================== --> */

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ErrorType>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    no_gst: false, // Initialize GST checkbox
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: "",
    pancard_front_image: null,
    aadharcard_front_image: null,
    aadharcard_back_image: null,
    gst_certificate_image: null,
    vendor_image: null,
    business_logo_image: null,
    terms_conditions: 0,
  });

  const router = useRouter();

  useEffect(() => {
    fetchKYCFormdata();
  }, []);

  /* <!-- ========================================================== Clear error  ========================================================== --> */

  const clearError = (field: keyof ErrorType) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  /* <!-- ========================================================== validation ========================================================== --> */

  const FormDataValidation = async () => {
    const newErrors: ErrorType = {};

    // helpers
    const isEmpty = (val: string | undefined | null) => !val || !val.trim();
    const hasNumber = (val: string) => /\d/.test(val);
    const isEmailValid = (val: string) =>
      /^(?!\.)(?!.*\.\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(in|com)$/i.test(val);
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
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // ---------------- STEP 1 ----------------
    if (currentStep === 1) {
      // PAN validation
      if (isEmpty(KYCformData.pancard_number)) {
        newErrors.pancard_number = "PAN card number is required";
      } else if (!isPANValid(KYCformData.pancard_number)) {
        newErrors.pancard_number = "Enter a valid PAN card number (e.g., ABCDE1234F)";
      }

      // Aadhaar validation
      if (isEmpty(KYCformData.aadharcard_number)) {
        newErrors.aadharcard_number = "Aadhar card number is required";
      } else if (!isAadhaarValid(KYCformData.aadharcard_number)) {
        newErrors.aadharcard_number = "Enter a valid Aadhar number (e.g., 2234 5678 9012)";
      }

      // Business name validation
      if (isEmpty(KYCformData.business_name)) {
        newErrors.business_name = "Business name is required";
      } else if (KYCformData.business_name.trim().length < 3) {
        newErrors.business_name = "Business name must be at least 3 characters";
      }

      // GST validation - only validate if no_gst is false
      if (!KYCformData.no_gst) {
        if (isEmpty(KYCformData.gst_number)) {
          newErrors.gst_number = "GST number is required";
        } else if (!isGSTValid(KYCformData.gst_number)) {
          newErrors.gst_number = "Enter a valid GST number (15 characters)";
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // ---------------- STEP 2 ----------------
    if (currentStep === 2) {
      if (isEmpty(KYCformData.account_holder_name)) {
        newErrors.account_holder_name = "Account holder name is required";
      } else if (!isOnlyLetters(KYCformData.account_holder_name)) {
        newErrors.account_holder_name = "Account holder name should contain only letters and spaces";
      } else if (KYCformData.account_holder_name.trim().length < 3) {
        newErrors.account_holder_name = "Account holder name must be at least 3 characters";
      }

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

      if (isEmpty(KYCformData.ifsc_code)) {
        newErrors.ifsc_code = "IFSC code is required";
      } else if (!isIFSCValid(KYCformData.ifsc_code)) {
        newErrors.ifsc_code = "Enter a valid IFSC code (e.g., SBIN0125620)";
      }

      if (isEmpty(KYCformData.account_type)) {
        newErrors.account_type = "Account type is required";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // ---------------- STEP 3 ----------------
    if (currentStep === 3) {
      const isFileValid = (file: File | string | null) =>
        file instanceof File || (typeof file === 'string' && file.length > 0);

      if (!isFileValid(KYCformData?.pancard_front_image)) {
        newErrors.pancard_front_image = "PAN card image is required";
      }

      if (!isFileValid(KYCformData?.aadharcard_front_image)) {
        newErrors.aadharcard_front_image = "Aadhaar front image is required";
      }

      if (!isFileValid(KYCformData.aadharcard_back_image)) {
        newErrors.aadharcard_back_image = "Aadhaar back image is required";
      }

      // GST certificate is only required if user has GST
      if (!KYCformData.no_gst) {
        if (!isFileValid(KYCformData.gst_certificate_image)) {
          newErrors.gst_certificate_image = "GST certificate image is required";
        }
      }

      if (!isFileValid(KYCformData.vendor_image)) {
        newErrors.vendor_image = "Vendor image is required";
      }

      if (!isFileValid(KYCformData.business_logo_image)) {
        newErrors.business_logo_image = "Logo is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // ---------------- STEP 4 ----------------
    if (currentStep === 4) {
      if (KYCformData?.terms_conditions !== 1) {
        newErrors.terms_conditions = "Please accept the declaration to continue";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    return true;
  };

  /* <!-- ========================================================== FormSubmit ========================================================== --> */

  const submitKYCFormdata = async () => {
    setIsSubmitting(true);

    try {
      const stepForPage = currentStep === 3 ? currentStep : currentStep === 4 ? currentStep : currentStep + 1;

      if (currentStep === 3) {
        const formData = new FormData();
        formData.append('page', String(stepForPage));
        if (KYCformData.mobile) formData.append('mobile', KYCformData.mobile);
        if (KYCformData.email) formData.append('email', KYCformData.email);
        if (KYCformData?.pancard_front_image instanceof File) formData.append('pancard_front_image', KYCformData.pancard_front_image);
        if (KYCformData?.aadharcard_front_image instanceof File) formData.append('aadharcard_front_image', KYCformData.aadharcard_front_image);
        if (KYCformData?.aadharcard_back_image instanceof File) formData.append('aadharcard_back_image', KYCformData.aadharcard_back_image);
        if (KYCformData?.gst_certificate_image instanceof File) formData.append('gst_certificate_image', KYCformData.gst_certificate_image);
        if (KYCformData?.vendor_image instanceof File) formData.append('vendor_image', KYCformData.vendor_image);
        if (KYCformData?.business_logo_image instanceof File) formData.append('business_logo_image', KYCformData.business_logo_image);

        const res = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.status === 200) {
          await fetchKYCFormdata();
          setCurrentStep((s) => s + 1);
          toast.success(res.data.message);
        } else {
          toast.error(res.data.message);
        }
        return;
      }

      const payload: any = { page: String(stepForPage) };
      if (KYCformData.mobile) payload.mobile = KYCformData.mobile;
      if (KYCformData.email) payload.email = KYCformData.email;

      if (currentStep === 0) {
        if (KYCformData.full_name) payload.full_name = KYCformData.full_name;
        if (KYCformData.email) payload.email = KYCformData.email;
        if (KYCformData.mobile) payload.mobile = KYCformData.mobile;
        if (KYCformData.address) payload.address = KYCformData.address;
        if (KYCformData.pincode) payload.pincode = KYCformData.pincode;

        // Include location IDs and names
        if (KYCformData.country_id?.value) {
          payload.country_id = KYCformData.country_id.value;
          payload.country_name = KYCformData.country_id.label || "";
        }
        if (KYCformData.state_id?.value) {
          payload.state_id = KYCformData.state_id.value;
          payload.state_name = KYCformData.state_id.label || "";
        }
        if (KYCformData.city_id?.value) {
          payload.city_id = KYCformData.city_id.value;
          payload.city_name = KYCformData.city_id.label || "";
        }
      } else if (currentStep === 1) {
        if (KYCformData.pancard_number) payload.pancard_number = KYCformData.pancard_number;
        if (KYCformData.aadharcard_number) payload.aadharcard_number = KYCformData.aadharcard_number;
        if (KYCformData.business_name) payload.business_name = KYCformData.business_name;
        // Only send GST number if user has GST
        if (!KYCformData.no_gst && KYCformData.gst_number) {
          payload.gst_number = KYCformData.gst_number;
        }
      } else if (currentStep === 2) {
        if (KYCformData.account_holder_name) payload.account_holder_name = KYCformData.account_holder_name;
        if (KYCformData.account_number) payload.account_number = KYCformData.account_number;
        if (KYCformData.confirm_account_number) payload.confirm_account_number = KYCformData.confirm_account_number;
        if (KYCformData.ifsc_code) payload.ifsc_code = KYCformData.ifsc_code;
        if (KYCformData.account_type) payload.account_type = KYCformData.account_type;
      } else if (currentStep === 4) {
        payload.terms_conditions = String(KYCformData?.terms_conditions ?? 0);
        if (KYCformData.full_name) payload.full_name = KYCformData.full_name;
        if (KYCformData.address) payload.address = KYCformData.address;
        if (KYCformData.pincode) payload.pincode = KYCformData.pincode;
        if (KYCformData.country_id?.value) {
          payload.country_id = KYCformData.country_id.value;
          payload.country_name = KYCformData.country_id.label || "";
        }
        if (KYCformData.state_id?.value) {
          payload.state_id = KYCformData.state_id.value;
          payload.state_name = KYCformData.state_id.label || "";
        }
        if (KYCformData.city_id?.value) {
          payload.city_id = KYCformData.city_id.value;
          payload.city_name = KYCformData.city_id.label || "";
        }
        if (KYCformData.pancard_number) payload.pancard_number = KYCformData.pancard_number;
        if (KYCformData.aadharcard_number) payload.aadharcard_number = KYCformData.aadharcard_number;
        if (KYCformData.business_name) payload.business_name = KYCformData.business_name;
        if (KYCformData.gst_number) payload.gst_number = KYCformData.gst_number;
        if (KYCformData.account_holder_name) payload.account_holder_name = KYCformData.account_holder_name;
        if (KYCformData.account_number) payload.account_number = KYCformData.account_number;
        if (KYCformData.ifsc_code) payload.ifsc_code = KYCformData.ifsc_code;
        if (KYCformData.account_type) payload.account_type = KYCformData.account_type;
      }

      const res = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, payload);

      if (res.data.status === 200) {
        await fetchKYCFormdata();
        const isLastStep = currentStep === steps.length - 1;
        if (!isLastStep) {
          setCurrentStep((s) => s + 1);
          toast.success(res.data.message);
        } else {
          toast.success(res.data.message);
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Failed to submit form", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* <!-- ===================================================== Fetch submitted data ===================================================== --> */

  const fetchKYCFormdata = async () => {
    try {
      const qs = KYCformData?.mobile ? `?mobile=${encodeURIComponent(KYCformData.mobile)}` : (KYCformData?.email ? `?email=${encodeURIComponent(KYCformData.email)}` : '');
      const res = await api.get(`${endPointApi.postFetchVendorKYCFormData}${qs}`);

      if (res.status === 200 && res.data.data) {
        const data = res.data.data;
        
        setKYCFormData((prev) => ({
          ...prev,
          ...data,
          confirm_account_number: data.account_number || "",
          no_gst: !data.gst_number, // Set no_gst based on whether GST number exists
          country_id: { 
            value: data.country_id || "", 
            label: data.country_name || "" 
          },
          state_id: { 
            value: data.state_id || "", 
            label: data.state_name || "" 
          },
          city_id: { 
            value: data.city_id || "", 
            label: data.city_name || "" 
          },
        }));
      }
    } catch (error) {
      console.error("Failed to fetch form data", error);
      toast.error("Failed to load existing data");
    }
  };

  /* <!-- ====================================================================== UI ====================================================================== --> */

  const handleNext = async () => {
    const isValid = await FormDataValidation();
    if (isValid) {
      await submitKYCFormdata();
    } else {
      toast.error("Please fill all required fields correctly.");
    }
  };

  return (
    <ComponentCard title="KYC Verification">
      {/* Stepper scroll on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-max md:min-w-0">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Form Body with Fixed Height */}
      <div className="min-h-96 md:min-h-[500px] overflow-y-auto">
        {currentStep === 0 && <ContactDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 1 && <Identity setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 2 && <BankDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 3 && <Documents setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 4 && <StepDeclaration setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white py-3 md:py-4 px-4 md:px-6 flex gap-3 items-center justify-between border-t z-50 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Back Button */}
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Back
          </button>
        ) : <div />}

        {/* Next / Submit Button */}
        <button
          onClick={handleNext}
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? "Submitting..." 
            : currentStep === steps.length - 1 && KYCformData?.terms_conditions === 1 
              ? "Submit KYC" 
              : "Next"
          }
        </button>
      </div>
    </ComponentCard>
  );
}