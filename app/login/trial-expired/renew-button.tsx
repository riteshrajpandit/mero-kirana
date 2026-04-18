"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { fetchWithCsrf } from "@/lib/client/csrf-token";
import { getErrorMessage } from "@/lib/client/error-message";

export default function RenewButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRenew = async () => {
    setError(null);
    setIsLoading(true);

    try {
        const response = await fetchWithCsrf("/api/subscription/renew", {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: unknown };

      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to renew subscription"));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to renew subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={onRenew}
        disabled={isLoading}
        className="min-h-12 rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Renewing..." : "Renew Subscription"}
      </button>

      {error ? (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
