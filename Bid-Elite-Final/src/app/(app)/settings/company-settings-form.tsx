"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface CompanySettingsFormProps {
  settings: Record<string, string | null>;
  isAdmin: boolean;
  smtpConfigured: boolean;
}

export default function CompanySettingsForm({ settings, isAdmin, smtpConfigured }: CompanySettingsFormProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to save settings", "error");
        return;
      }

      toast("Settings saved successfully", "success");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) {
      toast("Please enter a test email address", "error");
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: `Test email sent to ${testEmail}` });
        toast("Test email sent successfully", "success");
      } else {
        setTestResult({ success: false, message: data.error ?? "Failed to send test email" });
        toast(data.error ?? "Failed to send test email", "error");
      }
    } catch {
      setTestResult({ success: false, message: "Network error" });
      toast("Failed to send test email", "error");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Company Settings</h3>
        {!isAdmin && (
          <p className="mt-0.5 text-xs text-text-dim">Read-only — only admins can edit</p>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Company Name"
            value={form.name ?? ""}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={!isAdmin}
          />
          <Input
            label="Short Name"
            value={form.shortName ?? ""}
            onChange={(e) => handleChange("shortName", e.target.value)}
            disabled={!isAdmin}
            hint="Used in logo/abbreviations"
          />
        </div>

        <Input
          label="Tagline"
          value={form.tagline ?? ""}
          onChange={(e) => handleChange("tagline", e.target.value)}
          disabled={!isAdmin}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={!isAdmin}
          />
          <Input
            label="Phone"
            value={form.phone ?? ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={!isAdmin}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Website"
            value={form.website ?? ""}
            onChange={(e) => handleChange("website", e.target.value)}
            disabled={!isAdmin}
            placeholder="https://"
          />
          <Input
            label="Logo URL"
            value={form.logoUrl ?? ""}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
            disabled={!isAdmin}
            placeholder="https://"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={form.city ?? ""}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={!isAdmin}
          />
          <Input
            label="Country"
            value={form.country ?? ""}
            onChange={(e) => handleChange("country", e.target.value)}
            disabled={!isAdmin}
          />
        </div>

        <Input
          label="Default Docs Link"
          value={form.docsLink ?? ""}
          onChange={(e) => handleChange("docsLink", e.target.value)}
          disabled={!isAdmin}
          placeholder="https://"
        />

        <div className="border-t border-border pt-4">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Email Signature</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Signature Team Name"
              value={form.signatureTeamName ?? ""}
              onChange={(e) => handleChange("signatureTeamName", e.target.value)}
              disabled={!isAdmin}
              placeholder="Bidding Team"
              hint="Team name shown in email signature"
            />
            <div />
            <Input
              label="Bidding Email"
              type="email"
              value={form.biddingEmail ?? ""}
              onChange={(e) => handleChange("biddingEmail", e.target.value)}
              disabled={!isAdmin}
              placeholder="bidding@elite-n.com"
            />
            <Input
              label="Admin Email"
              type="email"
              value={form.adminEmail ?? ""}
              onChange={(e) => handleChange("adminEmail", e.target.value)}
              disabled={!isAdmin}
              placeholder="info@elite-n.com"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">SMTP Email Configuration</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${smtpConfigured ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-xs text-text-secondary">
                {smtpConfigured ? "SMTP is configured — emails will be sent server-side" : "SMTP not configured — falling back to mailto: protocol"}
              </span>
            </div>
            <p className="text-xs text-text-dim">
              SMTP credentials are configured via environment variables (.env). Contact your server administrator to update SMTP settings.
            </p>
            {smtpConfigured && isAdmin && (
              <div className="space-y-3 rounded-lg border border-border bg-bg-tertiary p-4">
                <Input
                  label="Send Test Email To"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
                <Button onClick={handleTestEmail} disabled={sendingTest || !testEmail}>
                  {sendingTest ? "Sending..." : "Send Test Email"}
                </Button>
                {testResult && (
                  <div className={`text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
