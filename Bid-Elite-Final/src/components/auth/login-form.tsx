"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("bidelite_remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const validateEmail = useCallback(() => {
    if (!email) {
      setEmailError("");
      return;
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailError(valid ? "" : "Please enter a valid email address");
  }, [email]);

  const validatePassword = useCallback(() => {
    if (!password) {
      setPasswordError("");
      return;
    }
    setPasswordError(password.length < 6 ? "Password must be at least 6 characters" : "");
  }, [password]);

  useEffect(() => {
    validateEmail();
  }, [validateEmail]);

  useEffect(() => {
    validatePassword();
  }, [validatePassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (emailError || passwordError) return;
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      if (rememberMe) {
        localStorage.setItem("bidelite_remember_email", email);
      } else {
        localStorage.removeItem("bidelite_remember_email");
      }
      router.push("/");
      router.refresh();
    }
  }

  const isFormValid = email && password && !emailError && !passwordError;

  return (
    <div className="w-full max-w-sm space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="animate-fade-in rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-[#bfc5d0]"
          >
            Email
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validateEmail}
              required
              className="block w-full rounded-lg border border-[#161620] bg-[#0c0c12] py-2.5 pl-10 pr-3 text-sm text-[#f0f2f5] placeholder-[#3a3f4d] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706]"
              placeholder="you@company.com"
            />
          </div>
          {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-[#bfc5d0]"
          >
            Password
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              required
              className="block w-full rounded-lg border border-[#161620] bg-[#0c0c12] py-2.5 pl-10 pr-10 text-sm text-[#f0f2f5] placeholder-[#3a3f4d] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6b7280] hover:text-[#bfc5d0]"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[#6b7280]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#161620] bg-[#0c0c12] text-[#d97706] focus:ring-[#d97706]"
            />
            Remember me
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-[#d97706] hover:text-[#f59e0b]"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d97706] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#f59e0b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

    </div>
  );
}
