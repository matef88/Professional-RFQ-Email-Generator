"use client";

import { useState, useCallback } from "react";
import RfqListPanel from "./rfq-list-panel";
import RfqDetailPanel from "./rfq-detail-panel";

export interface RfqSummary {
  id: string;
  packageName: string;
  reference: string | null;
  deadline: string | null;
  template: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RfqSplitLayoutProps {
  rfqs: RfqSummary[];
  selectedRfqId: string | null;
  creatorMap: Record<string, string>;
}

export default function RfqSplitLayout({ rfqs, selectedRfqId, creatorMap }: RfqSplitLayoutProps) {
  const [mobileView, setMobileView] = useState<"list" | "detail">(
    selectedRfqId ? "detail" : "list"
  );
  const [selectedId, setSelectedId] = useState<string | null>(selectedRfqId);

  const handleSelectRfq = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("detail");
    const url = new URL(window.location.href);
    url.searchParams.set("selected", id);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
    const url = new URL(window.location.href);
    url.searchParams.delete("selected");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div
        className={`w-full max-w-md shrink-0 border-r border-border lg:w-1/3 lg:block ${
          mobileView === "list" ? "block" : "hidden"
        }`}
      >
        <RfqListPanel
          rfqs={rfqs}
          selectedRfqId={selectedId}
          onSelectRfq={handleSelectRfq}
          creatorMap={creatorMap}
        />
      </div>

      <div
        className={`flex-1 overflow-hidden lg:block ${
          mobileView === "detail" ? "block" : "hidden"
        }`}
      >
        <RfqDetailPanel
          rfqId={selectedId}
          onBackToList={handleBackToList}
        />
      </div>
    </div>
  );
}
