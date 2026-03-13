export default function OnboardingProgress({ currentStep }) {
  const steps = [
    { num: 1, label: "Account" },
    { num: 2, label: "Resume" },
    { num: 3, label: "Telegram" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step.num < currentStep
                ? "bg-primary text-white"
                : step.num === currentStep
                ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                : "bg-slate-200 text-textSecondary"
            }`}
          >
            {step.num}
          </div>
          <span
            className={`ml-1.5 text-xs font-medium hidden sm:inline ${
              step.num <= currentStep ? "text-textPrimary" : "text-textSecondary"
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                step.num < currentStep ? "bg-primary" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
