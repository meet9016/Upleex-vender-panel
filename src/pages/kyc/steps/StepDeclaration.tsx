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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Declaration Card */}
      <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 ${
        errors?.terms_conditions 
          ? "border-rose-200 bg-rose-50/30 shadow-xl shadow-rose-500/5" 
          : "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 shadow-xl shadow-slate-200/50 dark:shadow-none"
      }`}>
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-5">
            {/* Custom Checkbox Wrapper */}
            <div className="relative flex-shrink-0 mt-1">
              <input
                type="checkbox"
                id="declaration-checkbox"
                className="peer absolute opacity-0 w-6 h-6 cursor-pointer z-10"
                checked={KYCformData?.terms_conditions === true}
                onChange={(e) => {
                  clearError("terms_conditions");
                  setKYCFormData((prev) => ({
                    ...prev,
                    terms_conditions: e.target.checked,
                  }));
                }}
              />
              <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                KYCformData?.terms_conditions 
                  ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/30" 
                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 peer-hover:border-indigo-400"
              }`}>
                {KYCformData?.terms_conditions && <FiCheck className="text-white text-sm stroke-[3]" />}
              </div>
            </div>

            {/* Declaration Content */}
            <label htmlFor="declaration-checkbox" className="flex-1 cursor-pointer select-none">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                  <FiShield className="text-indigo-600 dark:text-indigo-400 text-lg" />
                </div>
                <h4 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Self Declaration</h4>
              </div>
              
              <div className="space-y-4">
                <p className="text-[15px] leading-relaxed font-semibold text-slate-800 dark:text-slate-100">
                  I hereby declare that the information and documents submitted by me are true and correct.
                </p>
                <div className="text-[13px] leading-loose text-slate-500 dark:text-slate-400 font-medium">
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
        <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl animate-in shake duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            {errors.terms_conditions}
          </p>
        </div>
      )}
    </div>
  );
}
