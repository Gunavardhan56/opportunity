import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../api/api";
import OnboardingProgress from "../components/OnboardingProgress";

export default function OnboardingProfile({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
    else setError("Only PDF files are accepted.");
  };

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0];
    setError("");
    if (chosen?.type === "application/pdf") setFile(chosen);
    else if (chosen) setError("Only PDF files are accepted.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await uploadResume(file, user?.id);
      setProfile(data.profile);
      if (data.user && onUserUpdate) onUserUpdate(data.user);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to upload resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/onboarding/telegram", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <OnboardingProgress currentStep={2} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Create your resume profile
        </h1>
        <p className="text-sm text-textSecondary">
          Upload your resume once. We extract your skills and save them to your
          profile so you never have to upload again.
        </p>
      </div>

      {!profile ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer block text-sm text-textSecondary"
            >
              {file ? (
                <span className="text-textPrimary font-medium">{file.name}</span>
              ) : (
                <>
                  Drag and drop your resume here, or{" "}
                  <span className="text-primary font-medium">browse</span>
                </>
              )}
            </label>
            <p className="text-xs text-textSecondary mt-1">PDF only</p>
          </div>
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!file || loading}
          >
            {loading ? "Processing..." : "Upload & extract skills"}
          </button>
        </form>
      ) : (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-textPrimary">
            Detected skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).length > 0 ? (
              profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {s}
                </span>
              ))
            ) : (
              <p className="text-sm text-textSecondary">
                No skills detected. You can still continue.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="btn-primary w-full mt-4"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
