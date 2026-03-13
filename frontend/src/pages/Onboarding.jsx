export default function Onboarding() {
  const steps = [
    {
      title: "Upload your resume once",
      description:
        "We extract your skills and profile to understand what opportunities fit you best.",
    },
    {
      title: "Start the Telegram bots",
      description:
        "Our Telegram bots scan internship and job channels 24/7 so you never miss a post.",
    },
    {
      title: "Get matched automatically",
      description:
        "We continuously match new opportunities to your profile and surface the best ones.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Welcome to Opportunity Intelligence
        </h1>
        <p className="text-sm text-textSecondary max-w-2xl">
          This workspace centralizes all your internship and job opportunities,
          tracks deadlines, and highlights the ones that truly match your
          profile.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div key={step.title} className="card p-4 space-y-2">
            <div className="text-xs font-semibold text-primary">
              STEP {idx + 1}
            </div>
            <h2 className="text-sm font-semibold text-textPrimary">
              {step.title}
            </h2>
            <p className="text-xs text-textSecondary">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

