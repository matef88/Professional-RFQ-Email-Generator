"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge";

interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  rfqId: string | null;
  rfqPackageName: string | null;
  rfqReference: string | null;
  itemCount: number;
  createdAt: Date;
}

export default function PackagesListClient({
  packages: pkgs,
  invitedCountMap,
  submittedCountMap,
}: {
  packages: PackageRow[];
  invitedCountMap: Record<string, number>;
  submittedCountMap: Record<string, number>;
}) {
  const [search, setSearch] = useState("");

  const filtered = pkgs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.rfqPackageName && p.rfqPackageName.toLowerCase().includes(search.toLowerCase())) ||
      (p.rfqReference && p.rfqReference.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Link
          href="/packages/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Package
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary py-16 text-center">
          <svg
            className="mx-auto h-12 w-12 text-text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <p className="mt-3 text-sm text-text-muted">
            {search ? "No packages match your search" : "No packages yet. Create your first package to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Package Name</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">RFQ Reference</th>
                <th className="px-4 py-3 text-center font-medium text-text-secondary">Items</th>
                <th className="px-4 py-3 text-center font-medium text-text-secondary">Invited</th>
                <th className="px-4 py-3 text-center font-medium text-text-secondary">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pkg) => {
                const invited = invitedCountMap[pkg.id] || 0;
                const submitted = submittedCountMap[pkg.id] || 0;
                return (
                  <tr
                    key={pkg.id}
                    className="border-b border-border last:border-b-0 hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/packages/${pkg.id}`}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {pkg.name}
                      </Link>
                      {pkg.description && (
                        <p className="mt-0.5 text-xs text-text-dim line-clamp-1">{pkg.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {pkg.rfqReference || pkg.rfqPackageName || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-text-muted">{pkg.itemCount}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="default">{invited}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={submitted > 0 ? "success" : "default"}>
                        {submitted} / {invited || 0}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-dim">
                      {new Date(pkg.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
