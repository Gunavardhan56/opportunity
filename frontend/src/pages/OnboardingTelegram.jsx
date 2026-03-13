import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { patchUser } from "../api/api";
import OnboardingProgress from "../components/OnboardingProgress";

const BOTS = [
  {
    name: "Opportunity Scanner Bot",
    url: "https://t.me/your_opportunity_scanner_bot",
    description: "Scans curated internship/job channels and forwards posts.",
  },
  {
    name: "Internship Alert Bot",
    url: "https://t.me/your_internship_alert_bot",
    description: "Sends you high-signal internship alerts mapped to your skills.",
  },
];

export default function OnboardingTelegram({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      await patchUser(user?.id, { telegram_connected: true });
      if (onUserUpdate) onUserUpdate({ telegram_connected: true });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to update. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <OnboardingProgress currentStep={3} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Connect Telegram bots
        </h1>
        <p className="text-sm text-textSecondary">
          Our bots scan internship and job channels 24/7 and feed opportunities
          into your dashboard. Connect once and you’re set.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-textPrimary">
          How to connect
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-textSecondary">
          <li>Click one of the bot links below.</li>
          <li>Open Telegram (app or web).</li>
          <li>Press <strong className="text-textPrimary">START</strong> in the chat.</li>
        </ol>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {BOTS.map((bot) => (
          <div key={bot.name} className="card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-textPrimary">
              {bot.name}
            </h3>
            <p className="text-xs text-textSecondary">{bot.description}</p>
            <a
              href={bot.url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm inline-flex mt-2"
            >
              Open in Telegram
            </a>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Saving..." : "Continue to dashboard"}
      </button>
    </div>
  );
}
