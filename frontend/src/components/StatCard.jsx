export default function StatCard({ label, value, helper }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-textSecondary">
        {label}
      </div>
      <div className="text-2xl font-semibold text-textPrimary">{value}</div>
      {helper && (
        <div className="text-xs text-textSecondary mt-1">{helper}</div>
      )}
    </div>
  );
}

