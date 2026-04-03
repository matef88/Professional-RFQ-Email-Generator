import Link from "next/link";
import Badge from "@/components/ui/badge";

interface RfqCardProps {
  id: string;
  packageName: string;
  reference?: string | null;
  status: string;
  deadline?: string | null;
  template?: string | null;
  supplierCount?: number;
  quoteCount?: number;
  createdAt?: Date | null;
  className?: string;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "draft") return "default";
  if (status === "sent") return "info";
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "default";
}

export default function RfqCard({
  id,
  packageName,
  reference,
  status,
  deadline,
  supplierCount,
  quoteCount,
  createdAt,
  className = "",
}: RfqCardProps) {
  return (
    <Link href={`/rfq/${id}`}>
      <div
        className={`rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent/30 hover:bg-bg-elevated/50 ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {packageName}
            </h3>
            {reference && (
              <p className="text-xs text-text-dim">{reference}</p>
            )}
          </div>
          <Badge variant={statusVariant(status)}>{status}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          {deadline && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {new Date(deadline).toLocaleDateString()}
            </span>
          )}
          {supplierCount !== undefined && (
            <span>{supplierCount} supplier{supplierCount !== 1 ? "s" : ""}</span>
          )}
          {quoteCount !== undefined && (
            <span>{quoteCount} quote{quoteCount !== 1 ? "s" : ""}</span>
          )}
          {createdAt && (
            <span>Created {new Date(createdAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
