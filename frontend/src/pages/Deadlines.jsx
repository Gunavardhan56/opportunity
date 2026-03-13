import { useEffect, useState } from "react";
import { getDeadlines } from "../api/api";

function urgencyColor(deadlineDateIso) {
  if (!deadlineDateIso) return "bg-slate-800 text-textSecondary";
  try {
    const deadline = new Date(deadlineDateIso);
    const now = new Date();
    const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) return "bg-red-500/20 text-red-300";
    if (diffDays <= 3) return "bg-orange-500/20 text-orange-300";
    return "bg-slate-800 text-textSecondary";
  } catch {
    return "bg-slate-800 text-textSecondary";
  }
}

export default function Deadlines() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDeadlines();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load upcoming deadlines.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Deadline tracker
        </h1>
        <p className="text-sm text-textSecondary">
          Opportunities closing within the next two days highlighted by urgency.
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
          No upcoming deadlines in the next two days.
        </div>
      )}
      <div className="space-y-3">
        {items.map((opp) => (
          <div
            key={opp._id}
            className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-textPrimary">
                {opp.role}
              </h3>
              <p className="text-xs text-textSecondary">{opp.company}</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${urgencyColor(
                  opp.deadline_date
                )}`}
              >
                {opp.deadline || "Deadline soon"}
              </span>
              <div className="flex justify-end gap-2">
                <a
                  href={opp.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`btn-secondary text-xs ${opp.link ? "" : "pointer-events-none opacity-50"}`}
                >
                  View
                </a>
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => window.open(opp.link || "#", "_blank")}
                  disabled={!opp.link}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

