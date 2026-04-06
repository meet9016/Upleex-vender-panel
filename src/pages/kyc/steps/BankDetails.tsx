"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage';
import endPointApi from "@/utils/endPointApi";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { PlusIcon } from "@/icons";
import { toast } from "react-toastify";
import { api } from "@/utils/axiosInstance";
import ComponentCard from "@/components/common/ComponentCard";

export type Option = {
  value: string;
  label: string;
};

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;
};

export default function BankDetails({ setKYCFormData, KYCformData, errors, clearError }: KYCFormProp) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch account types from dropdown API
  const fetchAccountTypes = async () => {
    setLoading(true);
    try {
      const res = await api.post(endPointApi.postProductDropDownList);
      console.log('Dropdown API Response:', res.data);
      
      if (res.data.success && res.data.account_type) {
        // Transform the account_type array to Option format
        const accountTypeOptions = res.data.account_type.map((item: any) => ({
          value: item.id,
          label: item.type_name
        }));
        setOptions(accountTypeOptions);
      }
    } catch (error) {
      console.error('Failed to fetch account types:', error);
      toast.error('Failed to load account types');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchAccountTypes();
  }, []);

  return (
    <>
      <ComponentCard title="Bank Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <Label required>Bank Account Holder Name</Label>
            <div className="relative">
              <Input
                placeholder="Enter Bank Account Holder Name"
                type="text"
                error={!!errors?.account_holder_name}
                value={KYCformData?.account_holder_name || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(value) || value === "") {
                    clearError("account_holder_name");
                    setKYCFormData((prevData) => ({
                      ...prevData,
                      account_holder_name: value,
                    }));
                  }
                }}
              />
              {errors?.account_holder_name && (
                <p className="error-message">{errors.account_holder_name}</p>
              )}
            </div>
          </div>

          <div>
            <Label required>Account Number</Label>
            <div className="relative">
              <Input
                placeholder="Enter Account Number"
                type="text"
                error={!!errors?.account_number}
                value={KYCformData?.account_number || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 18) {
                    clearError("account_number");
                    setKYCFormData((prevData) => ({
                      ...prevData,
                      account_number: value,
                    }));
                  }
                }}
              />
              {errors?.account_number && (
                <p className="error-message">{errors.account_number}</p>
              )}
            </div>
          </div>

          <div>
            <Label required>Confirm Account Number</Label>
            <div className="relative">
              <Input
                placeholder="Re-enter Account Number"
                type="text"
                error={!!errors?.confirm_account_number}
                value={KYCformData?.confirm_account_number || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 18) {
                    clearError("confirm_account_number");
                    setKYCFormData((prevData) => ({
                      ...prevData,
                      confirm_account_number: value,
                    }));
                  }
                }}
              />
              {errors?.confirm_account_number && (
                <p className="error-message">{errors.confirm_account_number}</p>
              )}
            </div>
          </div>

          <div>
            <Label required>IFSC Code</Label>
            <div className="relative">
              <Input
                placeholder="Enter your IFSC Code"
                type="text"
                error={!!errors?.ifsc_code}
                value={KYCformData?.ifsc_code || ""}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length <= 11) {
                    clearError("ifsc_code");
                    setKYCFormData((prevData) => ({
                      ...prevData,
                      ifsc_code: value,
                    }));
                  }
                }}
              />
              {errors?.ifsc_code && (
                <p className="error-message">{errors.ifsc_code}</p>
              )}
            </div>
          </div>

          <div>
            <Label required>Account Type</Label>
            <div className="relative flex gap-2">
              <div className="flex-1">
                <SearchableDropdown
                  options={options}
                  value={KYCformData?.account_type || null}
                  placeholder={loading ? "Loading..." : "Select Account Type"}
                  usePortal
                  error={!!errors?.account_type}
                  disabled={loading}
                  onChange={(value) => {
                    clearError("account_type");
                    setKYCFormData(prev => ({
                      ...prev,
                      account_type: value,
                    }));
                  }}
                />
              </div>
              
            </div>

            {errors?.account_type && (
              <p className="error-message">
                {errors.account_type}
              </p>
            )}
          </div>

          <div className="hidden md:block"></div>
        </div>
      </ComponentCard>
    </>
  );
}