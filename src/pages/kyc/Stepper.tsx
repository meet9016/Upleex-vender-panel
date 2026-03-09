type Props = {
  steps?: string[];
  currentStep: number;
  completedPages?: string[];
  onStepChange?: (index: number) => void;
};

export default function Stepper({
  steps = [],
  currentStep,
  completedPages = [],
  onStepChange,
}: Props) {
  return (
    <div className="w-full px-2 md:px-0">
      <div className="flex items-start md:items-center justify-between">
        {steps.map((label, index) => {
          const stepNumStr = String(index + 1);
          const isCompleted = completedPages.includes(stepNumStr);
          const isActive = index === currentStep;
          return (
            <div
              key={index}
              className="relative flex flex-col items-center flex-1"
            >
              {/* Horizontal connector line */}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute top-4 md:top-5 h-0.5 w-full left-[calc(50%+12px)] md:left-[calc(50%+20px)] md:w-[calc(100%-40px)]
                   ${isCompleted ? "step-line-active" : "bg-gray-300"}`}
                  style={{
                    width: 'calc(100% - 24px)'
                  }}
                />
              )}

              {/* Step circle */}
              <div
                className={`relative z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center
                  rounded-full text-xs md:text-sm font-semibold cursor-pointer
                  ${isActive
                    ? "step-circle-active"
                    : "bg-gray-300 text-gray-600"
                  }`}
                onClick={() => onStepChange?.(index)}
              >
                {index + 1}
              </div>

              {/* Label */}
              <span className="mt-2 md:mt-3 text-[10px] md:text-xs text-gray-700 text-center leading-tight px-1 max-w-[60px] md:max-w-[120px] dark:text-white">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}