"use client";

import { useEffect, useState } from "react";

interface ErrorState {
  hasError: boolean;
  message: string;
}

export function GlobalErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: "",
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setErrorState({
        hasError: true,
        message: event.message || "An unexpected error occurred",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setErrorState({
        hasError: true,
        message: "A background process failed",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (errorState.hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50 p-4">
        <div className="max-w-md rounded-xl border border-orange-200 bg-white p-6 shadow-lg">
          <h1 className="mb-2 text-xl font-bold text-orange-900">
            Oops! Something went wrong
          </h1>
          <p className="mb-4 text-sm text-orange-700">{errorState.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Reload page
            </button>
            <button
              onClick={() => {
                setErrorState({ hasError: false, message: "" });
              }}
              className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
