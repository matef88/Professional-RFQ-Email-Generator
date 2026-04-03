"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PricingCodeEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setCode(codeParam);
      handleVerify(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(authCode?: string) {
    const codeToVerify = authCode || code.trim();
    if (!codeToVerify) {
      setError("Please enter your access code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portal/pricing/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToVerify }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        setLoading(false);
        return;
      }

      router.push(`/portal/pricing/${data.invitationId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-center px-6 py-4">
          <div className="text-center">
            <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-sm font-bold text-white">
              EN
            </div>
            <h1 className="text-lg font-bold text-gray-900">Elite Nexus</h1>
            <p className="text-xs text-gray-500">Pricing Portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Enter Your Access Code
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter the 6-character code sent to your email to access the pricing form.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="mt-8 space-y-4"
          >
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] text-gray-900 placeholder:text-gray-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Access Package"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Don&apos;t have a code? Contact the bidding team for access.
        </p>
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        Powered by Elite Nexus
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <PricingCodeEntry />
    </Suspense>
  );
}
