import Checkbox from '@/components/form/input/Checkbox';
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage';
import { FiShield, FiCheck } from "react-icons/fi";

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;

};

export default function StepDeclaration({
  setKYCFormData,
  KYCformData,
  errors,
  clearError

}: KYCFormProp) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Declaration Card */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        errors?.terms_conditions 
          ? "border-rose-200 bg-rose-50/30 shadow-xl shadow-rose-500/5" 
          : "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 shadow-xl shadow-slate-200/50 dark:shadow-none"
      }`}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Custom Checkbox using common component */}
            <div className="relative flex-shrink-0 mt-1">
              <Checkbox
                id="declaration-checkbox"
                checked={KYCformData?.terms_conditions === true}
                onChange={(checked) => {
                  clearError?.("terms_conditions");
                  setKYCFormData((prev) => ({
                    ...prev,
                    terms_conditions: checked,
                  }));
                }}
              />
            </div>

            {/* Declaration Content */}
            <label htmlFor="declaration-checkbox" className="flex-1 cursor-pointer select-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                  <FiShield className="text-indigo-600 dark:text-indigo-400 text-base" />
                </div>
                <h4 className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400  ">Self Declaration</h4>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm leading-relaxed font-semibold text-slate-800 dark:text-slate-100">
                  I hereby declare that the information and documents submitted by me are true and correct.
                </p>
                <div className="text-xs leading-loose text-slate-500 dark:text-slate-400 font-medium">
                  I authorize the platform to verify my details (including Aadhaar, PAN, and bank details) and use them for KYC and compliance purposes. I understand that providing false information may lead to account suspension or legal action.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Error Notice */}
      {errors?.terms_conditions && (
        <p className="error-message">{errors.terms_conditions}</p>
      )}
    </div>
  );
}
