export default function OpportunityCard({ opportunity, onApply }) {
  const { company, role, skills = [], deadline, link } = opportunity || {};

  return (
    <div className="card p-4 flex flex-col gap-3 bg-slate-900/80">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-textPrimary">{role}</h3>
          <p className="text-xs text-textSecondary">{company}</p>
        </div>
        {deadline && (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-textSecondary">
            Deadline: {deadline}
          </span>
        )}
      </div>
      {skills?.length > 0 && (
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
      )}
      <div className="flex justify-end gap-2 mt-1">
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs"
          >
            View
          </a>
        )}
        <button
          className="btn-primary text-xs"
          onClick={() => onApply?.(opportunity)}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

