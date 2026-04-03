"use client";

import LoginForm from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-[#161620] shadow-2xl lg:max-w-5xl">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#12121a] to-[#0b0b10] p-10 lg:flex lg:w-1/2">
        <div>
          <Image
            src="/logo-light.png"
            alt="Elite Nexus"
            width={260}
            height={98}
            className="mb-8"
            priority
          />
          <h2 className="mt-4 text-xl font-semibold text-[#f0f2f5]">
            RFQ &amp; Bidding Management Platform
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
            Streamline your procurement process. Create RFQs, collect supplier
            quotes, and compare bids — all in one place.
          </p>
        </div>

        <div className="space-y-3">
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm text-[#bfc5d0]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d97706]/10">
                <svg className="h-4 w-4 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              Manage RFQs &amp; Supplier Communications
            </li>
            <li className="flex items-center gap-3 text-sm text-[#bfc5d0]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d97706]/10">
                <svg className="h-4 w-4 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              Track Quotes &amp; Compare Bids
            </li>
            <li className="flex items-center gap-3 text-sm text-[#bfc5d0]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d97706]/10">
                <svg className="h-4 w-4 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </span>
              Supplier Portal for Direct Submissions
            </li>
          </ul>
        </div>

        <div className="text-xs text-[#3a3f4d]">
          <a
            href="https://elite-n.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#6b7280]"
          >
            elite-n.com
          </a>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <Image
            src="/icon-light.png"
            alt="Elite Nexus"
            width={40}
            height={40}
            priority
          />
          <span className="text-lg font-bold text-[#f0f2f5]">Elite Nexus</span>
        </div>

        <div className="mb-6 text-center lg:text-left lg:w-full lg:max-w-sm">
          <h1 className="text-2xl font-bold text-[#f0f2f5]">Sign In</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Access your bidding dashboard
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
