export function generateMailtoUrl(
  to: string,
  cc: string,
  subject: string,
  body: string,
): string {
  let url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (cc) {
    url += `&cc=${encodeURIComponent(cc)}`;
  }
  return url;
}

export function generateEmlContent(
  fromName: string,
  fromEmail: string,
  to: string,
  cc: string,
  subject: string,
  body: string,
  messageId: string,
): string {
  const lines: string[] = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
  ];
  if (cc) lines.push(`Cc: ${cc}`);
  lines.push(`Subject: ${subject}`);
  lines.push(`Date: ${new Date().toUTCString()}`);
  lines.push(`Message-ID: ${messageId}`);
  lines.push("MIME-Version: 1.0");
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("");
  lines.push(body);
  return lines.join("\r\n");
}

export function generateFilename(supplierName: string, extension: string): string {
  const safeName = (supplierName || "draft").replace(/[^a-zA-Z0-9]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `RFQ_${safeName}_${date}.${extension}`;
}
