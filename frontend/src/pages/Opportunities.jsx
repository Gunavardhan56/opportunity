import { useEffect, useMemo, useState } from "react";
import { getOpportunities } from "../api/api";
import OpportunityCard from "../components/OpportunityCard";

export default function Opportunities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [sortByDeadline, setSortByDeadline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOpportunities();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load opportunities.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allSkills = useMemo(() => {
    const set = new Set();
    items.forEach((o) => (o.skills || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let data = [...items];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.company?.toLowerCase().includes(q) ||
          o.role?.toLowerCase().includes(q)
      );
    }
    if (skillFilter) {
      data = data.filter((o) => (o.skills || []).includes(skillFilter));
    }
    if (sortByDeadline) {
      data.sort((a, b) => (a.deadline_date || "").localeCompare(b.deadline_date || ""));
    }
    return data;
  }, [items, search, skillFilter, sortByDeadline]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary">
            Explore opportunities
          </h1>
          <p className="text-sm text-textSecondary">
            Browse all parsed opportunities from your connected channels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by company or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border/60 text-sm bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary/60 text-textPrimary"
          />
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border/60 text-sm bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary"
          >
            <option value="">All skills</option>
            {allSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-textSecondary">
            <input
              type="checkbox"
              checked={sortByDeadline}
              onChange={(e) => setSortByDeadline(e.target.checked)}
            />
            Sort by deadline
          </label>
        </div>
      </div>
      {loading && <div className="text-sm text-textSecondary">Loading...</div>}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-sm text-textSecondary">
          No opportunities found yet.
        </div>
      )}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((opp) => (
          <OpportunityCard
            key={opp._id}
            opportunity={opp}
            onApply={() => window.open(opp.link || "#", "_blank")}
          />
        ))}
      </div>
    </div>
  );
}

