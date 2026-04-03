"use client";

import type { EmailLine } from "@/lib/email/render";
import { getTemplateColor } from "@/lib/email/templates";

interface EmailPreviewProps {
  lines: EmailLine[];
  templateId: string;
  fromName: string;
  toName: string;
  subject: string;
}

function EmailLineRenderer({ line, accentColor }: { line: EmailLine; accentColor: string }) {
  switch (line.type) {
    case "g":
      return <div className="h-2" />;
    case "txt":
      return <div className="text-xs leading-relaxed text-text-secondary">{line.value}</div>;
    case "hd":
      return <div className="text-xs font-bold uppercase tracking-wide text-text-primary">{line.value}</div>;
    case "lbl":
      return <div className="text-xs font-semibold text-text-primary">{line.value}</div>;
    case "lnk":
      return (
        <div className="text-xs">
          <span className="text-text-muted">{line.label}: </span>
          <span style={{ color: accentColor }}>{line.url}</span>
        </div>
      );
    case "bul":
      return (
        <div className="flex gap-2 text-xs text-text-secondary">
          <span className="text-text-dim">&bull;</span>
          <span>{line.value}</span>
        </div>
      );
    case "urg":
      return (
        <div className="rounded border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">
          {line.value}
        </div>
      );
    case "sig":
      return <div className="whitespace-pre-wrap text-xs text-text-muted">{line.value}</div>;
    case "div":
      return <div className="border-t border-border py-1 text-[8px] text-text-dim">{line.value}</div>;
    case "dis":
      return <div className="text-[10px] italic text-text-dim">{line.value}</div>;
    case "quote":
      return (
        <div className="border-l-2 border-text-dim/30 pl-3 text-[11px] italic text-text-dim">
          {line.value?.split("\n").map((l, i) => (
            <div key={i}>{`> ${l}`}</div>
          ))}
        </div>
      );
    default:
      return <div className="text-xs text-text-secondary">{line.value}</div>;
  }
}

export default function EmailPreview({ lines, templateId, fromName, toName, subject }: EmailPreviewProps) {
  const accentColor = getTemplateColor(templateId);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-bg-tertiary px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-dim">From</div>
            <div className="text-xs font-medium text-text-primary">{fromName}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-dim">To</div>
            <div className="text-xs text-text-secondary">{toName || "\u2014"}</div>
          </div>
        </div>
        {subject && (
          <div
            className="mt-2 rounded-md border px-3 py-1.5"
            style={{ borderColor: `${accentColor}25`, background: `${accentColor}08` }}
          >
            <div className="text-[10px] uppercase tracking-wider" style={{ color: `${accentColor}80` }}>
              Subject
            </div>
            <div className="text-xs font-medium" style={{ color: accentColor }}>
              {subject}
            </div>
          </div>
        )}
      </div>
      <div className="max-h-[calc(100vh-320px)] space-y-1.5 overflow-y-auto bg-bg-secondary p-4">
        {lines.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-dim">Fill in the form to see email preview</div>
        ) : (
          lines.map((line, i) => <EmailLineRenderer key={i} line={line} accentColor={accentColor} />)
        )}
      </div>
    </div>
  );
}
