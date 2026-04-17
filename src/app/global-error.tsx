"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-xl border bg-white shadow-sm p-6 sm:p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              A critical error occurred. Please try refreshing — if it keeps
              happening, we&rsquo;ve been notified and we&rsquo;re on it.
            </p>
            {error.digest && (
              <p className="mt-3 text-xs text-gray-400 font-mono">
                Ref: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 flex-1 h-10 rounded-md bg-[#4361ee] text-white text-sm font-medium hover:opacity-90 transition"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="inline-flex items-center justify-center gap-2 flex-1 h-10 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 transition"
              >
                <Home className="h-4 w-4" /> Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
