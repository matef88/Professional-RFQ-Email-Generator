import Badge from "@/components/ui/badge";

interface QuoteCardProps {
  supplierName: string;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  itemCount?: number;
  submittedAt: Date;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "shortlisted") return "success";
  if (status === "rejected") return "error";
  if (status === "under_review") return "info";
  return "default";
}

export default function QuoteCard({
  supplierName,
  totalAmount,
  currency,
  deliveryDays,
  validityDays,
  status,
  itemCount,
  submittedAt,
}: QuoteCardProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-border-light">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-primary">{supplierName}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-dim">
            {itemCount != null && <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>}
            <span>Submitted {new Date(submittedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Badge variant={statusVariant(status)}>
          {status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Amount</div>
          <div className="mt-0.5 text-sm font-bold text-accent">
            {totalAmount
              ? `${currency ?? "USD"} ${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "-"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Delivery</div>
          <div className="mt-0.5 text-sm font-medium text-text-secondary">
            {deliveryDays != null ? `${deliveryDays} days` : "-"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Validity</div>
          <div className="mt-0.5 text-sm font-medium text-text-secondary">
            {validityDays != null ? `${validityDays} days` : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
