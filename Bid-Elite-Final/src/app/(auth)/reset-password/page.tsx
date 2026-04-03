"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/icon-light.png"
          alt="Elite Nexus"
          width={36}
          height={36}
          priority
        />
        <span className="text-lg font-bold text-[#f0f2f5]">Elite Nexus</span>
      </div>

      <div className="w-full rounded-2xl border border-[#161620] bg-[#0c0c12] p-8">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#f0f2f5]">
              Password reset successful
            </h1>
            <p className="text-sm text-[#6b7280]">
              Redirecting you to the sign in page...
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-[#d97706] hover:text-[#f59e0b]"
            >
              Click here if not redirected
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-[#f0f2f5]">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                Enter your new password below.
              </p>
            </div>

            {!token && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                Invalid or missing reset token. Please request a new password
                reset link.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#bfc5d0]"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-[#161620] bg-[#0b0b10] px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a3f4d] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706]"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-[#bfc5d0]"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-[#161620] bg-[#0b0b10] px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a3f4d] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706]"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token || !password || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d97706] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#f59e0b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-[#d97706] hover:text-[#f59e0b]"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-[#d97706]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
