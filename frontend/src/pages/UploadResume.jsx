import { useState } from "react";
import { uploadResume } from "../api/api";

export default function UploadResume({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await uploadResume(file, user?.id);
      setProfile(data.profile);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to upload resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Upload your resume
        </h1>
        <p className="text-sm text-textSecondary">
          Upload a PDF resume once. We will extract your skills and batch to
          power eligibility and matching.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="card p-4 flex flex-col md:flex-row items-center gap-4"
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />
        <button
          type="submit"
          className="btn-primary whitespace-nowrap"
          disabled={!file || loading}
        >
          {loading ? "Processing..." : "Upload"}
        </button>
      </form>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {profile && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-textPrimary">
            Extracted profile
          </h2>
          {profile.batch && (
            <p className="text-xs text-textSecondary">
              <span className="font-medium">Batch:</span> {profile.batch}
            </p>
          )}
          {profile.skills?.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-textSecondary">
                Skills:
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-textSecondary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

