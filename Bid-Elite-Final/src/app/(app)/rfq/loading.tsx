export default function RfqLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-md bg-bg-elevated" />
        <div className="h-9 w-32 rounded-lg bg-bg-elevated" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-24 rounded bg-bg-elevated" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <div className="h-4 w-40 rounded bg-bg-elevated" />
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-4 w-20 rounded bg-bg-elevated" />
            <div className="h-4 w-16 rounded bg-bg-elevated" />
            <div className="h-4 w-20 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
