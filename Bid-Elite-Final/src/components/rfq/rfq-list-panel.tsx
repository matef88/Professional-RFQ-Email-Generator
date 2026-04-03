"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { TEMPLATES } from "@/lib/email/templates";
import type { RfqSummary } from "./rfq-split-layout";

interface RfqListPanelProps {
  rfqs: RfqSummary[];
  selectedRfqId: string | null;
  onSelectRfq: (id: string) => void;
  creatorMap?: Record<string, string>;
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  if (status === "draft") return "default";
  if (status === "sent") return "info";
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "default";
}

function getTemplateIcon(id: string | null): string {
  if (!id) return "\uD83D\uDCC4";
  return TEMPLATES.find((t) => t.id === id)?.icon ?? "\uD83D\uDCC4";
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export default function RfqListPanel({
  rfqs,
  selectedRfqId,
  onSelectRfq,
  creatorMap = {},
}: RfqListPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const filtered = rfqs.filter((rfq) => {
    const matchesSearch =
      !search ||
      rfq.packageName.toLowerCase().includes(search.toLowerCase()) ||
      (rfq.reference?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "" ? rfqs.length : rfqs.filter((r) => r.status === tab.value).length,
  }));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filtered.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filtered.length) {
            onSelectRfq(filtered[focusedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          setFocusedIndex(-1);
          break;
      }
    },
    [filtered, focusedIndex, onSelectRfq]
  );

  useEffect(() => {
    setFocusedIndex(-1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll("[data-rfq-card]");
      if (cards[focusedIndex]) {
        cards[focusedIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectedRfqs = rfqs.filter(r => selectedIds.has(r.id));
  const canDeleteAll = selectedRfqs.length > 0 && selectedRfqs.every(r => r.status === "draft");

  const handleBulkAction = (action: string) => {
    toast(`${action} action triggered for ${selectedIds.size} RFQs`, "success");
    setSelectedIds(new Set());
  };

  return (
    <div className="flex h-full flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">RFQs</h2>
          <Link href="/rfq/new">
            <Button size="sm">+ New</Button>
          </Link>
        </div>

        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder-text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
            <span className="text-xs font-medium text-accent">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction("Send")}
                className="text-[10px] font-medium text-accent hover:underline"
              >
                Send All
              </button>
              <button 
                onClick={() => handleBulkAction("Close")}
                className="text-[10px] font-medium text-accent hover:underline"
              >
                Close All
              </button>
              {canDeleteAll && (
                <button 
                  onClick={() => handleBulkAction("Delete")}
                  className="text-[10px] font-medium text-error hover:underline"
                >
                  Delete All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-border items-center">
        <label className="flex items-center pl-4 pr-2 py-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="rounded border-border text-accent focus:ring-accent" 
            checked={filtered.length > 0 && selectedIds.size === filtered.length}
            onChange={toggleSelectAll}
          />
        </label>
        {statusCounts.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex-1 px-1 py-2 text-center text-[10px] font-medium transition-colors ${
              statusFilter === tab.value
                ? "text-accent"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            <div>{tab.label}</div>
            <div className="mt-0.5 text-[9px]">{tab.count}</div>
          </button>
        ))}
      </div>

      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-text-dim">
            {rfqs.length === 0
              ? "No RFQs yet. Create your first RFQ to get started."
              : "No RFQs match your search."}
          </div>
        ) : (
          filtered.map((rfq, index) => {
            const isSelected = rfq.id === selectedRfqId;
            const isFocused = index === focusedIndex;
            return (
              <div
                key={rfq.id}
                data-rfq-card
                className={`w-full rounded-lg border flex overflow-hidden transition-colors ${
                  isSelected
                    ? "border-accent/50 bg-accent/5"
                    : isFocused
                      ? "border-accent/30 bg-bg-elevated/50"
                      : "border-transparent hover:border-border hover:bg-bg-elevated/30"
                }`}
              >
                <div className="pl-3 py-3 flex items-start" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="mt-1 rounded border-border text-accent focus:ring-accent cursor-pointer"
                    checked={selectedIds.has(rfq.id)}
                    onChange={(e) => toggleSelect(rfq.id, e as any)}
                  />
                </div>
                <button
                  onClick={() => onSelectRfq(rfq.id)}
                  className="flex-1 p-3 text-left focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-text-primary">
                        {rfq.packageName}
                      </div>
                    {rfq.reference && (
                      <div className="mt-0.5 truncate text-[10px] text-text-dim">
                        {rfq.reference}
                      </div>
                    )}
                  </div>
                  <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-text-dim">
                  <span className="flex items-center gap-0.5">
                    {getTemplateIcon(rfq.template)}
                  </span>
                  {rfq.deadline && (
                    <span className="flex items-center gap-0.5">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      {new Date(rfq.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {rfq.createdBy && creatorMap[rfq.createdBy] && (
                      <span>by {creatorMap[rfq.createdBy]}</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
