const STYLES = {
  body: "margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;",
  wrapper: "max-width:600px;margin:0 auto;padding:20px 0;",
  container: "background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;",
  header: "background-color:#1a1a2e;padding:24px 32px;text-align:center;",
  headerName: "color:#d4a44c;font-size:22px;font-weight:700;margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;",
  headerTagline: "color:#999999;font-size:12px;margin:4px 0 0 0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;",
  content: "padding:28px 32px;",
  greeting: "color:#1a1a2e;font-size:15px;line-height:1.6;margin:0 0 16px 0;",
  text: "color:#333333;font-size:14px;line-height:1.7;margin:0 0 12px 0;",
  label: "color:#1a1a2e;font-size:14px;font-weight:600;margin:0 0 4px 0;",
  link: "display:inline-block;background-color:#d4a44c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;margin:12px 0;",
  linkFallback: "color:#d4a44c;font-size:13px;margin:4px 0 12px 0;",
  bullet: "color:#333333;font-size:14px;line-height:1.7;margin:4px 0 4px 16px;",
  urgency: "background-color:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin:12px 0;color:#856404;font-size:14px;font-weight:500;",
  heading: "color:#1a1a2e;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;",
  divider: "border:none;border-top:1px solid #e0e0e0;margin:20px 0;",
  quote: "color:#666666;font-size:13px;line-height:1.6;margin:4px 0;padding-left:12px;border-left:3px solid #d4a44c;",
  signature: "color:#666666;font-size:13px;line-height:1.6;margin:16px 0 0 0;",
  footer: "background-color:#f8f8f8;padding:16px 32px;border-top:1px solid #e0e0e0;",
  footerText: "color:#999999;font-size:11px;line-height:1.5;margin:0;",
  footerLink: "color:#d4a44c;text-decoration:none;",
  disclaimer: "color:#aaaaaa;font-size:11px;font-style:italic;line-height:1.5;margin:0;padding-top:8px;",
};

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ParsedLine {
  type: string;
  value?: string;
  label?: string;
  url?: string;
}

function parseTextBody(text: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  const rawLines = text.split("\n");

  for (const line of rawLines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      continue;
    }

    if (trimmed.match(/^[•\-]\s/)) {
      lines.push({ type: "bul", value: trimmed.replace(/^[•\-]\s/, "") });
      continue;
    }

    if (trimmed.startsWith(">")) {
      lines.push({ type: "quote", value: trimmed.replace(/^>\s*/, "") });
      continue;
    }

    if (trimmed.startsWith("━━")) {
      lines.push({ type: "div" });
      continue;
    }

    const linkMatch = trimmed.match(/^(Submit Quote|Download Package Details|Company Documents):\s*(.+)$/);
    if (linkMatch) {
      lines.push({ type: "lnk", label: linkMatch[1], url: linkMatch[2] });
      continue;
    }

    if (trimmed.match(/^(URGENT|⚠️|⏰|REMINDER)/)) {
      lines.push({ type: "urg", value: trimmed });
      continue;
    }

    if (trimmed.startsWith("Package:") || trimmed.startsWith("Reference:") || trimmed.startsWith("Submission Deadline:")) {
      lines.push({ type: "lbl", value: trimmed });
      continue;
    }

    if (trimmed.startsWith("Best regards")) {
      lines.push({ type: "sig", value: trimmed });
      continue;
    }

    lines.push({ type: "txt", value: trimmed });
  }

  return lines;
}

function renderLineToHtml(line: ParsedLine): string {
  switch (line.type) {
    case "bul":
      return `<p style="${STYLES.bullet}">&bull; ${esc(line.value ?? "")}</p>`;
    case "quote":
      return `<p style="${STYLES.quote}">${esc(line.value ?? "")}</p>`;
    case "div":
      return `<hr style="${STYLES.divider}" />`;
    case "lnk":
      return `<p style="${STYLES.linkFallback}">${esc(line.label ?? "")}: <a href="${esc(line.url ?? "")}" style="${STYLES.footerLink}">${esc(line.url ?? "")}</a></p>`;
    case "urg":
      return `<div style="${STYLES.urgency}">${esc(line.value ?? "")}</div>`;
    case "lbl":
      return `<p style="${STYLES.label}">${esc(line.value ?? "")}</p>`;
    case "sig": {
      const sigLines = (line.value ?? "").split("\n");
      return `<p style="${STYLES.signature}">${sigLines.map((l) => esc(l)).join("<br/>")}</p>`;
    }
    default:
      return `<p style="${STYLES.text}">${esc(line.value ?? "")}</p>`;
  }
}

export function renderHtmlEmail(plainTextBody: string, subject: string): string {
  const parsed = parseTextBody(plainTextBody);

  const bodyHtml = parsed.map(renderLineToHtml).join("\n");

  const portalLink = parsed.find((l) => l.type === "lnk" && l.label === "Submit Quote");
  const linkButtonHtml = portalLink
    ? `<div style="text-align:center;margin:20px 0;">
         <a href="${esc(portalLink.url ?? "")}" style="${STYLES.link}">Submit Quote</a>
       </div>`
    : "";

  const disclaimerLine = parsed.find((l) => l.type === "txt" && (l.value?.includes("confidential") || l.value?.includes("disclaimer")));
  const disclaimerHtml = disclaimerLine
    ? `<p style="${STYLES.disclaimer}">${esc(disclaimerLine.value ?? "")}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(subject)}</title>
</head>
<body style="${STYLES.body}">
<div style="${STYLES.wrapper}">
  <div style="${STYLES.container}">
    <div style="${STYLES.header}">
      <h1 style="${STYLES.headerName}">Elite Nexus</h1>
      <p style="${STYLES.headerTagline}">Premium Fit-Out &amp; Technical Solutions</p>
    </div>
    <div style="${STYLES.content}">
      ${bodyHtml}
      ${linkButtonHtml}
    </div>
    <div style="${STYLES.footer}">
      <p style="${STYLES.footerText}">
        <strong>Elite Nexus</strong> &mdash; Riyadh<br/>
        <a href="https://elite-n.com" style="${STYLES.footerLink}">elite-n.com</a><br/>
        <a href="mailto:bidding@elite-n.com" style="${STYLES.footerLink}">bidding@elite-n.com</a> &bull;
        <a href="mailto:info@elite-n.com" style="${STYLES.footerLink}">info@elite-n.com</a>
      </p>
      ${disclaimerHtml}
    </div>
  </div>
</div>
</body>
</html>`;
}
