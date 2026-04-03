import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getCompanySettings } from "@/lib/company";
import CompanySettingsForm from "./company-settings-form";
import Link from "next/link";
import { isSmtpConfigured } from "@/lib/email/smtp";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "member";
  const isAdmin = role === "admin";

  let settings: Record<string, string | null> = {
    name: "",
    shortName: "",
    tagline: null,
    email: null,
    website: null,
    phone: null,
    city: null,
    country: null,
    docsLink: null,
    logoUrl: null,
    biddingEmail: null,
    adminEmail: null,
    signatureTeamName: null,
  };

  try {
    const dbSettings = await getCompanySettings();
    if (dbSettings) {
      settings = {
        name: dbSettings.name ?? "",
        shortName: dbSettings.shortName ?? "",
        tagline: dbSettings.tagline ?? null,
        email: dbSettings.email ?? null,
        website: dbSettings.website ?? null,
        phone: dbSettings.phone ?? null,
        city: dbSettings.city ?? null,
        country: dbSettings.country ?? null,
        docsLink: dbSettings.docsLink ?? null,
        logoUrl: dbSettings.logoUrl ?? null,
        biddingEmail: dbSettings.biddingEmail ?? null,
        adminEmail: dbSettings.adminEmail ?? null,
        signatureTeamName: dbSettings.signatureTeamName ?? null,
      };
    }
  } catch {
    // DB not connected yet
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">
          {isAdmin ? "Manage company settings, team, and your profile" : "View company settings and your profile"}
        </p>
      </div>

      <CompanySettingsForm settings={settings} isAdmin={isAdmin} smtpConfigured={isSmtpConfigured()} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/settings/profile"
          className="rounded-xl border border-border bg-bg-secondary p-5 transition-colors hover:bg-bg-elevated"
        >
          <h3 className="text-sm font-semibold text-text-primary">Profile</h3>
          <p className="mt-1 text-xs text-text-muted">Update your name, email, and password</p>
        </Link>

        {isAdmin && (
          <Link
            href="/settings/team"
            className="rounded-xl border border-border bg-bg-secondary p-5 transition-colors hover:bg-bg-elevated"
          >
            <h3 className="text-sm font-semibold text-text-primary">Team</h3>
            <p className="mt-1 text-xs text-text-muted">Manage team members and roles</p>
          </Link>
        )}
      </div>
    </div>
  );
}
