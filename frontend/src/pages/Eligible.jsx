import { useEffect, useState } from "react";
import { getEligibleOpportunities } from "../api/api";

function MatchBar({ score }) {
  const pct = Math.round(score ?? 0);
  const color =
    pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-secondary" : "bg-slate-300";
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Eligible({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const data = await getEligibleOpportunities(user.id);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load eligible opportunities.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Eligible opportunities
        </h1>
        <p className="text-sm text-textSecondary">
          Opportunities where your profile is marked as eligible by the
          backend’s eligibility engine.
        </p>
      </div>
      {loading && <div className="text-sm text-textSecondary">Loading...</div>}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-textSecondary">
          No eligible opportunities yet. Once your resume is processed and new
          posts arrive, matches will appear here.
        </div>
      )}
      <div className="space-y-3">
        {items.map((item) => {
          const { match, opportunity } = item;
          const score = Math.round((match?.score ?? 0) * 100);
          const isEligible = match?.eligible;
          const link = opportunity?.link || "";
          return (
            <div
              key={match?._id}
              className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {opportunity?.role}
                </h3>
                <p className="text-xs text-textSecondary">
                  {opportunity?.company}
                </p>
                {opportunity?.deadline && (
                  <p className="text-xs text-textSecondary">
                    Deadline: {opportunity.deadline}
                  </p>
                )}
              </div>
              <div className="w-full md:w-72 space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary">
                  <span>Match score</span>
                  <div className="flex gap-2 items-center">
                    <span className={`font-medium ${isEligible ? 'text-green-600' : 'text-red-500'}`}>
                      {isEligible ? "Eligible" : "Not Eligible"}
                    </span>
                    <span className="font-medium text-textPrimary">
                      {score}%
                    </span>
                  </div>
                </div>
                <MatchBar score={score} />
                <div className="flex justify-end gap-2 pt-1">
                  <a
                    href={link || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn-secondary text-xs ${link ? "" : "pointer-events-none opacity-50"}`}
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => window.open(link || "#", "_blank")}
                    disabled={!link}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

