import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOpportunity } from "../api/api";

function isPresent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function Field({ label, value }) {
  if (!isPresent(value)) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-textSecondary">{label}</div>
      <div className="text-sm text-textPrimary break-words">{value}</div>
    </div>
  );
}

export default function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!id) return;
      try {
        const data = await getOpportunity(id);
        if (active) setItem(data || null);
      } catch (e) {
        if (active) setError("Failed to load opportunity details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [id]);

  const applyLink = item?.application_link || item?.link || "";

  const skills = useMemo(() => {
    const s = item?.skills_required?.length ? item.skills_required : item?.skills || [];
    return Array.isArray(s) ? s : [];
  }, [item]);

  if (loading) {
    return <div className="text-sm text-textSecondary">Loading...</div>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <button type="button" className="btn-secondary text-xs" onClick={() => navigate(-1)}>
          Back
        </button>
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-3">
        <button type="button" className="btn-secondary text-xs" onClick={() => navigate(-1)}>
          Back
        </button>
        <div className="text-sm text-textSecondary">Opportunity not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-textPrimary">{item.role || "Opportunity"}</h1>
          {isPresent(item.company) && (
            <p className="text-sm text-textSecondary">{item.company}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => window.open(applyLink || "#", "_blank")}
            disabled={!applyLink}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Batch" value={item.batch} />
        <Field label="Deadline" value={item.deadline} />
        <Field label="Duration" value={item.duration} />
        <Field label="Stipend" value={item.stipend} />
        <Field label="Confidence" value={isPresent(item.confidence) ? String(item.confidence) : null} />
        <Field label="Deadline date" value={item.deadline_date} />
      </div>

      {skills.length > 0 && (
        <div className="card p-4 space-y-2">
          <div className="text-sm font-semibold text-textPrimary">Skills</div>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-textSecondary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {isPresent(item.eligibility_criteria) && (
        <div className="card p-4 space-y-2">
          <div className="text-sm font-semibold text-textPrimary">Eligibility</div>
          <div className="text-sm text-textSecondary whitespace-pre-wrap">
            {item.eligibility_criteria}
          </div>
        </div>
      )}

      {isPresent(item.raw_message) && (
        <div className="card p-4 space-y-2">
          <div className="text-sm font-semibold text-textPrimary">Original message</div>
          <pre className="text-xs text-textSecondary whitespace-pre-wrap break-words">
            {item.raw_message}
          </pre>
        </div>
      )}

      {isPresent(item.link) && (
        <div className="card p-4 space-y-2">
          <div className="text-sm font-semibold text-textPrimary">Links</div>
          {isPresent(item.link) && (
            <div className="text-sm">
              <span className="text-textSecondary">Link: </span>
              <a className="text-primary underline" href={item.link} target="_blank" rel="noreferrer">
                {item.link}
              </a>
            </div>
          )}
          {isPresent(item.application_link) && item.application_link !== item.link && (
            <div className="text-sm">
              <span className="text-textSecondary">Application link: </span>
              <a
                className="text-primary underline"
                href={item.application_link}
                target="_blank"
                rel="noreferrer"
              >
                {item.application_link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

