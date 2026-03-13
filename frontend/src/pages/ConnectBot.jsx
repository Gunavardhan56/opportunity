export default function ConnectBot() {
  const bots = [
    {
      name: "Opportunity Scanner Bot",
      description: "Scans curated internship/job channels and forwards posts.",
      url: "https://t.me/your_opportunity_scanner_bot",
    },
    {
      name: "Internship Alert Bot",
      description:
        "Sends you high-signal internship alerts mapped to your skills.",
      url: "https://t.me/your_internship_alert_bot",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Connect Telegram bots
        </h1>
        <p className="text-sm text-textSecondary">
          Connect the bots once. They will continuously feed new opportunities
          into your Opportunity Intelligence workspace.
        </p>
      </div>
      <ol className="card p-4 space-y-2 text-sm text-textSecondary list-decimal list-inside">
        <li>Click a bot link below.</li>
        <li>Open it in Telegram on mobile or desktop.</li>
        <li>Press START to begin receiving opportunities.</li>
      </ol>
      <div className="grid md:grid-cols-2 gap-4">
        {bots.map((bot) => (
          <div key={bot.name} className="card p-4 space-y-2">
            <h2 className="text-sm font-semibold text-textPrimary">
              {bot.name}
            </h2>
            <p className="text-xs text-textSecondary">{bot.description}</p>
            <a
              href={bot.url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs mt-2 inline-flex"
            >
              Open in Telegram
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

