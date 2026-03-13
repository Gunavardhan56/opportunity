import { useEffect, useState } from "react";
import { getUserMatches } from "../api/api";

function MatchBar({ score }) {
  const pct = Math.round(score ?? 0);
  const color =
    pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-secondary" : "bg-slate-300";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Matches({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserMatches(user.id);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load match history.");
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
          Match history
        </h1>
        <p className="text-sm text-textSecondary">
          All historical matches between your profile and parsed opportunities.
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
          No matches yet. Once new opportunities are processed, they will appear
          here.
        </div>
      )}
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-4 py-2 font-medium text-textSecondary">
                Company
              </th>
              <th className="px-4 py-2 font-medium text-textSecondary">Role</th>
              <th className="px-4 py-2 font-medium text-textSecondary">
                Score
              </th>
              <th className="px-4 py-2 font-medium text-textSecondary">
                Eligible
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { match, opportunity } = item;
              const score = Math.round((match?.score ?? 0) * 100);
              const eligible = match?.eligible;
              return (
                <tr key={match?._id} className="border-b border-border">
                  <td className="px-4 py-2 text-textPrimary">
                    {opportunity?.company}
                  </td>
                  <td className="px-4 py-2 text-textSecondary">
                    {opportunity?.role}
                  </td>
                  <td className="px-4 py-2 w-40">
                    <div className="flex flex-col gap-1">
                      <MatchBar score={score} />
                      <span className="text-[11px] text-textSecondary">
                        {score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] ${eligible
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-textSecondary"
                        }`}
                    >
                      {eligible ? "Eligible" : "Not eligible"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

