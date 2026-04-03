import { cookies } from "next/headers";
import { verifyPortalToken, type PortalTokenPayload } from "@/lib/auth/portal-auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: PortalTokenPayload | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("portal_session")?.value;
    if (token) {
      session = await verifyPortalToken(token);
    }
  } catch {
    session = null;
  }

  if (session) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-sm font-bold text-white">
                EN
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Elite Nexus</p>
                <p className="text-[10px] text-gray-500">Supplier Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <SidebarLink href="/portal/dashboard" icon="dashboard" label="Dashboard" />
            <SidebarLink href="/portal/quotes" icon="quotes" label="My Quotes" />
            <SidebarLink href="/portal/profile" icon="profile" label="Profile" />
          </nav>

          <div className="border-t border-gray-200 px-5 py-4">
            <p className="truncate text-xs font-medium text-gray-900">
              {session.name}
            </p>
            <p className="truncate text-[10px] text-gray-500">{session.email}</p>
            <form action="/api/portal/logout" method="POST" className="mt-2">
              <button
                type="submit"
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-6 py-6">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {children}
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "dashboard" | "quotes" | "profile";
  label: string;
}) {
  const icons = {
    dashboard: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    quotes: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    profile: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      {icons[icon]}
      {label}
    </a>
  );
}
