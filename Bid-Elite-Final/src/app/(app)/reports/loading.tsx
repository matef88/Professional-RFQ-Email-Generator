export default function ReportsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-md bg-bg-elevated" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-bg-card p-5"
          >
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="mt-3 h-8 w-16 rounded bg-bg-elevated" />
            <div className="mt-2 h-3 w-32 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-bg-card p-5"
          >
            <div className="h-5 w-32 rounded bg-bg-elevated" />
            <div className="mt-4 h-48 w-full rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
