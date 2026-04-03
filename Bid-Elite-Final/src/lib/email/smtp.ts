import nodemailer from "nodemailer";
import { renderHtmlEmail } from "./html-template";

let _transporter: nodemailer.Transporter | null = null;

let _lastSendTime = 0;
const MIN_SEND_INTERVAL_MS = 200;

async function throttle() {
  const now = Date.now();
  const elapsed = now - _lastSendTime;
  if (elapsed < MIN_SEND_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_SEND_INTERVAL_MS - elapsed));
  }
  _lastSendTime = Date.now();
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getSmtpFrom(): { name: string; email: string } {
  return {
    name: process.env.SMTP_FROM_NAME ?? "Bidding Team",
    email: process.env.SMTP_FROM_EMAIL ?? "bidding@elite-n.com",
  };
}

export function getDefaultCc(): string[] {
  const cc = process.env.SMTP_CC_DEFAULT;
  if (!cc) return [];
  return cc.split(",").map((s) => s.trim()).filter(Boolean);
}

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  return _transporter;
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return { success: false, error: "SMTP not configured" };
  }

  const from = getSmtpFrom();

  const htmlBody = params.html ?? renderHtmlEmail(params.text, params.subject);

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${from.name}" <${from.email}>`,
    to: params.to.join(", "),
    cc: params.cc?.join(", "),
    bcc: params.bcc?.join(", "),
    subject: params.subject,
    text: params.text,
    html: htmlBody,
    replyTo: params.replyTo,
    messageId: params.messageId,
    inReplyTo: params.inReplyTo,
    references: params.references?.join(" "),
  };

  try {
    await throttle();
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    try {
      await throttle();
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (retryErr: unknown) {
      const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
      return { success: false, error: `${errorMsg}; retry: ${retryMsg}` };
    }
  }
}

export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
