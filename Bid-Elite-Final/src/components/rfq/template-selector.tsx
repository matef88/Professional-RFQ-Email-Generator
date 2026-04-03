"use client";

import { RFQ_CREATION_TEMPLATES, type TemplateConfig } from "@/lib/email/templates";

interface TemplateSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {RFQ_CREATION_TEMPLATES.map((template: TemplateConfig) => {
        const active = value === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-all ${
              active
                ? "border-current shadow-sm"
                : "border-border hover:border-border-light hover:bg-bg-elevated/50"
            }`}
            style={
              active
                ? { color: template.color, background: `${template.color}10`, borderColor: `${template.color}40` }
                : undefined
            }
            title={template.description}
          >
            <span className="text-lg">{template.icon}</span>
            <span className="text-[11px] font-medium leading-tight">{template.name}</span>
          </button>
        );
      })}
    </div>
  );
}
