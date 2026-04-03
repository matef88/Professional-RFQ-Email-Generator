import Link from "next/link";

export default function PortalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">RFQ Not Found</h2>
        <p className="mt-2 text-gray-500">
          This link is invalid or has expired. Please contact the sender for a valid link.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
