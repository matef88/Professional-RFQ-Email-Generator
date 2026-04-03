"use client";

import { useState, useRef, useEffect } from "react";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select...",
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[];

  function toggle(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  function selectAll() {
    const allValues = filtered.map((o) => o.value);
    const newValues = [...new Set([...selectedValues, ...allValues])];
    onChange(newValues);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[38px] cursor-pointer rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm transition-colors hover:border-text-dim"
      >
        {selectedLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedLabels.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
              >
                {opt.value}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.value);
                  }}
                  className="ml-0.5 hover:text-text-primary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-text-dim">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-secondary shadow-xl">
          <div className="border-b border-border p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2 border-b border-border px-3 py-1.5">
            <button
              onClick={selectAll}
              className="text-[11px] font-medium text-accent hover:text-accent/80"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-[11px] font-medium text-text-dim hover:text-text-secondary"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-text-dim">
                No options found
              </div>
            ) : (
              filtered.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-bg-elevated/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="h-3.5 w-3.5 rounded border-border accent-accent"
                  />
                  <span className="text-xs text-text-primary">{opt.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
