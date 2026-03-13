export default function StatCard({ label, value, helper }) {
  return (
    <div className="card p-4 flex flex-col gap-2 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-900/60">
      <div className="text-xs uppercase tracking-wide text-textSecondary/80">
        {label}
      </div>
      <div className="text-3xl font-semibold text-textPrimary">{value}</div>
      {helper && (
        <div className="text-xs text-textSecondary mt-1">{helper}</div>
      )}
    </div>
  );
}

