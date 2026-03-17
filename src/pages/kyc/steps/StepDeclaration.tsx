// StepDeclaration.tsx
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage';

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
    <div>
      <label className="flex items-center gap-2 dark:text-white">
        <input
          type="checkbox"
          checked={KYCformData?.terms_conditions === true}
          onChange={(e) => {
             clearError("terms_conditions")
            setKYCFormData((prev) => ({
              ...prev,
              terms_conditions: e.target.checked,
            }));
          }}

        />
        I confirm all details are correct
      </label>

      {errors?.terms_conditions && (
        <p className="error-message">
          {errors.terms_conditions}
        </p>
      )}
    </div>
  );
}
