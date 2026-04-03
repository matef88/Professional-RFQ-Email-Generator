import Badge from "@/components/ui/badge";

interface RecentRfq {
  id: string;
  packageName: string;
  status: string;
  deadline: string | null;
  createdAt: Date;
  createdBy: string | null;
}

interface RecentRfqsProps {
  rfqs: RecentRfq[];
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "draft") return "default";
  if (status === "sent") return "info";
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "default";
}

export default function RecentRfqs({ rfqs }: RecentRfqsProps) {
  return (
    <div className="glass-card rounded-2xl">
      <div className="border-b border-white/5 px-6 py-5">
        <h3 className="text-sm font-semibold tracking-wide text-text-primary uppercase">Recent RFQs</h3>
      </div>
      {rfqs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-dim">
          No RFQs yet. Create your first RFQ to get started.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {rfqs.map(function renderRfq(rfq) {
            const deadlineLabel = rfq.deadline
              ? "Due: " + new Date(rfq.deadline).toLocaleDateString()
              : "No deadline";
            return (
              <div key={rfq.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-primary">{rfq.packageName}</div>
                  <div className="text-xs text-text-dim">{deadlineLabel}</div>
                </div>
                <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
