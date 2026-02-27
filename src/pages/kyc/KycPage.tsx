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

  const router = useRouter();

  useEffect(() => {
    fetchKYCFormdata();
  }, []);

  const clearError = (field: string | number) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  };

  const FormDataValidation = async () => {
    const newErrors: ErrorType = {};
    const isEmpty = (val: string | undefined | null) => !val || !val.trim();
    const isPANValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
    const isIFSCValid = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);
    const isMobileValid = (val: string) => /^[6-9][0-9]{9}$/.test(val);

    if (currentStep === 0) {
      if (isEmpty(KYCformData.full_name)) newErrors.full_name = "Name is required";
      if (isEmpty(KYCformData.email)) newErrors.email = "Email is required";
      if (isEmpty(KYCformData.mobile) || !isMobileValid(KYCformData.mobile)) newErrors.mobile = "Valid 10-digit mobile required";
      if (isEmpty(KYCformData.address)) newErrors.address = "Address is required";
      if (!KYCformData.country_id?.value) newErrors.country_id = "Country is required";
      if (!KYCformData.state_id?.value) newErrors.state_id = "State is required";
      if (!KYCformData.city_id?.value) newErrors.city_id = "City is required";
    } else if (currentStep === 1) {
      if (!isPANValid(KYCformData.pancard_number)) newErrors.pancard_number = "Invalid PAN format";
      if (isEmpty(KYCformData.aadharcard_number)) newErrors.aadharcard_number = "Aadhaar required";
      if (isEmpty(KYCformData.business_name)) newErrors.business_name = "Business name required";
    } else if (currentStep === 2) {
      if (isEmpty(KYCformData.account_number)) newErrors.account_number = "Account number required";
      if (!isIFSCValid(KYCformData.ifsc_code)) newErrors.ifsc_code = "Invalid IFSC format";
    } else if (currentStep === 3) {
      if (!KYCformData.pancard_front_image) newErrors.pancard_front_image = "Required";
      if (!KYCformData.aadharcard_front_image) newErrors.aadharcard_front_image = "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitKYCFormdata = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('page', String(currentStep + 1));
      formData.append('mobile', KYCformData.mobile);
      formData.append('email', KYCformData.email);

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
        formData.append('ContactDetails', JSON.stringify([contact]));
      } else if (currentStep === 1) {
        const identity = {
          pancard_number: KYCformData.pancard_number,
          aadharcard_number: KYCformData.aadharcard_number,
          business_name: KYCformData.business_name,
          gst_number: KYCformData.gst_number,
          page: "2"
        };
        formData.append('Identity', JSON.stringify([identity]));
      } else if (currentStep === 2) {
        const bank = {
          account_holder_name: KYCformData.account_holder_name,
          account_number: KYCformData.account_number,
          confirm_account_number: KYCformData.confirm_account_number,
          ifsc_code: KYCformData.ifsc_code,
          account_type: KYCformData.account_type,
          page: "3"
        };
        formData.append('Bank', JSON.stringify([bank]));
      } else if (currentStep === 3) {
        if (KYCformData.pancard_front_image instanceof File) formData.append('pancard_front_image', KYCformData.pancard_front_image);
        if (KYCformData.aadharcard_front_image instanceof File) formData.append('aadharcard_front_image', KYCformData.aadharcard_front_image);
        if (KYCformData.aadharcard_back_image instanceof File) formData.append('aadharcard_back_image', KYCformData.aadharcard_back_image);
        if (KYCformData.gst_certificate_image instanceof File) formData.append('gst_certificate_image', KYCformData.gst_certificate_image);
        if (KYCformData.vendor_image instanceof File) formData.append('vendor_image', KYCformData.vendor_image);
        if (KYCformData.business_logo_image instanceof File) formData.append('business_logo_image', KYCformData.business_logo_image);
        formData.append('Documents', JSON.stringify([{ page: "4" }]));
      }

      const res = await api.post(`${endPointApi.postVendorKYCFormSubmit}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === 200) {
        await fetchKYCFormdata();
        if (currentStep < steps.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          toast.success("KYC Submitted Successfully");
          router.push("/");
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchKYCFormdata = async () => {
    try {
      const res = await api.get(`${endPointApi.postFetchVendorKYCFormData}`);
      if (res.status === 200 && res.data.data) {
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
        }));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const handleNext = async () => {
    if (await FormDataValidation()) {
      await submitKYCFormdata();
    }
  };

  return (
    <ComponentCard title="KYC Verification">
      <Stepper steps={steps} currentStep={currentStep} completedPages={KYCformData.completed_pages} />
      <div className="min-h-[400px]">
        {currentStep === 0 && <ContactDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 1 && <Identity setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 2 && <BankDetails setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 3 && <Documents setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
        {currentStep === 4 && <StepDeclaration setKYCFormData={setKYCFormData} KYCformData={KYCformData} errors={errors} clearError={clearError} />}
      </div>
      <div className="flex justify-between mt-8 p-4 border-t">
        <button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0 || isSubmitting} className="btn-secondary">Back</button>
        <button onClick={handleNext} disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Processing..." : currentStep === steps.length - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </ComponentCard>
  );
}