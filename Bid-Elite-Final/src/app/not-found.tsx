import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-text-dim">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">
          Page Not Found
        </h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
