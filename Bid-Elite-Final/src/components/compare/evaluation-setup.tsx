"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import type { EvaluationCriteria } from "@/lib/db/schema";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/utils/scoring";

interface EvaluationSetupProps {
  rfqId: string;
  criteria: EvaluationCriteria[];
  onCriteriaSaved: (criteria: EvaluationCriteria[]) => void;
}

const CRITERION_TYPES: { value: EvaluationCriteria["type"]; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "delivery", label: "Delivery" },
  { value: "quality", label: "Quality" },
  { value: "custom", label: "Custom" },
];

export default function EvaluationSetup({
  rfqId,
  criteria,
  onCriteriaSaved,
}: EvaluationSetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCriteria, setLocalCriteria] = useState<EvaluationCriteria[]>(
    criteria.length > 0 ? criteria : DEFAULT_EVALUATION_CRITERIA,
  );
  const [saving, setSaving] = useState(false);

  const totalWeight = localCriteria.reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100 && localCriteria.every((c) => c.name.trim().length > 0);

  function addCriterion() {
    setLocalCriteria((prev) => [
      ...prev,
      { name: "", weight: 0, type: "custom" },
    ]);
  }

  function removeCriterion(index: number) {
    setLocalCriteria((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCriterion(
    index: number,
    field: keyof EvaluationCriteria,
    value: string | number,
  ) {
    setLocalCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationCriteria: localCriteria }),
      });
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      onCriteriaSaved(localCriteria);
      setIsOpen(false);
    } catch {
      throw new Error("Failed to save evaluation criteria");
    } finally {
      setSaving(false);
    }
  }

  function handleUseDefault() {
    setLocalCriteria(DEFAULT_EVALUATION_CRITERIA);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-elevated/30"
      >
        <div>
          <div className="text-sm font-medium text-text-primary">
            Evaluation Criteria
          </div>
          <div className="text-xs text-text-dim">
            {criteria.length > 0
              ? `${criteria.length} criteria configured · Total weight: ${totalWeight}%`
              : "Click to configure scoring criteria"}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-text-dim transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          <div className="space-y-3">
            {localCriteria.map((criterion, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-bg-tertiary/50 p-3"
              >
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(e) => updateCriterion(idx, "name", e.target.value)}
                  placeholder="Criterion name"
                  className="flex-1 rounded-md border border-border bg-bg-secondary px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none"
                />
                <select
                  value={criterion.type}
                  onChange={(e) => updateCriterion(idx, "type", e.target.value)}
                  className="rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text-secondary"
                >
                  {CRITERION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={criterion.weight}
                    onChange={(e) =>
                      updateCriterion(idx, "weight", Number(e.target.value))
                    }
                    min={0}
                    max={100}
                    className="w-16 rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                  />
                  <span className="text-xs text-text-dim">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCriterion(idx)}
                  className="rounded p-1 text-text-dim hover:bg-error/10 hover:text-error"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addCriterion}
                className="text-xs text-accent hover:text-accent/80"
              >
                + Add Criterion
              </button>
              <span className="text-text-dim">·</span>
              <button
                type="button"
                onClick={handleUseDefault}
                className="text-xs text-text-dim hover:text-text-secondary"
              >
                Use Default
              </button>
            </div>
            <div
              className={`text-sm font-medium ${
                totalWeight === 100 ? "text-success" : "text-error"
              }`}
            >
              Total: {totalWeight}%{totalWeight !== 100 && " (must equal 100%)"}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isValid || saving}>
              {saving ? "Saving..." : "Save Criteria"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
