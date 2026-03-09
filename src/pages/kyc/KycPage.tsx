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
  no_gst?: boolean;
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
  completed_pages: string[];
};

export type ErrorType = {
  [key: string]: string;
};

export default function KYCPage() {
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
    no_gst: false,
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
    completed_pages: [],
  });
console.log("KYCPage Rendered with KYCformData:", KYCformData);
  const router = useRouter();

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      const vendor = JSON.parse(userInfo);
      setKYCFormData(prev => ({
        ...prev,
        full_name: vendor.full_name || '',
        email: vendor.email || '',
        mobile: vendor.number || '',
        business_name: vendor.business_name || '',
      }));
    }
    fetchKYCFormdata();
  }, []);

  const clearError = (field: string| number) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // ────────────────────────────────────────────────
  //                  VALIDATION
  // ────────────────────────────────────────────────
  const validateCurrentStep = () => {
    const newErrors: ErrorType = {};

    const isEmpty = (val: string | undefined | null) => !val || !val.trim();
    const isOnlyLetters = (val: string) => /^[a-zA-Z\s]+$/.test(val);
    const isOnlyDigits = (val: string) => /^\d+$/.test(val);
    const isEmailValid = (val: string) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(com|in)$/i.test(val);
    const isMobileValid = (val: string) => /^[6-9]\d{9}$/.test(val);
    const isPANValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
    const isAadhaarValid = (val: string) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(val);
    const isGSTValid = (val: string) =>
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val);
    const isIFSCValid = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);

    // Step 0 ─ Contact Details
    if (currentStep === 0) {
      if (isEmpty(KYCformData.full_name)) {
        newErrors.full_name = "Full name is required";
      } else if (!isOnlyLetters(KYCformData.full_name)) {
        newErrors.full_name = "Name should contain only letters and spaces";
      }

      if (isEmpty(KYCformData.email)) {
        newErrors.email = "Email is required";
      } else if (!isEmailValid(KYCformData.email)) {
        newErrors.email = "Please enter a valid email (ending with .com or .in)";
      }

      if (isEmpty(KYCformData.mobile)) {
        newErrors.mobile = "Mobile number is required";
      } else if (!isMobileValid(KYCformData.mobile)) {
        newErrors.mobile = "Enter valid 10-digit Indian mobile number";
      }

      if (isEmpty(KYCformData.address)) {
        newErrors.address = "Address is required";
      } else if (KYCformData.address.trim().length < 10) {
        newErrors.address = "Address must be at least 10 characters";
      }

      if (isEmpty(KYCformData.pincode)) {
        newErrors.pincode = "Pincode is required";
      } else if (!isOnlyDigits(KYCformData.pincode) || KYCformData.pincode.length !== 6) {
        newErrors.pincode = "Pincode must be exactly 6 digits";
      }

      if (!KYCformData.country_id?.value) newErrors.country_id = "Country is required";
      if (!KYCformData.state_id?.value) newErrors.state_id = "State is required";
      if (!KYCformData.city_id?.value) newErrors.city_id = "City is required";
    }

    // Step 1 ─ Identity
    else if (currentStep === 1) {
      if (isEmpty(KYCformData.pancard_number)) {
        newErrors.pancard_number = "PAN number is required";
      } else if (!isPANValid(KYCformData.pancard_number)) {
        newErrors.pancard_number = "Invalid PAN format (e.g. ABCDE1234F)";
      }

      if (isEmpty(KYCformData.aadharcard_number)) {
        newErrors.aadharcard_number = "Aadhaar number is required";
      } else if (!isAadhaarValid(KYCformData.aadharcard_number)) {
        newErrors.aadharcard_number = "Invalid Aadhaar format (12 digits with optional spaces)";
      }

      if (isEmpty(KYCformData.business_name)) {
        newErrors.business_name = "Business name is required";
      } else if (KYCformData.business_name.trim().length < 3) {
        newErrors.business_name = "Business name too short (min 3 chars)";
      }

      if (!KYCformData.no_gst) {
        if (isEmpty(KYCformData.gst_number)) {
          newErrors.gst_number = "GST number is required";
        } else if (!isGSTValid(KYCformData.gst_number)) {
          newErrors.gst_number = "Invalid GSTIN format (15 characters)";
        }
      }
    }

    // Step 2 ─ Bank
    else if (currentStep === 2) {
      if (isEmpty(KYCformData.account_holder_name)) {
        newErrors.account_holder_name = "Account holder name is required";
      } else if (!isOnlyLetters(KYCformData.account_holder_name)) {
        newErrors.account_holder_name = "Only letters and spaces allowed";
      }

      if (isEmpty(KYCformData.account_number)) {
        newErrors.account_number = "Account number is required";
      } else if (!isOnlyDigits(KYCformData.account_number)) {
        newErrors.account_number = "Only digits allowed";
      } else if (
        KYCformData.account_number.length < 9 ||
        KYCformData.account_number.length > 18
      ) {
        newErrors.account_number = "Account number must be 9–18 digits";
      }

      if (isEmpty(KYCformData.confirm_account_number)) {
        newErrors.confirm_account_number = "Please confirm account number";
      } else if (KYCformData.account_number !== KYCformData.confirm_account_number) {
        newErrors.confirm_account_number = "Account numbers do not match";
      }

      if (isEmpty(KYCformData.ifsc_code)) {
        newErrors.ifsc_code = "IFSC code is required";
      } else if (!isIFSCValid(KYCformData.ifsc_code)) {
        newErrors.ifsc_code = "Invalid IFSC format (e.g. SBIN0123456)";
      }

      if (isEmpty(KYCformData.account_type)) {
        newErrors.account_type = "Please select account type";
      }
    }

    // Step 3 ─ Documents
    else if (currentStep === 3) {
      const isValidFile = (file: File | string | null) =>
        file instanceof File || (typeof file === "string" && file.trim().length > 0);

      if (!isValidFile(KYCformData.pancard_front_image)) {
        newErrors.pancard_front_image = "PAN front image is required";
      }
      if (!isValidFile(KYCformData.aadharcard_front_image)) {
        newErrors.aadharcard_front_image = "Aadhaar front image is required";
      }
      if (!isValidFile(KYCformData.aadharcard_back_image)) {
        newErrors.aadharcard_back_image = "Aadhaar back image is required";
      }

      if (!KYCformData.gst_certificate_image) {
        if (!isValidFile(KYCformData.gst_certificate_image)) {
          newErrors.gst_certificate_image = "GST certificate is required";
        }
      }

      if (!isValidFile(KYCformData.vendor_image)) {
        newErrors.vendor_image = "Vendor photograph is required";
      }
    }

    // Step 4 ─ Declaration
    else if (currentStep === 4) {
      if (KYCformData.terms_conditions !== 1) {
        newErrors.terms_conditions = "Please accept the declaration";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitKYCFormdata = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("page", String(currentStep + 1));
      formData.append("mobile", KYCformData.mobile);
      formData.append("email", KYCformData.email);

      if (currentStep === 0) {
        const contact = {
          full_name: KYCformData.full_name,
          email: KYCformData.email,
          mobile: KYCformData.mobile,
          address: KYCformData.address,
          pincode: KYCformData.pincode,
          country_id: KYCformData.country_id.value,
          country_name: KYCformData.country_id.label,
          state_id: KYCformData.state_id.value,
          state_name: KYCformData.state_id.label,
          city_id: KYCformData.city_id.value,
          city_name: KYCformData.city_id.label,
          page: "1"
        };
        formData.append("ContactDetails", JSON.stringify([contact]));
      } else if (currentStep === 1) {
        const identity = {
          pancard_number: KYCformData.pancard_number,
          aadharcard_number: KYCformData.aadharcard_number,
          business_name: KYCformData.business_name,
          gst_number: KYCformData.gst_number,
          page: "2"
        };
        formData.append("Identity", JSON.stringify([identity]));
      } else if (currentStep === 2) {
        const bank = {
          account_holder_name: KYCformData.account_holder_name,
          account_number: KYCformData.account_number,
          confirm_account_number: KYCformData.confirm_account_number,
          ifsc_code: KYCformData.ifsc_code,
          account_type: KYCformData.account_type,
          page: "3"
        };
        formData.append("Bank", JSON.stringify([bank]));
      } else if (currentStep === 3) {
        // Files
        if (KYCformData.pancard_front_image instanceof File)
          formData.append("pancard_front_image", KYCformData.pancard_front_image);
        if (KYCformData.aadharcard_front_image instanceof File)
          formData.append("aadharcard_front_image", KYCformData.aadharcard_front_image);
        if (KYCformData.aadharcard_back_image instanceof File)
          formData.append("aadharcard_back_image", KYCformData.aadharcard_back_image);
        if (KYCformData.gst_certificate_image instanceof File)
          formData.append("gst_certificate_image", KYCformData.gst_certificate_image);
        if (KYCformData.vendor_image instanceof File)
          formData.append("vendor_image", KYCformData.vendor_image);
        if (KYCformData.business_logo_image instanceof File)
          formData.append("business_logo_image", KYCformData.business_logo_image);

        formData.append("Documents", JSON.stringify([{ page: "4" }]));
      } else if (currentStep === 4) {
        formData.append("terms_conditions", "1");
      }

      const res = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === 200) {
        await fetchKYCFormdata();
        toast.success(res.data.message || "Saved successfully");

        if (currentStep < steps.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          toast.success("KYC Submitted Successfully!");
          setTimeout(() => router.push("/"), 1800);
        }
      } else {
        toast.error(res.data.message || "Server error");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (validateCurrentStep()) {
      await submitKYCFormdata();
    }
  };

  const handleStepChange = (i: number) => {
    if (i === currentStep) return;
    const completed = (KYCformData.completed_pages || [])
      .map((p) => parseInt(String(p), 10))
      .filter((n) => !isNaN(n));
    const highestCompleted = completed.length ? Math.max(...completed) : 0; // 1-based
    const allowedIndex = Math.min(highestCompleted, steps.length - 1); // allow next incomplete step
    if (i > allowedIndex) {
      validateCurrentStep();
      return;
    }
    if (i > currentStep) {
      const ok = validateCurrentStep();
      if (!ok) {
        toast.error('Please complete required fields');
        return;
      }
    }
    setCurrentStep(i);
  };

  // ────────────────────────────────────────────────
  //                  FETCH EXISTING DATA
  // ────────────────────────────────────────────────
  const fetchKYCFormdata = async () => {
    try {
      const res = await api.get(`${endPointApi.postFetchVendorKYCFormData}`);
      if (res.status === 200 && res.data?.data) {
        const data = res.data.data;
        const contact = (data.ContactDetails && data.ContactDetails[0]) || data.ContactDetails || {};
        const identity = (data.Identity && data.Identity[0]) || data.Identity || {};
        const bank = (data.Bank && data.Bank[0]) || data.Bank || {};
        const docs = (data.Documents && data.Documents[0]) || data.Documents || {};

        setKYCFormData((prev) => ({
          ...prev,
          full_name: contact.full_name || prev.full_name,
          email: contact.email || prev.email,
          mobile: contact.mobile || prev.mobile,
          address: contact.address || prev.address,
          pincode: contact.pincode || prev.pincode,
          country_id: { value: contact.country_id || "", label: contact.country_name || "" },
          state_id: { value: contact.state_id || "", label: contact.state_name || "" },
          city_id: { value: contact.city_id || "", label: contact.city_name || "" },
          pancard_number: identity.pancard_number || prev.pancard_number,
          aadharcard_number: identity.aadharcard_number || prev.aadharcard_number,
          business_name: identity.business_name || prev.business_name,
          gst_number: identity.gst_number || prev.gst_number,
          no_gst: Object.keys(identity).length > 0 && !identity.gst_number ? true : false,
          account_holder_name: bank.account_holder_name || prev.account_holder_name,
          account_number: bank.account_number || prev.account_number,
          confirm_account_number: bank.account_number || prev.confirm_account_number,
          ifsc_code: bank.ifsc_code || prev.ifsc_code,
          account_type: bank.account_type || prev.account_type,
          pancard_front_image: docs.pancard_front_image || null,
          aadharcard_front_image: docs.aadharcard_front_image || null,
          aadharcard_back_image: docs.aadharcard_back_image || null,
          gst_certificate_image: docs.gst_certificate_image || null,
          vendor_image: docs.vendor_image || null,
          business_logo_image: docs.business_logo_image || null,

          completed_pages: data.completed_pages || [],
          terms_conditions: data.terms_conditions || 0,
        }));
      }
    } catch (err) {
      console.error("Fetch KYC error:", err);
    }
  };

  return (
    <ComponentCard title="KYC Verification">
      <Stepper steps={steps} currentStep={currentStep} completedPages={KYCformData.completed_pages} onStepChange={handleStepChange} />

      <div className="min-h-[400px] md:min-h-[520px]">
        {currentStep === 0 && (
          <ContactDetails
            setKYCFormData={setKYCFormData}
            KYCformData={KYCformData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 1 && (
          <Identity
            setKYCFormData={setKYCFormData}
            KYCformData={KYCformData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 2 && (
          <BankDetails
            setKYCFormData={setKYCFormData}
            KYCformData={KYCformData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 3 && (
          <Documents
            setKYCFormData={setKYCFormData}
            KYCformData={KYCformData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 4 && (
          <StepDeclaration
            setKYCFormData={setKYCFormData}
            KYCformData={KYCformData}
            errors={errors}
            clearError={clearError}
          />
        )}
      </div>

      <div className={`flex ${currentStep === 0 ? 'justify-end' : 'justify-between'} mt-6 pt-4 border-t`}>
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Back
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="btn-primary min-w-[120px]"
        >
          {isSubmitting
            ? "Saving..."
            : currentStep === steps.length - 1
            ? "Submit KYC"
            : "Save & Next"}
        </button>
      </div>
    </ComponentCard>
  );
}