"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "@/icons";
import { api } from "@/utils/axiosInstance";
import { useEffect, useState } from "react";
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage'
import endPointApi from "@/utils/endPointApi";

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
  const [options, setOptions] = useState<Option[]>([])

  const fetchOptions = async () => {

    if (loading && options.length > 0) return;
    setLoading(true);


    try {
      const res = await api.post(`${endPointApi.postBankAccountTypeList}`);

      const list = res?.data?.data || [];

      setOptions(prev => {
        const map = new Map(prev.map(opt => [opt.value, opt]));
        list.forEach((item: any) => {
          map.set(String(item.id), {
            value: String(item.id),
            label: item.type_name,
          });
        });

        return Array.from(map.values());
      });



    } catch (error) {
      console.error(`Failed to fetch bank account types`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.length === 0) fetchOptions();
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        <div>
          <Label>Bank Account Holder Name</Label>
          <div className="relative">
            <Input
              placeholder="Enter Bank Account Holder Name"
              type="text"
               
              value={KYCformData?.account_holder_name || ""}
              error={!!errors?.account_holder_name}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow letters and spaces
                if (/^[a-zA-Z\s]*$/.test(value)) {
                  clearError("account_holder_name");
                  setKYCFormData((prevData) => ({
                    ...prevData,
                    account_holder_name: value,
                  }));
                }
              }}
              
            />
            {errors?.account_holder_name && (
              <p className="mt-1 text-sm text-red-500">{errors.account_holder_name}</p>
            )}
          </div>
        </div>
        <div>
          <Label>Account Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter Account Number"
              type="text"
              value={KYCformData?.account_number || ""}
              error={!!errors?.account_number}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow digits and max 18 characters
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
              <p className="mt-1 text-sm text-red-500">{errors.account_number}</p>
            )}

          </div>
        </div>
        <div>
          <Label>Confirm Account Number</Label>
          <div className="relative">
            <Input
              placeholder="Re-enter Account Number"
              type="text"
              value={KYCformData?.confirm_account_number || ""}
              error={!!errors?.confirm_account_number}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow digits and max 18 characters
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
              <p className="mt-1 text-sm text-red-500">{errors.confirm_account_number}</p>
            )}
          </div>

        </div>
        <div>
          <Label>IFSC Code</Label>
          <div className="relative">
            <Input
              placeholder="Enter your IFSC Code"
              type="text"
              value={KYCformData?.ifsc_code || ""}
              error={!!errors?.ifsc_code}
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
              <p className="mt-1 text-sm text-red-500">{errors.ifsc_code}</p>
            )}
          </div>
        </div>
        <div>
          <Label>Account Type</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Account Type"
              value={KYCformData?.account_type || ""}
              onChange={(value) => {
                clearError("account_type"); // ✅ correct place
                setKYCFormData(prev => ({
                  ...prev,
                  account_type: value,
                }));
              }}
              className={`dark:bg-dark-900 ${errors?.account_type ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
            {errors?.account_type && (
              <p className="mt-1 text-sm text-red-500">{errors.account_type}</p>
            )}
          </div>
        </div>
        {/* Full width placeholder area (future use: MICR, Branch etc.) */}
        <div className="hidden md:block"></div>
      </div>
    </div>
  );
}
