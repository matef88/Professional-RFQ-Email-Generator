"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/rfq": "RFQs",
  "/suppliers": "Suppliers",
  "/emails": "Emails",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) => path !== "/" && pathname.startsWith(path));
  return match?.[1] ?? "Bid Elite";
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-tertiary px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text-secondary lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#25252d] overflow-hidden">
            <Image
              src="/icon-light.png"
              alt="Elite Nexus"
              width={20}
              height={20}
            />
          </div>
          <span className="text-sm font-semibold text-text-primary">Bid Elite</span>
          <span className="mx-2 text-text-dim">/</span>
          <span className="text-sm text-text-muted">{getPageTitle(pathname)}</span>
        </div>
        <span className="text-sm font-medium text-text-primary lg:hidden">{getPageTitle(pathname)}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-xs font-medium text-text-secondary">
            {session?.user?.name ?? "User"}
          </div>
          <div className="text-[10px] text-text-dim capitalize">
            {session?.user?.role ?? "member"}
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
          {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-elevated hover:text-error"
          title="Sign out"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
