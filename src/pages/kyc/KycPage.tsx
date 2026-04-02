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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useFilter } from "@/context/FilterContext";

const ALL_STEPS = [
  "Contact Details",
  "Identity",
  "Bank",
  "Documents",
  "Declaration",
];

// Indices of the ALL_STEPS array that are shown in service-only mode
const SERVICE_STEP_INDICES = [0, 1, 3, 4]; // Contact Details, Identity, Documents, Declaration
const SERVICE_STEPS = SERVICE_STEP_INDICES.map((i) => ALL_STEPS[i]);

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
  qr_code_image: File | string | null;
  cheque_image: File | string | null;
  terms_conditions: boolean;
  completed_pages: string[];
};

export type ErrorType = {
  [key: string]: string;
};

export default function KYCPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize currentStep from URL search params if present
  const [currentStep, setCurrentStep] = useState(() => {
    const step = searchParams ? searchParams.get("step") : null;
    return step ? parseInt(step, 10) : 0;
  });

  const [errors, setErrors] = useState<ErrorType>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { filters, setFilters, canFilter, setCanFilter } = useFilter();

  // Mode is locked once canFilter is false (edit mode)
  // If canFilter is true, we use the dropdown selection.
  // If canFilter is false, we stay with whatever was selected.
  const isServiceOnly = filters.service && !filters.vendor;

  // Active steps: either full 5 steps or 2 service-only steps
  const steps = isServiceOnly ? SERVICE_STEPS : ALL_STEPS;

  // Map current visible step → actual step index in ALL_STEPS
  const actualStep = isServiceOnly ? SERVICE_STEP_INDICES[currentStep] : currentStep;

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
    qr_code_image: null,
    cheque_image: null,
    terms_conditions: false,
    completed_pages: [],
  });
  console.log("KYCPage Rendered with KYCformData:", KYCformData);

  // Sync currentStep to URL
  useEffect(() => {
    if (searchParams && pathname) {
      const currentUrlStep = searchParams.get("step");
      if (currentUrlStep !== currentStep.toString()) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", currentStep.toString());
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [currentStep, pathname, router, searchParams]);

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

  // Add Enter key functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Enter key is pressed and not in a textarea or contenteditable
      if (event.key === 'Enter' && 
          !event.shiftKey && 
          !event.ctrlKey && 
          !event.altKey &&
          !isSubmitting) {
        
        const target = event.target as HTMLElement;
        
        // Don't trigger if user is typing in textarea or contenteditable
        if (target.tagName === 'TEXTAREA' || 
            target.contentEditable === 'true' ||
            target.closest('.ql-editor')) { // Quill editor check
          return;
        }
        
        // Don't trigger if user is in a dropdown or modal
        if (target.closest('[role="listbox"]') ||
            target.closest('[role="dialog"]') ||
            target.closest('.dropdown-menu') ||
            target.closest('.searchable-dropdown')) {
          return;
        }
        
        event.preventDefault();
        
        // Show quick feedback
        const button = document.querySelector('.btn-primary') as HTMLButtonElement;
        if (button) {
          button.style.transform = 'scale(0.95)';
          setTimeout(() => {
            button.style.transform = 'scale(1)';
          }, 150);
        }
        
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, currentStep, KYCformData]); // Add dependencies

  // Show modal logic moved to AppHeader in the form of an overlay tooltip

  const clearError = (field: string | number) => {
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
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(com|in|org)$/i.test(val);
    const isMobileValid = (val: string) => /^[6-9]\d{9}$/.test(val);
    const isPANValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
    const isAadhaarValid = (val: string) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(val);
    const isGSTValid = (val: string) =>
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val);
    const isIFSCValid = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);

    // Use actualStep for validation to support both modes
    // Step 0 ─ Contact Details (actualStep 0)
    if (actualStep === 0) {
      if (isEmpty(KYCformData.full_name)) {
        newErrors.full_name = "Full name is required";
      } else if (!isOnlyLetters(KYCformData.full_name)) {
        newErrors.full_name = "Name should contain only letters and spaces";
      }

      if (isEmpty(KYCformData.email)) {
        newErrors.email = "Email is required";
      } else if (!isEmailValid(KYCformData.email)) {
        newErrors.email = "Please enter a valid email (ending with .com or .in or .org)";
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

    // Step 1 ─ Identity (actualStep 1)
    else if (actualStep === 1) {
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

    // Step 2 ─ Bank (actualStep 2) — only in vendor/both mode
    else if (actualStep === 2) {
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

    // Step 3 ─ Documents (actualStep 3)
    else if (actualStep === 3) {
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

      // GST Certificate is required if GST number was provided
      if (!KYCformData.no_gst && KYCformData.gst_number?.trim()) {
        if (!isValidFile(KYCformData.gst_certificate_image)) {
          newErrors.gst_certificate_image = "GST Certificate is required when GST number is provided";
        }
      }

      if (!isServiceOnly) {
        if (!isValidFile(KYCformData.qr_code_image)) {
          newErrors.qr_code_image = "QR code image is required";
        }
        
        if (!isValidFile(KYCformData.cheque_image)) {
          newErrors.cheque_image = "Cheque image is required";
        }
      }
    }

    // Step 4 ─ Declaration
    else if (currentStep === 4) {
      if (!KYCformData.terms_conditions) {
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
      formData.append("page", String(actualStep + 1));
      formData.append("mobile", KYCformData.mobile);
      formData.append("email", KYCformData.email);

      // Add vendor type and terms_conditions globally
      let type = "both";
      if (filters.service && !filters.vendor) type = "service";
      else if (!filters.service && filters.vendor) type = "vendor";
      formData.append("vendor_type", type);
      formData.append("terms_conditions", String(KYCformData.terms_conditions));

      if (actualStep === 0) {
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
      } else if (actualStep === 1) {
        const identity = {
          pancard_number: KYCformData.pancard_number,
          aadharcard_number: KYCformData.aadharcard_number,
          business_name: KYCformData.business_name,
          gst_number: KYCformData.gst_number,
          page: "2"
        };
        formData.append("Identity", JSON.stringify([identity]));
      } else if (actualStep === 2) {
        const bank = {
          account_holder_name: KYCformData.account_holder_name,
          account_number: KYCformData.account_number,
          confirm_account_number: KYCformData.confirm_account_number,
          ifsc_code: KYCformData.ifsc_code,
          account_type: KYCformData.account_type,
          page: "3"
        };
        formData.append("Bank", JSON.stringify([bank]));
      } else if (actualStep === 3) {
        // Files - Handle both new files and deletions
        if (KYCformData.pancard_front_image instanceof File) {
          formData.append("pancard_front_image", KYCformData.pancard_front_image);
        } else if (KYCformData.pancard_front_image === null) {
          formData.append("pancard_front_image", ""); // Empty string to indicate deletion
        }
        
        if (KYCformData.aadharcard_front_image instanceof File) {
          formData.append("aadharcard_front_image", KYCformData.aadharcard_front_image);
        } else if (KYCformData.aadharcard_front_image === null) {
          formData.append("aadharcard_front_image", "");
        }
        
        if (KYCformData.aadharcard_back_image instanceof File) {
          formData.append("aadharcard_back_image", KYCformData.aadharcard_back_image);
        } else if (KYCformData.aadharcard_back_image === null) {
          formData.append("aadharcard_back_image", "");
        }

        if (KYCformData.gst_certificate_image instanceof File) {
          formData.append("gst_certificate_image", KYCformData.gst_certificate_image);
        } else if (KYCformData.gst_certificate_image === null) {
          formData.append("gst_certificate_image", "");
        }
        
        if (KYCformData.vendor_image instanceof File) {
          formData.append("vendor_image", KYCformData.vendor_image);
        } else if (KYCformData.vendor_image === null) {
          formData.append("vendor_image", "");
        }
        
        if (KYCformData.business_logo_image instanceof File) {
          formData.append("business_logo_image", KYCformData.business_logo_image);
        } else if (KYCformData.business_logo_image === null) {
          formData.append("business_logo_image", "");
        }

        if (!isServiceOnly) {
          if (KYCformData.qr_code_image instanceof File) {
            formData.append("qr_code_image", KYCformData.qr_code_image);
          } else if (KYCformData.qr_code_image === null) {
            formData.append("qr_code_image", "");
          }
          
          if (KYCformData.cheque_image instanceof File) {
            formData.append("cheque_image", KYCformData.cheque_image);
          } else if (KYCformData.cheque_image === null) {
            formData.append("cheque_image", "");
          }
        }

        formData.append("Documents", JSON.stringify([{ page: "4" }]));
      } else if (currentStep === 4) {
        // For declaration step, send the structured object
        const declaration = {
          terms_conditions: KYCformData.terms_conditions,
          page: "5"
        };
        formData.append("Declaration", JSON.stringify([declaration]));
      }

      const res = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === 200) {
        await fetchKYCFormdata();

        if (currentStep < steps.length - 1) {
          // Not last step - Show page saved message and move to next step
          const pageNames = [
            "Contact Details",
            "Identity",
            "Bank Details",
            "Documents",
            "Declaration"
          ];
          const currentPageName = pageNames[currentStep] || "Page";
          toast.success(`${currentPageName} saved successfully!`);
          setCurrentStep((s) => s + 1);
        } else {
          // Last step (Declaration) - Show only KYC Submitted Successfully
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
    
    // Calculate the first incomplete step index
    const nextIncompleteStepIdx = steps.findIndex((_, idx) => {
      const pageNum = isServiceOnly ? SERVICE_STEP_INDICES[idx] + 1 : idx + 1;
      return !completed.includes(pageNum);
    });

    const allowedIndex = nextIncompleteStepIdx === -1 ? steps.length - 1 : nextIncompleteStepIdx;

    if (i > allowedIndex) {
      validateCurrentStep();
      toast.info('Please complete current step first');
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
          qr_code_image: docs.qr_code_image || null,
          cheque_image: docs.cheque_image || null,

          completed_pages: data.completed_pages || [],
          // Handle terms_conditions from root level of response or Declaration object
          terms_conditions: data.terms_conditions !== undefined 
            ? data.terms_conditions 
            : (data.Declaration?.terms_conditions !== undefined ? data.Declaration.terms_conditions : prev.terms_conditions),
        }));

        // If user has completed any pages or has terms accepted, it's "edit time"
        const hasData = (data.completed_pages && data.completed_pages.length > 0) || data.id;
        if (hasData) {
          setCanFilter(false);
          // Restore filters based on saved vendor_type if available
          const savedType = data.vendor_type;
          if (savedType) {
            setFilters({
              service: savedType === "service" || savedType === "both",
              vendor: savedType === "vendor" || savedType === "both",
            });
          }
        }
      }
    } catch (err) {
      console.error("Fetch KYC error:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Vendor Type Selection is now handled globally via AppHeader and FilterContext */}

      <ComponentCard title="KYC Verification">
        <Stepper steps={steps} currentStep={currentStep} completedPages={KYCformData.completed_pages} onStepChange={handleStepChange} />

        <div className="min-h-[400px] md:min-h-[520px]">
          {/* Contact Details is always step 0 in both modes */}
          {actualStep === 0 && (
            <ContactDetails
              setKYCFormData={setKYCFormData}
              KYCformData={KYCformData}
              errors={errors}
              clearError={clearError}
            />
          )}
          {/* The following steps only show in vendor/both mode */}
          {actualStep === 1 && (
          <Identity
            KYCformData={KYCformData}
            setKYCFormData={setKYCFormData}
            errors={errors}
            clearError={clearError}
          />
        )}
          {actualStep === 2 && (
            <BankDetails
              setKYCFormData={setKYCFormData}
              KYCformData={KYCformData}
              errors={errors}
              clearError={clearError}
            />
          )}
          {actualStep === 3 && (
            <Documents
              setKYCFormData={setKYCFormData}
              KYCformData={KYCformData}
              errors={errors}
              clearError={clearError}
              isServiceOnly={isServiceOnly}
            />
          )}
          {/* Declaration is always the last step in both modes */}
          {actualStep === 4 && (
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
            className="btn-primary min-w-[120px] relative"
            title="Press Enter to save and continue"
          >
            {isSubmitting
              ? "Saving..."
              : currentStep === steps.length - 1
                ? "Submit KYC"
                : "Save & Next"}
          </button>
        </div>
      </ComponentCard>
    </div>
  );
}