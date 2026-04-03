import Link from "next/link";
import Badge from "@/components/ui/badge";

interface ApproachingDeadline {
  id: string;
  packageName: string;
  deadline: string | null;
  status: string;
}

interface ApproachingDeadlinesProps {
  rfqs: ApproachingDeadline[];
}

export default function ApproachingDeadlines({ rfqs }: ApproachingDeadlinesProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Approaching Deadlines</h3>
      </div>
      {rfqs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-dim">
          No deadlines approaching within 7 days.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {rfqs.map((rfq) => {
            const daysLeft = rfq.deadline
              ? Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
              
            return (
              <div key={rfq.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/rfq?selected=${rfq.id}`} className="truncate text-sm font-medium text-text-primary hover:text-accent transition-colors">
                    {rfq.packageName}
                  </Link>
                  <div className="text-xs text-text-dim">
                    {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "No deadline"}
                  </div>
                </div>
                <div>
                  {daysLeft !== null && (
                    <Badge variant={daysLeft <= 3 ? "error" : "warning"}>
                      {daysLeft} days left
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
