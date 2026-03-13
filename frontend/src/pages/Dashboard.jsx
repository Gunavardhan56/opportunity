import { useEffect, useState } from "react";
import { getSystemStatus } from "../api/api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSystemStatus();
        setStats(data);
      } catch (err) {
        setError("Failed to load system status.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalOpps = stats?.opportunities ?? 0;
  const totalMatches = stats?.matches ?? 0;
  const reminders = stats?.reminders ?? 0;
  const users = stats?.users ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary">
            Opportunity overview
          </h1>
          <p className="text-sm text-textSecondary">
            High-level view of opportunities, matches, and reminders in the
            system.
          </p>
        </div>
      </div>
      {loading && <div className="text-sm text-textSecondary">Loading...</div>}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            label="Total opportunities"
            value={totalOpps}
            helper="Parsed from Telegram and other sources."
          />
          <StatCard
            label="Total matches"
            value={totalMatches}
            helper="Eligibility checks between users and opportunities."
          />
          <StatCard
            label="Pending reminders"
            value={reminders}
            helper="Alerts waiting to be sent."
          />
          <StatCard
            label="Profiles"
            value={users}
            helper="Users or resumes currently in the system."
          />
        </div>
      )}
    </div>
  );
}

