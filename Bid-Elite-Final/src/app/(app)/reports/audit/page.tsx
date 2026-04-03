"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import Input from "@/components/ui/input";

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface AuditFilters {
  entityTypes: string[];
  actions: string[];
  users: Array<{ id: string; name: string; email: string }>;
}

function actionLabel(action: string) {
  return action
    .split(".")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function entityTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function AuditLogPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    entityTypes: [],
    actions: [],
    users: [],
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session && session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (entityType) params.set("entityType", entityType);
    if (userId) params.set("userId", userId);
    if (action) params.set("action", action);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/reports/audit?${params.toString()}`);
      const data = await res.json();
      if (data.error) return;
      setEntries(data.entries);
      setTotal(data.total);
      if (data.filters) {
        setFilters(data.filters);
      }
    } finally {
      setLoading(false);
    }
  }, [page, entityType, userId, action, startDate, endDate, search]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  function exportCsv() {
    const headers = ["Timestamp", "User", "Email", "Action", "Entity Type", "Entity ID", "IP Address", "Details"];
    const rows = entries.map((e) => [
      new Date(e.createdAt).toISOString(),
      e.userName ?? "",
      e.userEmail ?? "",
      e.action,
      e.entityType,
      e.entityId ?? "",
      e.ipAddress ?? "",
      e.details ? JSON.stringify(e.details) : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 50);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
          <p className="text-sm text-text-muted">
            Complete activity history ({total} entries)
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={entries.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-bg-secondary p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={filters.entityTypes.map((t) => ({
            value: t,
            label: entityTypeLabel(t),
          }))}
          placeholder="Entity Type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={filters.actions.map((a) => ({
            value: a,
            label: actionLabel(a),
          }))}
          placeholder="Action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={filters.users.map((u) => ({
            value: u.id,
            label: u.name,
          }))}
          placeholder="User"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          placeholder="Start date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          placeholder="End date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-text-muted">Timestamp</th>
                <th className="px-5 py-3 text-xs font-medium text-text-muted">User</th>
                <th className="px-5 py-3 text-xs font-medium text-text-muted">Action</th>
                <th className="px-5 py-3 text-xs font-medium text-text-muted">Entity Type</th>
                <th className="px-5 py-3 text-xs font-medium text-text-muted">Entity ID</th>
                <th className="px-5 py-3 text-xs font-medium text-text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-dim">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-bg-elevated/50">
                    <td className="whitespace-nowrap px-5 py-3 text-text-secondary">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-text-primary">{entry.userName ?? "System"}</div>
                      {entry.userEmail && (
                        <div className="text-xs text-text-dim">{entry.userEmail}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {actionLabel(entry.action)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-bg-elevated px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {entityTypeLabel(entry.entityType)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-text-dim">
                        {entry.entityId ? entry.entityId.substring(0, 8) + "..." : "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {entry.details ? (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === entry.id ? null : entry.id)
                          }
                          className="text-xs font-medium text-accent hover:text-accent-hover"
                        >
                          {expandedId === entry.id ? "Hide" : "View"}
                        </button>
                      ) : (
                        <span className="text-xs text-text-dim">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {expandedId && (
          <div className="border-t border-border bg-bg-tertiary">
            {entries
              .filter((e) => e.id === expandedId)
              .map((entry) => (
                <div key={entry.id} className="p-5">
                  <pre className="overflow-auto rounded-lg bg-bg-primary p-4 text-xs text-text-secondary">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Page {page} of {totalPages} ({total} entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
