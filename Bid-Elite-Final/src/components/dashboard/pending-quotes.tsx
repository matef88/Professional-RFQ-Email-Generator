import Badge from "@/components/ui/badge";

interface PendingQuote {
  id: string;
  packageName: string;
  supplierName: string;
  totalAmount: string | null;
  currency: string | null;
  submittedAt: Date;
}

interface PendingQuotesProps {
  quotes: PendingQuote[];
}

export default function PendingQuotes({ quotes }: PendingQuotesProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Pending Quotes</h3>
      </div>
      {quotes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-dim">
          No pending quotes. Quotes from suppliers will appear here.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">{q.packageName}</div>
                <div className="text-xs text-text-dim">
                  from {q.supplierName} &middot; {new Date(q.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                {q.totalAmount ? (
                  <div className="text-sm font-semibold text-accent">
                    {q.currency ?? "USD"} {q.totalAmount}
                  </div>
                ) : (
                  <Badge variant="warning">Awaiting</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
