"use client";

import { useState } from "react";
import Stepper from "./Stepper";
import StepContact from "./steps/StepContact";
import StepIdentity from "./steps/StepIdentity";
import StepBankDetails from "./steps/StepBankDetails";
import StepDocument from "./steps/StepDocument";
import StepDeclaration from "./steps/StepDeclaration";
import ComponentCard from "@/components/common/ComponentCard";

const steps = [
  "Contact Details",
  "Identity",
  "Bank",
  "Documents",
  "Declaration",
];

export default function KYCPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
     <ComponentCard title="KYC Verification">
        
        {/* Stepper scroll on mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-max md:min-w-0">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Form Body */}
        <div>
          {currentStep === 0 && <StepContact />}
          {currentStep === 1 && <StepIdentity />}
          {currentStep === 2 && <StepBankDetails />}
          {currentStep === 3 && <StepDocument />}
          {currentStep === 4 && <StepDeclaration />}
        </div>

        {/* Sticky Footer */}
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
          {/* Back Button */}
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
            onClick={() =>
              currentStep === steps.length - 1
                ? alert("KYC Submitted")
                : setCurrentStep((s) => s + 1)
            }
            className="
              px-8 py-2 w-full md:w-auto 
              rounded-lg bg-blue-600 text-white
              hover:bg-blue-700 transition font-medium
            "
          >
            {currentStep === steps.length - 1 ? "Submit KYC" : "Next"}
          </button>
        </div>
      </ComponentCard>
  );
}
