type Props = {
  steps?: string[];
  currentStep: number;
};

export default function Stepper({
  steps = [],
  currentStep,
}: Props) {
  return (
    <div className="relative flex flex-col md:flex-row md:justify-between items-start w-full gap-6 md:gap-0">
      {steps.map((label, index) => {
        const isActive = index <= currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className="relative flex flex-col items-center flex-1"
          >
            {/* Horizontal Line for Desktop */}
            {index !== steps.length - 1 && (
              <div
                className={`hidden md:block absolute top-5 left-1/2 w-full h-1 
                  ${isCompleted ? "bg-blue-600" : "bg-gray-300"}`}
              />
            )}

            {/* Vertical Line for Mobile */}
            {index !== steps.length - 1 && (
              <div
                className={`md:hidden absolute top-10 left-1/2 -translate-x-1/2 w-1 h-6 
                  ${isCompleted ? "bg-blue-600" : "bg-gray-300"}`}
              />
            )}

            {/* STEP CIRCLE */}
            <div
              className={`z-10 w-10 h-10 flex items-center justify-center
              rounded-full text-sm font-semibold
              ${isActive
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"}`}
            >
              {index + 1}
            </div>

            {/* LABEL */}
            <span className="mt-2 text-xs text-center text-gray-700 max-w-[120px]">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
